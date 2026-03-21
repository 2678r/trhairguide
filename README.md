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
  医生数据源（含 Google 评价快照字段）
- `data/clinics.json`
  诊所数据源（含 Google 评价快照字段）
- `assets/app.js`
  前端渲染、搜索、筛选、排序逻辑
- `assets/styles.css`
  轻量补充样式

## 评价数据设计

现阶段 Google 评分、评价数量和一句话总结直接维护在两张主表中，不再单独拆评价库。

医生和诊所统一使用这 4 个字段：

- `google_rating`
  Google 评分
- `google_review_count`
  Google 评价数量
- `google_summary_cn`
  一句话中文总结
- `google_checked_at`
  核对日期，格式建议 `YYYY-MM-DD`

示例：

```json
{
  "google_rating": 4.5,
  "google_review_count": 320,
  "google_summary_cn": "评价整体偏正面，但主要反映流程和接待体验，需单独核实医生参与环节。",
  "google_checked_at": "2026-03-21"
}
```

## 如何维护数据库

最稳的方式不是直接手改 JSON，而是先用表格维护，再导出到 JSON。

推荐维护后台：

1. Google Sheets
2. Airtable

建议维护 2 张表：

1. `doctors`
2. `clinics`

### doctors / clinics 增加的表头

- `google_rating`
- `google_review_count`
- `google_summary_cn`
- `google_checked_at`

## 评价维护规则

为了避免数据后期越来越乱，建议固定以下规则：

1. 页面展示的是“评分和评价快照”，不是实时数据
2. 评分和评价数量只作为辅助参考，不单独作为排序依据
3. 一句话总结要尽量说明“这些评价主要反映什么”
4. 尽量区分“服务流程体验”和“医疗质量 / 医生参与环节”
5. 必须保留核对日期，方便后续复查

## 页面展示原则

当前前端已经支持在医生页和诊所页展示：

- Google 评分
- 评价数量
- 核对日期
- 一句人工摘要

建议把这部分定位为“决策辅助”，不要把它包装成官方结论或医疗判断。

## 以后怎么维护

1. 每两周更新一次 `data/doctors.json` 和 `data/clinics.json`
2. 每周或每两周补充一次 Google 评分和摘要字段
3. 每次更新评价时，优先维护咨询量高或变化明显的机构
4. 如果 Tally 表单换了链接，只改 `submit.html` 里的 iframe `src`
5. 如果要改说明文字，直接改对应 HTML 页面
6. 页面结构尽量不动，长期只维护数据与表单

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
- 持续补充 Google 评价快照字段
- 维护提交入口
- 不要频繁改框架

这个项目的价值，主要来自持续的数据维护，而不是复杂技术栈。
