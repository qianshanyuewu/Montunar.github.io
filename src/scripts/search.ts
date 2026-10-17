import { fetchJson, invalidateJson } from './network';
type SearchEntry = {
  title: string;
  category: string;
  url: string;
  description: string;
  body: string;
};
function chineseNumber(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 999) return String(n);
  if (n < 10) return '零一二三四五六七八九'[n];
  if (n < 20) return '十' + (n % 10 ? chineseNumber(n % 10) : '');
  if (n < 100)
    return chineseNumber(Math.floor(n / 10)) + '十' + (n % 10 ? chineseNumber(n % 10) : '');
  return (
    chineseNumber(Math.floor(n / 100)) +
    '百' +
    (n % 100 ? (n % 100 < 10 ? '零' : n % 100 < 20 ? '一' : '') + chineseNumber(n % 100) : '')
  );
}
export function setupSearch() {
  const dialog = document.querySelector<HTMLDialogElement>('#search-dialog')!;
  const input = document.querySelector<HTMLInputElement>('#search-input')!;
  const status = document.querySelector<HTMLElement>('#search-status')!;
  const list = document.querySelector('#search-results')!;
  const retry = document.querySelector<HTMLButtonElement>('#search-retry')!;
  let entries: SearchEntry[] | null = null;
  let loading = false;
  const search = () => {
    list.replaceChildren();
    if (!entries) {
      if (loading) status.textContent = '正在加载搜索内容…';
      return;
    }
    const query = input.value.normalize('NFKC').trim().toLowerCase();
    if (!query) {
      status.textContent = '输入关键词开始搜索，可搜索文章正文';
      return;
    }
    const tokens = query.split(/\s+/);
    const converted = query.replace(/\d+/g, (digits) =>
      digits.length <= 3 ? chineseNumber(Number(digits)) : digits,
    );
    const alternate = converted !== query ? converted : null;
    const results = entries
      .map((entry) => {
        const title = entry.title.toLowerCase();
        const haystack = `${title} ${entry.description} ${entry.body}`
          .normalize('NFKC')
          .toLowerCase();
        const match =
          tokens.every((token) => haystack.includes(token)) ||
          (alternate && title.includes(alternate));
        return {
          entry,
          score: match
            ? title.includes(query) || (alternate && title.includes(alternate))
              ? 2
              : 1
            : 0,
        };
      })
      .filter((result) => result.score)
      .sort((a, b) => b.score - a.score);
    status.textContent = results.length
      ? `找到 ${results.length} 篇文章`
      : `没有找到与“${input.value.trim()}”相关的内容`;
    for (const { entry } of results) {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = entry.url;
      const heading = document.createElement('h3');
      heading.textContent = entry.title;
      const description = document.createElement('p');
      const position = entry.body.toLowerCase().indexOf(tokens[0]);
      description.textContent =
        position >= 0
          ? `${position > 25 ? '…' : ''}${entry.body.slice(Math.max(0, position - 25), position + 95)}…`
          : entry.description;
      const category = document.createElement('small');
      category.textContent = entry.category;
      link.append(heading, description, category);
      li.append(link);
      list.append(li);
    }
  };
  const load = async () => {
    if (entries || loading) return;
    loading = true;
    retry.hidden = true;
    search();
    const endpoint = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/search-index.json`;
    try {
      const loaded = await fetchJson<SearchEntry[]>(endpoint);
      if (
        !Array.isArray(loaded) ||
        !loaded.every((entry) =>
          ['title', 'category', 'url', 'description', 'body'].every(
            (key) => typeof entry[key as keyof SearchEntry] === 'string',
          ),
        )
      )
        throw new Error('Invalid search index');
      entries = loaded;
    } catch {
      invalidateJson(endpoint);
      status.textContent = '搜索内容加载失败，请重试。';
      retry.hidden = false;
    } finally {
      loading = false;
      if (entries) search();
    }
  };
  document.querySelector('#search-toggle')!.addEventListener('click', () => {
    dialog.showModal();
    input.focus();
    void load();
  });
  input.addEventListener('input', search);
  retry.addEventListener('click', () => {
    void load();
  });
  dialog.addEventListener('close', () => {
    input.value = '';
    list.replaceChildren();
    status.textContent = '输入关键词开始搜索';
  });
}
