import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { load } from 'cheerio';
const base = '/Montunar.github.io/';
test('home is light, has real navigation, and loads no music or original photography', async ({
  page,
}) => {
  const requests: string[] = [];
  const errors: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('思考地方');
  await page.waitForLoadState('networkidle');
  expect(requests.filter((url) => url.includes('/audio/') || url.includes('/images/'))).toEqual([]);
  expect(requests.filter((url) => /home-(light|dark)\.webp/.test(url))).toHaveLength(1);
  expect(requests.filter((url) => !url.startsWith('http://127.0.0.1:4322/'))).toEqual([]);
  expect(errors).toEqual([]);
  await expect(page.locator('audio')).not.toHaveAttribute('src');
  await page.getByRole('link', { name: /进入博客/ }).click();
  await expect(page).toHaveURL(/\/journal\/$/);
  await page.getByRole('link', { name: '慢慢谈说', exact: true }).click();
  await expect(page.locator('.notebook-cover')).toHaveCount(3);
  await page.getByRole('link', { name: /思考与探索/ }).click();
  await expect(page).toHaveURL(/\/categories\/thinking\/$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/talking\/$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/categories\/thinking\/$/);
});

test('every migrated article has a rendered direct page, metadata, search text and a valid fragment', async ({
  request,
}) => {
  const manifest = JSON.parse(await readFile('docs/migration-manifest.json', 'utf8'));
  const response = await request.get('search-index.json');
  expect(response.ok()).toBeTruthy();
  const index = await response.json();
  expect(index.length).toBeGreaterThanOrEqual(manifest.originalArticleCount);
  const results = await Promise.all(
    manifest.articles.map(async (entry: { slug: string; title: string; source: string }) => {
      const [page, fragment] = await Promise.all([
        request.get(`posts/${entry.slug}/`),
        request.get(`content/${entry.slug}.json`),
      ]);
      const html = await page.text();
      const payload = await fragment.json();
      const source = await readFile(entry.source, 'utf8');
      const phrases = Array.from(source.matchAll(/[\u4e00-\u9fff]{5,12}/g), (match) => match[0]);
      const samples = [phrases[0], phrases[Math.floor(phrases.length / 2)], phrases.at(-1)].filter(
        Boolean,
      );
      const renderedText = load(payload.html).text();
      return {
        slug: entry.slug,
        status: page.status(),
        fragmentStatus: fragment.status(),
        title: payload.title,
        expected: entry.title,
        canonical: html.includes(`https://qianshanyuewu.github.io${base}posts/${entry.slug}/`),
        prose: html.includes('id="article-prose"'),
        structured: html.includes('BlogPosting'),
        fragment: typeof payload.html === 'string' && payload.html.length > 10,
        sourceText:
          samples.length > 0 &&
          samples.every(
            (sample) =>
              renderedText.includes(sample) && load(html)('#article-prose').text().includes(sample),
          ),
        indexed: index.some(
          (x: { url: string; body: string }) =>
            x.url === `${base}posts/${entry.slug}/` && x.body.trim().length > 0,
        ),
      };
    }),
  );
  expect(
    results.filter(
      (r) =>
        r.status !== 200 ||
        r.fragmentStatus !== 200 ||
        r.title !== r.expected ||
        !r.canonical ||
        !r.prose ||
        !r.structured ||
        !r.fragment ||
        !r.sourceText ||
        !r.indexed,
    ),
  ).toEqual([]);
  expect(
    manifest.articles.find((x: { originalFilename: string }) =>
      x.originalFilename.includes('20251127_第七十八天'),
    ).slug,
  ).toBe('exam-2025-11-27');
  const report = await request.get('posts/technology-2025-05-23/');
  expect(await report.text()).toContain(`${base}assets/documents/research_report.pdf`);
  expect((await request.get('assets/documents/research_report.pdf')).status()).toBe(200);
  expect((await request.get('favicon.ico')).status()).toBe(200);
});

