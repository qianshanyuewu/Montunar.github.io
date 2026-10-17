import { render } from 'astro:content';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import type { APIRoute } from 'astro';
import { allPosts } from '../../lib/blog';
export async function getStaticPaths() {
  return (await allPosts()).map((post) => ({ params: { slug: post.data.slug }, props: { post } }));
}
export const GET: APIRoute = async ({ props }) => {
  const { Content } = await render(props.post);
  const container = await AstroContainer.create();
  const html = await container.renderToString(Content);
  return new Response(JSON.stringify({ title: props.post.data.title, html }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
