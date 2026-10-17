import { chromium } from '@playwright/test';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { browserPath } from './browser-path.mjs';
const port = 4323;
await unlink('docs/performance-results.json').catch(() => {});
const server = spawn(process.execPath, ['scripts/static-server.mjs', 'dist', String(port)], {
  stdio: ['ignore', 'pipe', 'pipe'],
});
await new Promise((resolve, reject) => {
  server.stdout.once('data', resolve);
  server.once('error', reject);
  server.once('exit', (code) => reject(new Error(`Server exited ${code}`)));
});
const base = `http://127.0.0.1:${port}/Montunar.github.io/`;
const settings = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  cpuSlowdown: 4,
  network: { latency: 150, downloadThroughput: 1_600_000 / 8, uploadThroughput: 750_000 / 8 },
};
const results = [];
let browser;
try {
  browser = await chromium.launch({ headless: true, executablePath: browserPath() });
  for (const route of ['', 'posts/updates-2026-03-10/', 'categories/exam/']) {
    for (let run = 1; run <= 3; run++) {
      const context = await browser.newContext({
        viewport: settings.viewport,
        deviceScaleFactor: settings.deviceScaleFactor,
        isMobile: settings.isMobile,
        hasTouch: settings.hasTouch,
        userAgent:
          'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36',
        colorScheme: 'light',
      });
      const page = await context.newPage();
      const session = await context.newCDPSession(page);
      await session.send('Network.enable');
      await session.send('Network.setCacheDisabled', { cacheDisabled: true });
      await session.send('Network.emulateNetworkConditions', {
        offline: false,
        ...settings.network,
        connectionType: 'cellular4g',
      });
      await session.send('Emulation.setCPUThrottlingRate', { rate: settings.cpuSlowdown });
      const resources = new Map();
      session.on('Network.requestWillBeSent', (event) =>
        resources.set(event.requestId, { url: event.request.url, bytes: 0 }),
      );
      session.on('Network.loadingFinished', (event) => {
        if (resources.has(event.requestId))
          resources.get(event.requestId).bytes = event.encodedDataLength;
      });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('requestfailed', (request) =>
        errors.push(`${request.url()}: ${request.failure()?.errorText}`),
      );
      await page.addInitScript(() => {
        window.__metrics = { lcp: 0, cls: 0 };
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) window.__metrics.lcp = entry.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries())
            if (!entry.hadRecentInput) window.__metrics.cls += entry.value;
        }).observe({ type: 'layout-shift', buffered: true });
      });
      await page.goto(base + route, { waitUntil: 'networkidle', timeout: 60000 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1000);
      const metrics = await page.evaluate(() => window.__metrics);
      const entry = {
        route: route || '/',
        run,
        ...metrics,
        transferBytes: [...resources.values()].reduce((n, r) => n + r.bytes, 0),
        errors,
        resources: [...resources.values()],
      };
      results.push(entry);
      console.log(
        JSON.stringify({
          route: entry.route,
          run,
          lcp: metrics.lcp,
          cls: metrics.cls,
          bytes: entry.transferBytes,
          errors,
        }),
      );
      await context.close();
    }
  }
  const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
  const summary = [...new Set(results.map((x) => x.route))].map((route) => {
    const runs = results.filter((x) => x.route === route);
    return {
      route,
      lcpMedianMs: median(runs.map((x) => x.lcp)),
      clsMedian: median(runs.map((x) => x.cls)),
      maxTransferBytes: Math.max(...runs.map((x) => x.transferBytes)),
      runs: runs.length,
      errors: runs.flatMap((x) => x.errors),
    };
  });
  const pass =
    summary.every(
      (x) =>
        x.lcpMedianMs > 0 && x.lcpMedianMs <= 2500 && x.clsMedian <= 0.1 && x.errors.length === 0,
    ) && summary.find((x) => x.route === '/').maxTransferBytes <= 2_000_000;
  const report = {
    measuredAt: new Date().toISOString(),
    environment:
      'Local production build; Chromium CDP; HTTP uncompressed; cold cache and fresh browser context for each run; no third-party assets',
    browser: browser.version(),
    settings,
    summary,
    pass,
    results,
  };
  await mkdir('docs', { recursive: true });
  await writeFile('docs/performance-results.json', JSON.stringify(report, null, 2) + '\n');
  if (!pass) {
    console.error('Performance acceptance has not passed. See docs/performance-results.json.');
    process.exitCode = 1;
  }
} finally {
  await browser?.close();
  server.kill();
}
