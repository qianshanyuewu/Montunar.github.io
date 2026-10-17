import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, join, extname } from 'node:path';
import * as cheerio from 'cheerio';
const root = resolve('dist'),
  base = '/Montunar.github.io/';
const files = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const p = join(directory, entry.name);
    if (entry.isDirectory()) await walk(p);
    else files.push(p);
  }
}
await walk(root);
const errors = [],
  pages = files.filter((f) => f.endsWith('.html'));
const htmlByFile = new Map();
async function targetFile(pathname) {
  let destination = join(root, decodeURIComponent(pathname).slice(base.length));
  try {
    if ((await stat(destination)).isDirectory()) destination = join(destination, 'index.html');
    await stat(destination);
    return destination;
  } catch {
    return null;
  }
}
for (const file of pages) {
  const html = await readFile(file, 'utf8');
  const $ = cheerio.load(html);
  htmlByFile.set(file, $);
  const relative = file.slice(root.length + 1).replace(/index\.html$/, '');
  const from = new URL(base + relative, 'https://qianshanyuewu.github.io');
  const candidates = [];
  $('[href],[src],[data-endpoint],[data-src]').each((_, el) => {
    for (const attr of ['href', 'src', 'data-endpoint', 'data-src'])
      if ($(el).attr(attr)) candidates.push($(el).attr(attr));
  });
  $('[srcset]').each((_, el) => {
    $(el)
      .attr('srcset')
      .split(',')
      .forEach((item) => candidates.push(item.trim().split(/\s+/)[0]));
  });
  for (const value of candidates) {
    if (/^(data:|mailto:|tel:)/.test(value)) continue;
    const url = new URL(value, from);
    if (url.origin !== from.origin) continue;
    if (!url.pathname.startsWith(base)) {
      errors.push(`${relative}: escapes project base: ${value}`);
      continue;
    }
    const target = await targetFile(url.pathname);
    if (!target) {
      errors.push(`${relative}: broken link ${value}`);
      continue;
    }
    if (url.hash && extname(target) === '.html') {
      let target$ = htmlByFile.get(target);
      if (!target$) {
        target$ = cheerio.load(await readFile(target, 'utf8'));
        htmlByFile.set(target, target$);
      }
      const id = decodeURIComponent(url.hash.slice(1));
      if (
        !target$('[id]')
          .toArray()
          .some((el) => target$(el).attr('id') === id)
      )
        errors.push(`${relative}: missing anchor ${value}`);
    }
  }
  if (
    !file.endsWith('/404.html') &&
    (!$('link[rel=canonical]').length || !$('meta[name=description]').attr('content'))
  )
    errors.push(`${relative}: missing SEO metadata`);
}
for (const file of files.filter((f) => f.endsWith('.css'))) {
  const css = await readFile(file, 'utf8');
  for (const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    if (/^(data:|https?:)/.test(match[1])) continue;
    const from = new URL(base + file.slice(root.length + 1), 'https://qianshanyuewu.github.io');
    const target = new URL(match[1], from);
    if (!target.pathname.startsWith(base) || !(await targetFile(target.pathname)))
      errors.push(`${file}: missing CSS asset ${match[1]}`);
  }
}
const index = JSON.parse(await readFile(join(root, 'search-index.json'), 'utf8'));
for (const entry of index)
  if (!(await targetFile(entry.url))) errors.push(`Search index: ${entry.url}`);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(
  `Checked ${pages.length} HTML pages, CSS assets and ${index.length} search destinations: no broken internal links.`,
);
