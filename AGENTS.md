# 博客维护约定

## 图片工作流

- 云端图库仓库为 `https://github.com/Juanxcg/blog-img`。
- 本地图片目录为 `D:\MyGithubBlog\source\image`。
- `source/image` 下的文件夹是已经被文章使用的图片集合；目录根部的其他图片可能未使用，也可能是背景、头像等通用资源。不得仅根据引用扫描结果直接删除、移动或重命名这些文件。
- 新建博客文章前，先从本地确认文章所需图片，再上传到 `Juanxcg/blog-img`。
- 上传后必须确认图片的公开链接可以访问，之后才能把云端链接写入文章的 `cover`、`top_img`、Markdown 或 HTML。
- 新文章默认不直接引用 Windows 本地路径，也不新增 `/image/...` 本地引用；只有用户明确要求或云端图库暂时不可用时才可例外。
- 不要擅自批量迁移已有文章的图片链接。修改旧链接前先确认云端对应文件和最终 URL。

## Git 工作流

- `source` 是 Hexo 源码分支；日常文章、配置和资源修改都在该分支完成。
- `main` 是 Hexo 生成的 GitHub Pages 发布分支，与 `source` 没有共同历史。
- 禁止在源码工作目录执行 `git pull origin main`、合并 `main`、rebase 到 `main` 或 reset 到 `origin/main`。
- `_config.yml` 中的部署目标保持为 `main`。发布前必须先在 `source` 上执行 `npm run check`。
- 不得使用 `git clean` 清理当前仓库；未跟踪目录中包含尚未提交的文章、图片和 APK。
- 暂存时使用明确的文件或目录清单，不使用未经核对的 `git add -A`。
