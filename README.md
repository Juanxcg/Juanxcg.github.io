# Juanxcg' Blog

基于 Hexo 7.3 和 Butterfly 5.5.3 的个人博客。

## 常用命令

```bash
git submodule update --init --recursive
npm install
npm run server
npm run check
npm run deploy
```

- 博客文章位于 `source/_posts/`。
- 图片和下载资源位于 `source/image/` 与 `source/downloads/`。
- 站点配置位于 `_config.yml`，主题配置位于 `_config.butterfly.yml`。
- `npm run check` 会构建站点，并检查 Front-matter、本地资源及生成页面链接。

## Git 分支约定

- `source` 保存 Hexo 源码、文章和资源，是日常维护分支。
- `main` 只保存 `npm run deploy` 生成的静态站点，是 GitHub Pages 发布分支。
- 两个分支历史相互独立，禁止在 `source` 上拉取、合并或重置到 `origin/main`。
- 发布前先在 `source` 上执行 `npm run check`；只有检查通过后才执行 `npm run deploy`。

## 评论系统

评论使用 [Utterances](https://utteranc.es/)，内容保存在
`Juanxcg/Juanxcg.github.io` 仓库的 GitHub Issues 中，并按文章路径关联。

首次启用前，需要：

1. 保持仓库为公开仓库并启用 Issues。
2. 为该仓库安装 [Utterances GitHub App](https://github.com/apps/utterances/installations/new)。
