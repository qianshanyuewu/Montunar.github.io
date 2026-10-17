// One-time, reproducible importer. src/content/posts is authoritative afterwards.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { decodeHTML } from 'entities';

const groups = [
  ['articles.json', 'thinking', '思考与探索'],
  ['tech-articles.json', 'technology', '科技与未来'],
  ['art-creativity-articles.json', 'art', '艺术与创意'],
  ['whatidid-articles.json', 'updates', '干了啥'],
  ['kaoyan100-articles.json', 'exam', '考研100天记录'],
];
const manifest = [];
await mkdir('src/content/posts', { recursive: true });
await mkdir('docs', { recursive: true });
for (const [index, category, categoryTitle] of groups) {
  const entries = JSON.parse(await readFile(`articles/${index}`, 'utf8'));
  for (const entry of entries) {
    const originalFilename = entry.filename;
    const source =
      originalFilename === '考研100天/20251127_第七十八天.md'
        ? '考研100天/20251128_第七十八天.md'
        : originalFilename;
    const body = await readFile(`articles/${source}`, 'utf8');
    const date = entry.date.slice(0, 10);
    const slug = `${category}-${date}`;
    const hash = createHash('sha256').update(body).digest('hex');
    const description = decodeHTML(body.replace(/<[^>]+>/g, '').replace(/[#*_`>]/g, ''))
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 110);
    const data = {
      title: entry.title,
      date,
      category,
      slug,
      pinned: !!entry.pinned,
      description,
      source,
      ...(date !== entry.date ? { legacyDate: entry.date } : {}),
    };
    const frontmatter = Object.entries(data)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join('\n');
    await writeFile(`src/content/posts/${slug}.md`, `---\n${frontmatter}\n---\n${body}`);
    manifest.push({
      originalIndex: `articles/${index}`,
      originalFilename,
      source: `articles/${source}`,
      originalDate: entry.date,
      date,
      category,
      categoryTitle,
      title: entry.title,
      slug,
      destination: `src/content/posts/${slug}.md`,
      route: `/Montunar.github.io/posts/${slug}/`,
      sha256: hash,
      corrections:
        source !== originalFilename
          ? ['Repair existing day-78 index filename; retain original Markdown body.']
          : [],
    });
  }
}
if (new Set(manifest.map((x) => x.slug)).size !== manifest.length)
  throw new Error('Duplicate slugs');
await writeFile(
  'docs/migration-manifest.json',
  JSON.stringify(
    {
      upstream: '0a77af1020c193bfbef93f1da53d407005790bc9',
      originalArticleCount: manifest.length,
      articles: manifest,
    },
    null,
    2,
  ) + '\n',
);
console.log(`Migrated ${manifest.length} articles with unchanged body hashes.`);
