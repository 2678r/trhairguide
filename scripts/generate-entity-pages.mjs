import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const siteOrigin = 'https://trhairguide.com'

const doctors = JSON.parse(await fs.readFile(path.join(rootDir, 'data/doctors.json'), 'utf8'))
const clinics = JSON.parse(await fs.readFile(path.join(rootDir, 'data/clinics.json'), 'utf8'))

function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildSlugMap(items, getBase, getId) {
  const counts = new Map()
  const slugs = new Map()
  for (const item of items) {
    const base = slugify(getBase(item)) || String(getId(item)).toLowerCase()
    const seen = counts.get(base) || 0
    counts.set(base, seen + 1)
    slugs.set(getId(item), seen === 0 ? base : `${base}-${seen + 1}`)
  }
  return slugs
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function normalize(value) {
  return String(value || '').trim()
}

function isUrl(value) {
  return /^https?:\/\//i.test(normalize(value)) || /^www\./i.test(normalize(value))
}

function ensureUrl(value) {
  const raw = normalize(value)
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  if (/^www\./i.test(raw)) return `https://${raw}`
  return raw
}

function formatFacilityType(value) {
  const type = normalize(value).toLowerCase()
  if (type === 'hospital') return '综合医院'
  if (type === 'medical_center') return '医疗中心'
  if (type === 'polyclinic') return '门诊 / 诊所'
  if (type === 'private clinic') return '私人诊所'
  return normalize(value) || '未标注'
}

function formatDoctorStatus(item) {
  return item.ishrs_status_cn || item.ishrs_status || '未标注'
}

function formatAbhrs(item) {
  return normalize(item.abhrs).toLowerCase() === 'yes' ? 'ABHRS 认证' : '未见 ABHRS'
}

function formatPhoto(photo) {
  const raw = normalize(photo)
  if (!raw) return ''
  const filename = raw.split('/').pop() || ''
  const basename = filename.replace(/\.(jpg|jpeg|png|webp)$/i, '')
  return `/assets/doctors/${basename}.jpeg`
}

function formatRating(value) {
  const num = Number(value)
  return Number.isFinite(num) && num > 0 ? num.toFixed(1) : ''
}

function formatReviewCount(value) {
  const num = Number(value)
  return Number.isFinite(num) && num > 0 ? String(num) : ''
}

function noteParagraphs(value, emptyText) {
  const text = normalize(value)
  if (!text) return [`<p>${escapeHtml(emptyText)}</p>`]
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line.replace(/^[-*•]\s*/, ''))}</p>`)
}

function normalizeDate(value) {
  const raw = normalize(value)
  if (!raw) return ''
  const match = raw.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/)
  if (!match) return ''
  const [, year, month, day] = match
  return `${year}-${month.padStart(2, '0')}-${(day || '01').padStart(2, '0')}`
}

function pageShell({ title, description, canonical, ogType = 'website', body, schema, activeNav = '' }) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="index,follow" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:site_name" content="土耳其植发透明指南" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <title>${escapeHtml(title)}</title>
    <link rel="stylesheet" href="/assets/styles.css?v=20261109" />
    <style>
      .entity-main {
        padding: 24px 0 64px;
      }
      .entity-shell {
        width: min(1180px, calc(100% - 32px));
        margin: 0 auto;
      }
      .entity-breadcrumbs {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: var(--text-soft);
        margin-bottom: 16px;
      }
      .entity-breadcrumbs a {
        color: var(--brand);
        text-decoration: none;
      }
      .entity-breadcrumbs a:hover {
        text-decoration: underline;
      }
      .entity-hero {
        border: 1px solid var(--line);
        background: #ffffff;
        border-radius: var(--radius-lg);
        padding: 28px;
        box-shadow: var(--shadow);
      }
      .entity-kicker {
        display: inline-flex;
        padding: 4px 12px;
        border-radius: 999px;
        background: rgba(15, 76, 129, 0.08);
        color: var(--brand);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }
      .entity-title {
        margin: 14px 0 0;
        font-size: clamp(30px, 4.4vw, 46px);
        line-height: 1.1;
        letter-spacing: -0.04em;
        color: var(--brand-deep);
      }
      .entity-subtitle {
        margin-top: 12px;
        max-width: 820px;
        font-size: 16px;
        line-height: 1.7;
        color: var(--text-soft);
      }
      .entity-meta {
        margin-top: 22px;
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .entity-pill {
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: var(--surface-muted);
        padding: 14px 16px;
      }
      .entity-pill strong {
        display: block;
        font-size: 20px;
        color: var(--brand-deep);
      }
      .entity-pill span {
        display: block;
        margin-top: 4px;
        font-size: 12px;
        line-height: 1.6;
        color: var(--text-soft);
      }
      .entity-grid {
        display: grid;
        gap: 18px;
        margin-top: 20px;
        grid-template-columns: 1.15fr 0.85fr;
      }
      .entity-card {
        border: 1px solid var(--line);
        background: #ffffff;
        border-radius: var(--radius-lg);
        padding: 24px;
        box-shadow: 0 10px 24px rgba(15, 76, 129, 0.05);
      }
      .entity-section-title {
        margin: 0 0 16px;
        font-size: 20px;
        letter-spacing: -0.03em;
        color: var(--brand-deep);
      }
      .entity-spec-row {
        display: flex;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px solid #f0f4f7;
        font-size: 14px;
      }
      .entity-spec-row:last-child {
        border-bottom: none;
      }
      .entity-spec-label {
        color: var(--text-soft);
      }
      .entity-spec-val {
        font-weight: 600;
        color: var(--brand-deep);
      }
      .entity-card p,
      .entity-card li {
        font-size: 14.5px;
        line-height: 1.8;
        color: var(--text-soft);
      }
      .entity-card p + p {
        margin-top: 12px;
      }
      .entity-list {
        margin: 14px 0 0;
        padding-left: 20px;
      }
      .entity-list li + li {
        margin-top: 8px;
      }
      .entity-links {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 20px;
      }
      .entity-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        padding: 0 18px;
        border-radius: 999px;
        font-size: 13.5px;
        font-weight: 700;
        transition: 180ms ease;
      }
      .entity-button-primary {
        background: var(--brand-soft);
        color: var(--brand-deep);
        box-shadow: 0 12px 24px rgba(0, 196, 180, 0.2);
      }
      .entity-button-secondary {
        border: 1px solid var(--line);
        background: #fff;
        color: var(--brand);
      }
      .entity-photo {
        width: 100%;
        border-radius: var(--radius-md);
        object-fit: cover;
        aspect-ratio: 4 / 4.3;
        background: #e8eff3;
      }
      @media (max-width: 920px) {
        .entity-grid,
        .entity-meta {
          grid-template-columns: 1fr;
        }
      }
    </style>
    <script type="application/ld+json">${JSON.stringify(schema)}</script>
  </head>
  <body>
    <div class="shell">
      <header class="header">
        <div class="container header-inner">
          <a href="/">
            <div class="brand-title">土耳其植发指南</div>
            <div class="brand-subtitle">Turkey Hair Transplant Guide</div>
          </a>
          <nav class="nav">
            <a href="/" class="nav-link ${activeNav === 'clinics' ? '' : 'nav-link-active'}">攻略信息</a>
            <a href="/clinics/" class="nav-link ${activeNav === 'clinics' ? 'nav-link-active' : ''}">工具查询</a>
          </nav>
        </div>
      </header>

      <main class="entity-main">
        <div class="entity-shell">
          ${body}
        </div>
      </main>

      <footer class="footer">
        <div class="container">
          <div class="card footer-card">
            <p>资料更正、信息补充与版权联系：<a href="mailto:contact@trhairguide.com">contact@trhairguide.com</a></p>
          </div>
        </div>
      </footer>
    </div>
    <script src="/assets/app.js?v=20261122k" defer></script>
  </body>
</html>`
}

