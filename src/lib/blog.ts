import { getCollection, type CollectionEntry } from 'astro:content';
import { decodeHTML } from 'entities';
export type Post = CollectionEntry<'posts'>;
export const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const url = (path = '') => `${base}/${path.replace(/^\//, '')}`;
export const categories = {
  thinking: { title: '思考与探索', subtitle: 'Thinking & Exploration', parent: 'talking/' },
  technology: { title: '科技与未来', subtitle: 'Technology & Future', parent: 'talking/' },
  art: { title: '艺术与创意', subtitle: 'Art & Creativity', parent: 'talking/' },
  updates: { title: '干了啥', subtitle: '更新记录', parent: 'journal/' },
  exam: { title: '考研100天记录', subtitle: '每一天，都算数', parent: 'journal/' },
};
export async function allPosts() {
  return (await getCollection('posts')).sort(
    (a, b) =>
      Number(b.data.pinned) - Number(a.data.pinned) ||
      b.data.date.localeCompare(a.data.date) ||
      a.data.slug.localeCompare(b.data.slug),
  );
}
export const postUrl = (post: Post) => url(`posts/${post.data.slug}/`);
export function plainText(markdown: string) {
  return decodeHTML(
    markdown
      .replace(/<[^>]*>/g, ' ')
      .replace(/!?(\[([^\]]+)\])\([^)]*\)/g, '$2')
      .replace(/[#*_`>~]/g, ''),
  )
    .replace(/\s+/g, ' ')
    .trim();
}
