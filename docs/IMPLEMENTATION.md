# Astro migration

Goal: preserve the original monochrome blog, all 115 articles, its sections,
photography, music and reading tools while generating crawlable static pages.
Production base URL: https://qianshanyuewu.github.io/Montunar.github.io/.
Source baseline: main at 0a77af1020c193bfbef93f1da53d407005790bc9.

## Work and evidence

- [x] Obtain the complete upstream checkout and create codex/astro-blog-optimization.
- [x] Inventory original content and media; reproduce loading bugs in isolation.
- [x] Record baseline screenshots, request inventory and available performance metrics.
- [x] Migrate every Markdown body with hashes and a source-to-route mapping.
- [x] Build Astro layouts, sections, article routes and structured metadata.
- [x] Implement full-text search, readable cards, expand all and retry behavior.
- [x] Preserve theme, typography controls, immersive reading, music and photography.
- [x] Generate smaller media and fonts while retaining original files.
- [x] Validate content, built links, desktop/mobile flows and direct navigation.
- [x] Measure three cold mobile runs; median LCP <= 2500 ms, CLS <= 0.1;
      homepage automatic transfer <= 2,000,000 bytes.
- [x] Publish a reviewable PR and attach it to this chat; do not merge or deploy.
      https://github.com/qianshanyuewu/Montunar.github.io/pull/1

The active source of truth will be src/content/posts with frontmatter. The
original articles and media remain as archival inputs. A migration manifest must
account for the day-78 index typo and the nonstandard original date strings.
Tests or browser measurements that cannot execute are reported as incomplete,
never passed. Work must retain this full scope across goal continuations.
