import type { APIRoute } from 'astro';
import { allPosts, categories, plainText, postUrl } from '../lib/blog';
export const GET: APIRoute = async () =>
  new Response(
    JSON.stringify(
      (await allPosts()).map((post) => ({
        title: post.data.title,
        category: categories[post.data.category].title,
        url: postUrl(post),
        description: post.data.description,
        body: plainText(post.body || ''),
      })),
    ),
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } },
  );