function buildDoctorPage(doctor, slug) {
  const name = doctor.doctor_name_cn || doctor.doctor_name_en
  const englishName = doctor.doctor_name_en || doctor.doctor_name_cn
  const canonical = `${siteOrigin}/doctors/${slug}/`
  const title = `${englishName} 医生资料 | 土耳其植发医生`
  const description = `${englishName}（${name}）医生资料页：查看 ISHRS 级别、ABHRS、城市、擅长方向、手术模式和公开备注，作为筛选土耳其植发医生的第一步。`
  const photo = formatPhoto(doctor.photo)
  const noteHtml = noteParagraphs(doctor.notes_cn || doctor.note_en, '当前医生页暂无更多公开备注。').join('\n              ')
  const verifiedDate = normalizeDate(doctor.last_verified)
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: title,
        description,
        inLanguage: 'zh-CN',
      },
      {
        '@type': 'Physician',
        '@id': `${canonical}#physician`,
        name: englishName,
        alternateName: name,
        url: canonical,
        medicalSpecialty: doctor.specialty_cn || doctor.specialty_en || undefined,
        address: doctor.city_cn || doctor.city || undefined,
      },
    ],
  }
  if (verifiedDate) schema['@graph'][1].dateModified = verifiedDate

  const body = `
          <div class="entity-breadcrumbs">
            <a href="/">首页</a> <span>/</span>
            <a href="/doctors/">医生库</a> <span>/</span>
            <span>${escapeHtml(englishName)}</span>
          </div>

          <section class="entity-hero">
            <div class="entity-kicker">Doctor Profile · 医生图鉴资料</div>
            <h1 class="entity-title">${escapeHtml(name)}</h1>
            <div class="entity-subtitle">${escapeHtml(englishName)} · ${escapeHtml(doctor.city_cn || doctor.city || '土耳其')} · ${escapeHtml(formatDoctorStatus(doctor))}。适合在联系医生前快速核对资质级别、背景、擅长方向和手术模式。</div>
            <div class="entity-meta">
              <div class="entity-pill"><strong>${escapeHtml(formatDoctorStatus(doctor))}</strong><span>ISHRS 会员级别</span></div>
              <div class="entity-pill"><strong>${escapeHtml(formatAbhrs(doctor))}</strong><span>是否公开 ABHRS</span></div>
              <div class="entity-pill"><strong>${escapeHtml(doctor.surgery_model_cn || doctor.surgery_model || '未标注')}</strong><span>公开手术模式</span></div>
            </div>
          </section>

          <section class="entity-grid">
            <article class="entity-card">
              <h2 class="entity-section-title">核心档案与参数</h2>
              <div class="entity-spec-row"><span class="entity-spec-label">执业城市</span><span class="entity-spec-val">${escapeHtml(doctor.city_cn || doctor.city || '未标注')}</span></div>
              <div class="entity-spec-row"><span class="entity-spec-label">专业背景</span><span class="entity-spec-val">${escapeHtml(doctor.background_type_cn || doctor.background_type_en || '未标注')}</span></div>
              <div class="entity-spec-row"><span class="entity-spec-label">擅长技术</span><span class="entity-spec-val">${escapeHtml(doctor.specialty_cn || doctor.specialty_en || '未标注')}</span></div>
              <div class="entity-spec-row"><span class="entity-spec-label">最后核对</span><span class="entity-spec-val">${escapeHtml(doctor.last_verified || '未标注')}</span></div>
              <div class="entity-links">
                <a href="/doctors/" class="entity-button entity-button-primary">返回医生库</a>
                ${doctor.website ? `<a href="${ensureUrl(doctor.website)}" target="_blank" rel="noreferrer" class="entity-button entity-button-secondary">访问官网</a>` : ''}
              </div>
            </article>
            <aside class="entity-card">
              ${photo ? `<img class="entity-photo" src="${photo}" alt="${escapeHtml(englishName)}" />` : `<div class="entity-photo" style="display:flex;align-items:center;justify-content:center;color:#8a9ba8;font-size:18px;">暂无照片</div>`}
            </aside>
          </section>

          <section class="entity-grid">
            <article class="entity-card">
              <h2 class="entity-section-title">公开特点与学术备注</h2>
              ${noteHtml}
            </article>
            <article class="entity-card">
              <h2 class="entity-section-title">面诊/联系前必查 4 问</h2>
              <ul class="entity-list">
                <li><strong>关键步骤分工</strong>：发际线设计、打孔（开通道）、取发到底由谁亲手完成。</li>
                <li><strong>手术排期密度</strong>：医生一天做几台手术，团队助手是否稳定长期配合。</li>
                <li><strong>书面评估方案</strong>：是否能在术前提供详细的供区密度、种植株数书面预估。</li>
                <li><strong>案例与修复经验</strong>：是否有类似脱发等级的真实长期案例或高难度修复案例。</li>
              </ul>
            </article>
          </section>

          <section class="entity-grid">
            <article class="entity-card">
              <h2 class="entity-section-title">相关攻略推荐</h2>
              <div class="entity-links">
                <a href="/guides/" class="entity-button entity-button-secondary">植发全流程与避坑指南</a>
                <a href="/blog/how-to-choose-a-doctor-not-a-clinic" class="entity-button entity-button-secondary">如何选择植发医生而非流水线诊所</a>
                <a href="/blog/price-difference" class="entity-button entity-button-secondary">土耳其植发价格为什么差异巨大</a>
              </div>
            </article>
          </section>`

  return pageShell({
    title,
    description,
    canonical,
    body,
    schema,
    activeNav: 'doctors',
  })
}

