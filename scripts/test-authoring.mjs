import { readFile, writeFile, unlink, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const slug = 'thinking-authoring-workflow-check';
await unlink('docs/authoring-check.json').catch(() => {});
const file = `src/content/posts/${slug}.md`;
const before = (await readdir('src/content/posts')).filter((x) => x.endsWith('.md')).length;
const source =
  '---\ntitle: "写作流程验证"\ndate: "2026-10-17"\ncategory: "thinking"\nslug: "' +
  slug +
  '"\ndescription: "新增一个 Markdown 即可发布。"\npinned: false\n---\n这是临时写作流程测试，完成后自动删除。独特正文检索词：writing-flow-proof。\n';
const build = () => {
  const run = spawnSync('npm', ['run', 'build'], { encoding: 'utf8', maxBuffer: 10_000_000 });
  if (run.status !== 0) throw new Error(run.stdout + run.stderr);
};
let result;
try {
  await writeFile(file, source, { flag: 'wx' });
  build();
  const [page, list, sitemap, index] = await Promise.all([
    readFile(`dist/posts/${slug}/index.html`, 'utf8'),
    readFile('dist/categories/thinking/index.html', 'utf8'),
    readFile('dist/sitemap-0.xml', 'utf8'),
    readFile('dist/search-index.json', 'utf8').then(JSON.parse),
  ]);
  if (
    !page.includes('writing-flow-proof') ||
    !list.includes('写作流程验证') ||
    !sitemap.includes(`/posts/${slug}/`) ||
    !index.some((x) => x.body.includes('writing-flow-proof')) ||
    index.length !== before + 1
  )
    throw new Error('New Markdown did not propagate to every output');
  result = {
    passed: true,
    articleCountBefore: before,
    articleCountDuringTest: index.length,
    generated: ['standalone page', 'category listing', 'sitemap', 'full-text search'],
    manualIndexChanges: false,
  };
} finally {
  await unlink(file).catch(() => {});
  build();
}
await writeFile(
  'docs/authoring-check.json',
  JSON.stringify(
    { ...result, measuredAt: new Date().toISOString(), temporaryArticleRemoved: true },
    null,
    2,
  ) + '\n',
);
console.log('New-article workflow passed; original content restored.');
