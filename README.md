# 土耳其植发信息网

这是一个适合部署到 Cloudflare Pages 的纯静态网站框架。

## 固定结构

- `index.html`
  首页
- `doctors.html`
  医生数据库
- `clinics.html`
  诊所数据库
- `guide.html`
  自查指南
- `submit.html`
  Tally 众包提交页
- `data/doctors.json`
  医生数据源
- `data/clinics.json`
  诊所数据源
- `assets/app.js`
  前端渲染、搜索、筛选、排序逻辑
- `assets/styles.css`
  轻量补充样式

## 以后怎么维护

1. 每两周更新一次 `data/doctors.json` 和 `data/clinics.json`
2. 如果 Tally 表单换了链接，只改 `submit.html` 里的 iframe `src`
3. 如果要改说明文字，直接改对应 HTML 页面
4. 页面结构尽量不动，长期只维护数据与表单

## 本地预览

最简单的方式：

```bash
python3 -m http.server 4173
```

然后打开：

- `http://localhost:4173/`

## 部署到 Cloudflare Pages

1. 把这个目录推到 GitHub
2. 在 Cloudflare Pages 新建项目并连接这个仓库
3. Framework preset 选择 `None`
4. Build command 留空
5. Output directory 填 `/`
6. 部署完成

## 你后面最重要的工作

- 保持 JSON 更新频率
- 维护提交入口
- 不要频繁改框架

这个项目的价值，主要来自持续的数据维护，而不是复杂技术栈。
