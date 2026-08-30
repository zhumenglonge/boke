---
title: 你好，世界：博客的第一篇文章
date: "2026-08-30T12:00:00+08:00"
tags: ["随笔", "开始"]
author: "zhumenglonge"
---

这是我们博客的第一篇文章。

## 为什么写博客

把学到的东西写下来，是检验自己是否真正理解的最好方式。

## 发布流程

1. 新文章放到 `content/posters/` 目录
2. 提交 PR 合并到 `main` 分支
3. GitHub Actions 自动构建并部署到 GitHub Pages

## Frontmatter 说明

每篇文章的 Markdown 头部需要包含 `title`、`date`、`tags`、`author` 四个字段：

```markdown
---
title: 文章标题
date: "2026-08-30T12:00:00+08:00"
tags: ["标签1", "标签2"]
author: 你的名字
---
```
