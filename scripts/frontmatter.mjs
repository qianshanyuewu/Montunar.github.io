import { parse } from 'yaml';
export function frontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) throw new Error('Missing Markdown frontmatter');
  return { data: parse(match[1]), content: source.slice(match[0].length) };
}
