import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { browserPath } from './browser-path.mjs';
const directory = 'output/playwright';
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: browserPath() });
try {
  for (const [device, width, height] of [
    ['desktop', 1440, 1000],
    ['mobile', 390, 844],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
      colorScheme: 'light',
    });
    const page = await context.newPage();
    for (const [name, path] of [
      ['home', ''],
      ['notebooks', 'talking/'],
      ['articles', 'categories/thinking/'],
      ['reading', 'posts/updates-2026-03-10/'],
      ['photography', 'photography/'],
    ]) {
      await page.goto(`http://127.0.0.1:4324/Montunar.github.io/${path}`, {
        waitUntil: 'networkidle',
      });
      await page.evaluate(() => document.fonts.ready);
      if (name === 'photography') {
        await page.evaluate(async () => {
          for (const image of document.querySelectorAll('img')) {
            image.loading = 'eager';
            await image.decode();
          }
        });
      }
      await page.screenshot({
        path: `${directory}/${device}-${name}.png`,
        fullPage: name !== 'reading',
      });
    }
    await page.locator('#theme-toggle').click();
    await page.goto('http://127.0.0.1:4324/Montunar.github.io/talking/', {
      waitUntil: 'networkidle',
    });
    await page.screenshot({ path: `${directory}/${device}-dark.png`, fullPage: true });
    await context.close();
  }
} finally {
  await browser.close();
}
console.log('Captured 12 preview screenshots.');
