# boke

我们的博客：Hugo + GitHub Pages，文章用 Markdown。

## 发表新文章

1. 在 `content/posters/` 下新建 `.md` 文件（或 `hugo new posters/xxx.md`）
2. Frontmatter 必须包含 `title`、`date`、`tags`、`author`：

```markdown
---
title: 文章标题
date: "2026-08-30T12:00:00+08:00"
tags: ["标签"]
author: 你的名字
---
```

3. 新建分支提交，开 PR 合并到 `main`
4. 合并后 GitHub Actions 自动构建并部署到 https://zhumenglonge.github.io/boke/

## 本地预览

```bash
hugo server -D
```
