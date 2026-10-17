# 一个小小的思考地方…

基于 Astro 的静态个人博客，部署路径为
<https://qianshanyuewu.github.io/Montunar.github.io/>。
保留黑白视觉、明暗主题、笔记本栏目、音乐、摄影和沉浸阅读。

## 本地运行

需要 Node.js 22.22 或更新版本。

```sh
npm ci
npm run dev
```

开发入口：<http://127.0.0.1:4321/Montunar.github.io/>。
若端口被占用，使用终端给出的地址。

生产构建和预览：

```sh
npm run check
npm run build
npm run preview -- --port 4324
```

## 写文章

在 `src/content/posts/` 新建 Markdown 文件，例如 `thinking-2026-10-17.md`：

```md
---
title: '今天的想法'
date: '2026-10-17'
category: 'thinking'
slug: 'thinking-2026-10-17'
description: '一句话介绍这篇文章。'
pinned: false
---

在这里写正文。
```

文件名必须与 slug 一致；slug 是文章的稳定网址，发布后应保留。
日期使用 `YYYY-MM-DD`，同一天可以写多篇文章，只需使用不同 slug。
栏目为 `thinking`（思考）、`technology`（科技）、`art`（艺术）、
`updates`（更新）和 `exam`（考研记录）。

文章列表、独立页面、全文搜索索引、相邻文章、分享元信息和 sitemap
全部由内容集合自动生成，无需编辑旧 JSON 或页面代码。
普通内容更新也不需要重新制作字体子集：缺少的字形会使用系统字体。

## 文件分工

- `src/content/posts/`：当前文章与元数据，是内容的唯一维护入口。
- `src/pages/`：静态路由、全文搜索索引、供栏目展开使用的正文片段。
- `src/components/`、`src/layouts/`：页面组件与通用布局。
- `src/scripts/`：搜索、阅读工具、主题、音乐和动画。
- `src/styles/`：主题、排版、响应式布局与减少动态效果支持。
- `public/media/`：已提交的压缩动画、字体子集、响应式照片和分享图片。
- `scripts/`：构建校验、媒体生成和性能测量。
- `docs/`：迁移映射、原始基线和验证报告。

根目录的 `index.html`、`js/`、`articles/` 是迁移前的冻结档案，保留用于
审计和对照。它们不参与新页面的渲染，不需要再同步维护。
原始 `fonts/`、`images/`、`audio/` 和 `assets/` 均保留。
构建前会复制原始照片、音乐、PDF 到公开目录；只在访问相应栏目或
用户点击播放/原图时请求。完整原始字体不进入新站发布目录。

## 验证

```sh
npm run validate             # 元数据、迁移条目和原始文件完整性
npm run validate:migration   # 一次性迁移核对，正文须与迁移时逐字节一致
npm run check               # Astro / TypeScript
npm run build               # 构建后自动检查内部链接、资源、锚点
npx playwright install chromium
npm test                    # 桌面与手机的实际浏览器流程
npm run test:performance     # 三次冷缓存移动端测量
```

`validate:migration` 用于验证此次迁移；日后有意修改文章正文后，该专项
检查会提示差异，正常 `build` 仍允许编辑文章。原始档案应保持不变。
Mac 如已有 Playwright Chromium，脚本会自动使用；也可通过
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 指定可执行文件。

性能脚本在本地生产构建上使用 390×844 视口、2 倍像素密度、4 倍 CPU
减速、150 ms 延迟、1.6 Mbps 下载带宽；每次使用新的浏览器上下文。
首页、长文章和 100 篇列表各运行三次，结果写入
`docs/performance-results.json`。本地实验室结果不代表所有真实网络的体验。

## 媒体再生成

已经提交的优化产物可直接构建，CI 不依赖 Python。
需要更新衍生资源时：

```sh
npm run media
python3 -m pip install -r scripts/media-requirements.txt
python3 scripts/optimize-animation.py
python3 scripts/optimize-fonts.py
```

这些命令写入 `public/media/`，不会覆盖原始文件。字体保留 Light 和
Regular 两个字重，其余字重由浏览器合成。动画保留原循环时长，减少
帧数和像素尺寸；启用“减少动态效果”时使用静态图。

## GitHub Pages

站点地址与项目路径统一配置在 `scripts/site.mjs`。
`verify.yml` 在 PR 和 main 更新时构建、校验、测试并上传预览产物。
PR 不触发线上发布。

确认并合并改动后，仓库所有者可在 Settings → Pages 将发布来源设置为
GitHub Actions，再手动运行 **Publish blog manually**。该工作流只允许
main 分支发布。此次迁移不会更改仓库的 Pages 设置或自动替换线上站点。

迁移与验证依据见 [迁移清单](docs/migration-manifest.json)、
[实施记录](docs/IMPLEMENTATION.md) 和 [原始基线](docs/BASELINE.md)。