function buildClinicPage(clinic, slug) {
  const name = clinic.name_zh || clinic.clinic_name || clinic.name_en || clinic.official_name
  const englishName = clinic.name_en || clinic.clinic_name || clinic.official_name
  const canonical = `${siteOrigin}/clinics/${slug}/`
  const rating = formatRating(clinic.google_rating)
  const reviews = formatReviewCount(clinic.google_review_count)
  const description = `${englishName} 诊所资料页：查看机构类型、公开评分、评价数、官网、具名医生与备注信息，作为筛选伊斯坦布尔植发诊所的第一轮参考。`
  const title = `${englishName} 诊所资料 | 伊斯坦布尔植发诊所`
  const noteHtml = noteParagraphs(clinic.note, '当前诊所页暂无更多公开备注。').join('\n              ')
  const googleValue = normalize(clinic.google_summary_cn)
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: title,
        description,
        inLanguage: 'zh-CN',
      },
      {
        '@type': 'MedicalClinic',
        '@id': `${canonical}#clinic`,
        name: englishName,
        alternateName: name,
        url: canonical,
      },
    ],
  }

  const body = `
          <div class="entity-breadcrumbs">
            <a href="/">首页</a> <span>/</span>
            <a href="/clinics/">诊所库</a> <span>/</span>
            <span>${escapeHtml(englishName)}</span>
          </div>

          <section class="entity-hero">
            <div class="entity-kicker">Clinic Profile · 机构图鉴资料</div>
            <h1 class="entity-title">${escapeHtml(name)}</h1>
            <div class="entity-subtitle">${escapeHtml(englishName)} · ${escapeHtml(formatFacilityType(clinic.facility_type))}。适合在联系机构前，先核对评分、评价数、公开备注、官网与医生分工信息。</div>
            <div class="entity-meta">
              <div class="entity-pill"><strong>${escapeHtml(rating ? rating + ' / 5.0' : '待更新')}</strong><span>Google 真实评分</span></div>
              <div class="entity-pill"><strong>${escapeHtml(reviews ? reviews + ' 条' : '待更新')}</strong><span>Google 评价总量</span></div>
              <div class="entity-pill"><strong>${escapeHtml(clinic.google_checked_at || clinic.last_checked || '未标注')}</strong><span>最近核对时间</span></div>
            </div>
          </section>

          <section class="entity-grid">
            <article class="entity-card">
              <h2 class="entity-section-title">机构核心资料</h2>
              <div class="entity-spec-row"><span class="entity-spec-label">注册名称</span><span class="entity-spec-val">${escapeHtml(clinic.official_name || '未标注')}</span></div>
              <div class="entity-spec-row"><span class="entity-spec-label">机构性质</span><span class="entity-spec-val">${escapeHtml(formatFacilityType(clinic.facility_type))}</span></div>
              <div class="entity-spec-row"><span class="entity-spec-label">具名医生</span><span class="entity-spec-val">${escapeHtml(clinic.lead_doctor || '未公开具体医生')}</span></div>
              <div class="entity-spec-row"><span class="entity-spec-label">价格透明度</span><span class="entity-spec-val">${escapeHtml(clinic.price_transparency ? '有公开套餐价' : '需单独问诊')}</span></div>
              <div class="entity-links">
                <a href="/clinics/" class="entity-button entity-button-primary">返回诊所库</a>
                ${clinic.website ? `<a href="${ensureUrl(clinic.website)}" target="_blank" rel="noreferrer" class="entity-button entity-button-secondary">访问官网</a>` : ''}
                ${googleValue && isUrl(googleValue) ? `<a href="${ensureUrl(googleValue)}" target="_blank" rel="noreferrer" class="entity-button entity-button-secondary">查看 Google Maps</a>` : ''}
              </div>
            </article>
            <article class="entity-card">
              <h2 class="entity-section-title">公开备注与价格线索</h2>
              ${noteHtml}
              ${googleValue && !isUrl(googleValue) ? `<p style="margin-top:12px;"><strong>评价快照摘要：</strong>${escapeHtml(googleValue)}</p>` : ''}
            </article>
          </section>

          <section class="entity-grid">
            <article class="entity-card">
              <h2 class="entity-section-title">联系前必查 4 问</h2>
              <ul class="entity-list">
                <li><strong>具体主刀人员</strong>：客服报价是“医生打孔套餐”还是“技师团队套餐”。</li>
                <li><strong>关键操作分工</strong>：发际线设计、打孔、取发、植入分别由谁负责。</li>
                <li><strong>每日接诊量</strong>：该机构一天安排几台手术，是否属于流水线批量排班。</li>
                <li><strong>全包套餐明细</strong>：费用是否包含术后洗护、药品、翻译及复查质保。</li>
              </ul>
            </article>
            <article class="entity-card">
              <h2 class="entity-section-title">防坑提醒</h2>
              <p>伊斯坦布尔许多知名机构存在多种档位套餐。同一家机构，医生亲手打孔与技师团队打孔价格可能相差 2-3 倍。</p>
            </article>
          </section>

          <section class="entity-grid">
            <article class="entity-card">
              <h2 class="entity-section-title">相关攻略推荐</h2>
              <div class="entity-links">
                <a href="/guides/" class="entity-button entity-button-secondary">植发全流程避坑指南</a>
                <a href="/blog/clinic-compliance-checklist" class="entity-button entity-button-secondary">如何验证诊所卫生部执照</a>
                <a href="/blog/price-difference" class="entity-button entity-button-secondary">土耳其植发价格为什么差异巨大</a>
              </div>
            </article>
          </section>`

  return pageShell({
    title,
    description,
    canonical,
    body,
    schema,
    activeNav: 'clinics',
  })
}