test('direct article refresh, adjacent articles, theme, font sizing and immersive reading', async ({
  page,
}) => {
  await page.goto('posts/thinking-2025-09-27/');
  const text = await page.locator('#article-prose').textContent();
  expect(text!.length).toBeGreaterThan(100);
  await page.reload();
  await expect(page.locator('#article-prose')).toHaveText(text!);
  const before = await page.locator('html').getAttribute('data-theme');
  await page.locator('#theme-toggle').click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute(
    'data-theme',
    before === 'dark' ? 'light' : 'dark',
  );
  await page.locator('#settings-toggle').click();
  const original = await page
    .locator('#article-prose')
    .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  await page.locator('#reading-settings [data-font="10"]').click();
  expect(
    await page
      .locator('#article-prose')
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
  ).toBeGreaterThan(original);
  await page.locator('[data-immersive-page]').click();
  await expect(page.locator('#immersive-dialog')).toBeVisible();
  await expect(page.locator('#immersive-heading')).toHaveText('致某个网友');
  await expect(page.locator('#immersive-body')).toHaveText(text!);
  await page.keyboard.press('Escape');
  await expect(page.locator('#immersive-dialog')).not.toBeVisible();
  await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
  await page.locator('.article-pagination a').first().click();
  await expect(page.locator('#article-prose')).toBeVisible();
  expect(
    await page.locator('html').evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  ).toBeTruthy();
});

test('full-text search updates after slow loading, navigates directly, and escapes input', async ({
  page,
  request,
}) => {
  const index = await (await request.get('search-index.json')).json();
  const entry = index.find((x: { body: string }) => x.body.length > 1000);
  const keyword = (entry.body.slice(200).match(/[\u4e00-\u9fff]{4,8}/g) as string[]).find(
    (word) => !entry.title.includes(word) && !entry.description.includes(word),
  )!;
  expect(keyword).toBeTruthy();
  await page.route('**/search-index.json', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    await route.continue();
  });
  await page.goto('./');
  await page.locator('#search-toggle').click();
  await page.locator('#search-input').fill(keyword);
  await expect(page.locator('#search-status')).toHaveText('正在加载搜索内容…');
  await expect(
    page.locator('#search-results').getByRole('heading', { name: entry.title, exact: true }),
  ).toBeVisible();
  await page
    .locator('#search-results')
    .getByRole('link')
    .filter({ has: page.getByRole('heading', { name: entry.title, exact: true }) })
    .click();
  await expect(page).toHaveURL(new RegExp(entry.url + '$'));
  await page.locator('#search-toggle').click();
  await page.locator('#search-input').fill('<img src=x onerror=alert(1)>');
  await expect(page.locator('#search-status')).toContainText('<img src=x onerror=alert(1)>');
  await expect(page.locator('#search-dialog img')).toHaveCount(0);
  await page.locator('#search-input').fill('99');
  await expect(
    page.locator('#search-results').getByRole('heading', { name: '第九十九天', exact: true }),
  ).toBeVisible();
  await page.locator('#search-input').fill('第99天');
  await expect(
    page.locator('#search-results').getByRole('heading', { name: '第九十九天', exact: true }),
  ).toBeVisible();
});

test('failed search indexing can be retried', async ({ page }) => {
  let attempts = 0;
  await page.route('**/search-index.json', async (route) => {
    attempts++;
    if (attempts <= 3) await route.fulfill({ status: 503, body: 'Unavailable' });
    else await route.continue();
  });
  await page.goto('./');
  await page.locator('#search-toggle').click();
  await page.locator('#search-input').fill('第七十八天');
  await expect(page.locator('#search-retry')).toBeVisible();
  expect(attempts).toBe(3);
  await page.locator('#search-retry').click();
  await expect(
    page.locator('#search-results').getByRole('heading', { name: '第七十八天', exact: true }),
  ).toBeVisible();
  expect(attempts).toBe(4);
});

test('failed article loading retries and does not cache an error', async ({ page }) => {
  let attempts = 0;
  await page.route('**/content/thinking-2025-09-27.json', async (route) => {
    attempts++;
    if (attempts <= 3) await route.fulfill({ status: 503, body: 'Unavailable' });
    else await route.continue();
  });
  await page.goto('categories/thinking/');
  const card = page.locator('[data-article="thinking-2025-09-27"]');
  await card.locator('summary').click();
  await expect(card.getByRole('button', { name: '重试加载' })).toBeVisible();
  expect(attempts).toBe(3);
  await card.getByRole('button', { name: '重试加载' }).click();
  await expect(card.locator('.prose')).toBeVisible();
  expect(attempts).toBe(4);
  await card.locator('summary').click();
  await card.locator('summary').click();
  await expect(card.locator('.prose')).toBeVisible();
  expect(attempts).toBe(4);
});

