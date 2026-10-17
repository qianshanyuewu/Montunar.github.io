import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { frontmatter as matter } from './frontmatter.mjs';
import { postSchema as schema } from '../src/lib/post-schema.mjs';
const errors = [];
const files = await readdir('src/content/posts');
const seen = new Set();
for (const file of files.filter((f) => f.endsWith('.md'))) {
  const { data, content } = matter(await readFile(`src/content/posts/${file}`, 'utf8'));
  const result = schema.safeParse(data);
  if (!result.success) {
    errors.push(`${file}: ${result.error.message}`);
    continue;
  }
  if (seen.has(data.slug)) errors.push(`Duplicate slug ${data.slug}`);
  seen.add(data.slug);
  if (file !== `${data.slug}.md`) errors.push(`${file}: slug and filename disagree`);
  const date = new Date(`${data.date}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== data.date)
    errors.push(`${file}: invalid date`);
}
const manifest = JSON.parse(await readFile('docs/migration-manifest.json', 'utf8'));
for (const entry of manifest.articles) {
  try {
    const original = await readFile(entry.source);
    const { content } = matter(await readFile(entry.destination, 'utf8'));
    for (const [kind, body] of process.argv.includes('--migration')
      ? [
          ['archival', original],
          ['migrated', content],
        ]
      : [['archival', original]]) {
      if (createHash('sha256').update(body).digest('hex') !== entry.sha256)
        errors.push(`${entry.slug}: ${kind} body differs from migration baseline`);
    }
    if (!seen.has(entry.slug)) errors.push(`Missing migrated article ${entry.slug}`);
  } catch (error) {
    errors.push(`${entry.slug}: ${error.message}`);
  }
}
if (manifest.articles.length !== manifest.originalArticleCount)
  errors.push('Migration manifest count changed');
const media = JSON.parse(await readFile('docs/original-media.json', 'utf8'));
for (const entry of media) {
  try {
    const body = await readFile(entry.source);
    if (
      body.length !== entry.bytes ||
      createHash('sha256').update(body).digest('hex') !== entry.sha256
    )
      errors.push(`Original media differs: ${entry.source}`);
  } catch {
    errors.push(`Missing original media ${entry.source}`);
  }
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(
  `Validated ${seen.size} articles; all ${manifest.articles.length} migration entries accounted for and original media preserved.`,
);
