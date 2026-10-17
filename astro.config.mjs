import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import { projectLinks } from './scripts/markdown-project-links.mjs';
import { site } from './scripts/site.mjs';

export default defineConfig({
  site: site.origin,
  base: site.base,
  trailingSlash: 'always',
  output: 'static',
  integrations: [sitemap()],
  markdown: { processor: unified({ rehypePlugins: [projectLinks] }) },
});