test('expand all loads every exam article with bounded concurrency', async ({ page, request }) => {
  const index = await (await request.get('search-index.json')).json();
  const count = index.filter(
    (entry: { category: string }) => entry.category === '考研100天记录',
  ).length;
  let pending = 0,
    maxPending = 0;
  const requests = new Set<string>();
  await page.route('**/content/exam-*.json', async (route) => {
    pending++;
    maxPending = Math.max(maxPending, pending);
    requests.add(route.request().url());
    const response = await route.fetch();
    await new Promise((resolve) => setTimeout(resolve, 100));
    await route.fulfill({ response });
    pending--;
  });
  await page.goto('categories/exam/');
  await expect(page.locator('details[data-article]')).toHaveCount(count);
  await page.locator('#settings-toggle').click();
  await page.locator('#expand-all-articles').click();
  await expect.poll(() => pending).toBeGreaterThan(0);
  await page.locator('#expand-all-articles').click();
  await expect(page.locator('details[open]')).toHaveCount(0);
  await expect.poll(() => pending).toBe(0);
  expect(requests.size).toBeLessThan(count);
  await page.locator('#expand-all-articles').click();
  await expect(page.locator('details[data-state="ready"]')).toHaveCount(count, { timeout: 20000 });
  expect(requests.size).toBe(count);
  expect(maxPending).toBeLessThanOrEqual(4);
  await expect(page.locator('details[open]')).toHaveCount(count);
  await page.locator('#expand-all-articles').click();
  await expect(page.locator('details[open]')).toHaveCount(0);
});

test('music is opt-in, playable and can recover after a failed request', async ({ page }) => {
  let fail = true;
  let requests = 0;
  await page.route('**/audio/canon.mp3', async (route) => {
    requests++;
    if (fail) await route.abort();
    else await route.continue();
  });
  await page.goto('./');
  expect(requests).toBe(0);
  await page.locator('#music-toggle').click();
  await expect(page.locator('#tool-status')).toContainText('重试');
  fail = false;
  await page.locator('#music-toggle').click();
  await expect(page.locator('#music-toggle')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#music-toggle').click();
  await expect(page.locator('#music-toggle')).toHaveAttribute('aria-pressed', 'false');
  expect(requests).toBeGreaterThanOrEqual(2);
});

test('music resumes its position after same-tab navigation', async ({ page }) => {
  await page.goto('./');
  await page.locator('#music-toggle').click();
  await expect(page.locator('#music-toggle')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#music-toggle')).toBeEnabled();
  await page.locator('audio').evaluate(
    (audio: HTMLAudioElement) =>
      new Promise<void>((resolve) => {
        audio.addEventListener('seeked', () => resolve(), { once: true });
        audio.currentTime = 3;
      }),
  );
  await page.getByRole('link', { name: /进入博客/ }).click();
  await expect(page.locator('#music-toggle')).toHaveAttribute('aria-pressed', 'true');
  await expect
    .poll(() => page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.currentTime))
    .toBeGreaterThanOrEqual(3);
});

test('system dark theme loads only its matching homepage animation', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('./');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(requests.filter((url) => /home-(light|dark)\.webp/.test(url))).toHaveLength(1);
  expect(requests.some((url) => url.includes('/home-dark.webp'))).toBeTruthy();
});

test('photographs preserve descriptions and original image links; reduced motion and layout work', async ({
  page,
  request,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await page.waitForLoadState('networkidle');
  expect(
    await page.locator('.home-visual').evaluate((el) => getComputedStyle(el).backgroundImage),
  ).toContain('home-poster.webp');
  await page.goto('photography/');
  await expect(page.locator('.photo-grid img')).toHaveCount(6);
  await expect(page.locator('.photo-grid figcaption').first()).toContainText('白云');
  expect((await request.get('images/a.jpg')).ok()).toBeTruthy();
  await expect(page.locator('.photo-grid a').first()).toHaveAttribute(
    'href',
    `${base}images/a.jpg`,
  );
  for (const path of ['talking/', 'categories/updates/', 'categories/art/', 'about/']) {
    await page.goto(path);
    expect(
      await page.locator('html').evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBeTruthy();
  }
  await page.goto('missing-page/');
  expect(await page.locator('h1').textContent()).toContain('暂时不在这里');
});