async function resetGeneratedDirs(baseDir) {
  const entries = await fs.readdir(baseDir, { withFileTypes: true })
  await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => fs.rm(path.join(baseDir, entry.name), { recursive: true, force: true }))
  )
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function routePriority(url) {
  if (url === '/') return '1.0'
  if (url === '/doctors/' || url === '/clinics/') return '0.9'
  if (url.startsWith('/doctors/') || url.startsWith('/clinics/')) return '0.8'
  if (url === '/blog/' || url === '/guides/' || url === '/about/') return '0.8'
  if (url === '/hiv/') return '0.9'
  return '0.8'
}

function routeChangeFreq(url) {
  if (url === '/' || url === '/doctors/' || url === '/clinics/' || url === '/blog/') return 'weekly'
  return 'monthly'
}

async function buildSitemap(doctorSlugs, clinicSlugs) {
  const blogDir = path.join(rootDir, 'blog')
  const blogFiles = (await fs.readdir(blogDir))
    .filter((name) => name.endsWith('.html') && name !== 'index.html' && name !== 'hiv-hair-transplant.html' && name !== 'why-i-built-this-site.html')
    .sort()

  const routes = [
    ['/', path.join(rootDir, 'index.html')],
    ['/doctors/', path.join(rootDir, 'doctors/index.html')],
    ['/clinics/', path.join(rootDir, 'clinics/index.html')],
    ['/guides/', path.join(rootDir, 'guides/index.html')],
    ['/blog/', path.join(rootDir, 'blog/index.html')],
    ['/hiv/', path.join(rootDir, 'hiv/index.html')],
    ['/about/', path.join(rootDir, 'about/index.html')],
  ]

  for (const file of blogFiles) {
    const slug = file.replace(/\.html$/, '')
    routes.push([`/blog/${slug}`, path.join(blogDir, file)])
  }

  for (const doctor of doctors) {
    const slug = doctorSlugs.get(doctor.doctor_id)
    routes.push([`/doctors/${slug}/`, path.join(rootDir, `doctors/${slug}/index.html`)])
  }

  for (const clinic of clinics) {
    const slug = clinicSlugs.get(clinic.clinic_id)
    routes.push([`/clinics/${slug}/`, path.join(rootDir, `clinics/${slug}/index.html`)])
  }

  const entries = await Promise.all(
    routes.map(async ([url, filePath]) => {
      const stat = await fs.stat(filePath)
      const lastmod = stat.mtime.toISOString().slice(0, 10)
      return `  <url>
    <loc>${xmlEscape(`${siteOrigin}${url}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${routeChangeFreq(url)}</changefreq>
    <priority>${routePriority(url)}</priority>
  </url>`
    })
  )

  await fs.writeFile(
    path.join(rootDir, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`
  )
}

const doctorSlugs = buildSlugMap(doctors, (item) => item.doctor_name_en || item.doctor_name_cn || item.doctor_id, (item) => item.doctor_id)
const clinicSlugs = buildSlugMap(clinics, (item) => item.name_en || item.clinic_name || item.official_name || item.clinic_id, (item) => item.clinic_id)

await resetGeneratedDirs(path.join(rootDir, 'doctors'))
await resetGeneratedDirs(path.join(rootDir, 'clinics'))

for (const doctor of doctors) {
  const slug = doctorSlugs.get(doctor.doctor_id)
  const dir = path.join(rootDir, 'doctors', slug)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, 'index.html'), buildDoctorPage(doctor, slug))
}

for (const clinic of clinics) {
  const slug = clinicSlugs.get(clinic.clinic_id)
  const dir = path.join(rootDir, 'clinics', slug)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, 'index.html'), buildClinicPage(clinic, slug))
}

await buildSitemap(doctorSlugs, clinicSlugs)

console.log(`Generated ${doctors.length} doctor pages and ${clinics.length} clinic pages.`)
