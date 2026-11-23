const formatDoctorStatus = (doctor) => doctor.ishrs_status_cn || doctor.ishrs_status || '—'
const normalize = (value) => String(value || '').trim()

function slugify(value) {
  return normalize(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildUniqueSlugMap(items, getBase, getId) {
  const counts = new Map()
  const slugs = new Map()
  items.forEach((item) => {
    const base = slugify(getBase(item)) || normalize(getId(item)).toLowerCase()
    const seen = counts.get(base) || 0
    counts.set(base, seen + 1)
    slugs.set(getId(item), seen === 0 ? base : `${base}-${seen + 1}`)
  })
  return slugs
}

function withBase(path) {
  const cleanPath = `/${String(path || '').replace(/^\/+/, '')}`
  return cleanPath
}

function injectGoogleAnalytics() {
  if (window.gtag || document.querySelector('script[data-ga="gtag-loader"]')) return

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', 'G-TKD1Q50FLF')

  const script = document.createElement('script')
  script.async = true
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-TKD1Q50FLF'
  script.dataset.ga = 'gtag-loader'
  document.head.appendChild(script)
}

function applyBrandName() {
  if (!document.body) return
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const nodes = []
  while (walker.nextNode()) nodes.push(walker.currentNode)
  nodes.forEach((node) => {
    if (node.nodeValue && node.nodeValue.includes('土耳其植发透明指南')) {
      node.nodeValue = node.nodeValue.replaceAll('土耳其植发透明指南', '土耳其植发指南')
    }
  })
  document.title = document.title.replace('土耳其植发透明指南', '土耳其植发指南')
}

function siteOrigin() {
  return 'https://trhairguide.com'
}

function upsertMeta(selector, attributes) {
  let node = document.querySelector(selector)
  if (!node) {
    node = document.createElement('meta')
    document.head.appendChild(node)
  }
  Object.entries(attributes).forEach(([key, value]) => {
    node.setAttribute(key, value)
  })
  return node
}

function readMeta(selector, attr = 'content') {
  const node = document.querySelector(selector)
  return node ? normalize(node.getAttribute(attr)) : ''
}

function stripTitleSuffix(title) {
  return normalize(title).replace(/\s*\|\s*土耳其植发(?:透明)?指南\s*$/, '').trim()
}

function detectDateModified() {
  const text = document.body ? document.body.textContent || '' : ''
  const match = text.match(/更新于\s*(\d{4}-\d{2}-\d{2})/)
  return match ? match[1] : ''
}

function breadcrumbItemsForPath(pathname) {
  const items = [{ name: '首页', url: `${siteOrigin()}/` }]

  if (pathname === '/doctors/') {
    items.push({ name: '医生库', url: `${siteOrigin()}/doctors/` })
  } else if (pathname === '/clinics/') {
    items.push({ name: '诊所库', url: `${siteOrigin()}/clinics/` })
  } else if (pathname === '/guides/') {
    items.push({ name: '术语解释', url: `${siteOrigin()}/guides/` })
  } else if (pathname === '/travel/') {
    items.push({ name: '赴土贴士', url: `${siteOrigin()}/travel/` })
  } else if (pathname === '/sources/') {
    items.push({ name: '权威译读', url: `${siteOrigin()}/sources/` })
  } else if (pathname === '/blog/') {
    items.push({ name: '科普文章', url: `${siteOrigin()}/blog/` })
  } else if (pathname === '/about/') {
    items.push({ name: '关于', url: `${siteOrigin()}/about/` })
  } else if (pathname === '/hiv/') {
    items.push({ name: 'HIV植发', url: `${siteOrigin()}/hiv/` })
  } else if (pathname.startsWith('/blog/') && pathname !== '/blog/') {
    items.push({ name: '科普文章', url: `${siteOrigin()}/blog/` })
  }

  return items
}

function injectSocialMeta() {
  const title = normalize(document.title)
  const description =
    readMeta('meta[name="description"]') ||
    readMeta('meta[property="og:description"]')
  const canonical = readMeta('link[rel="canonical"]', 'href') || window.location.href

  upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: '土耳其植发指南' })
  upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' })
  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title })
  upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description })
  upsertMeta('meta[name="twitter:url"]', { name: 'twitter:url', content: canonical })
}

function injectStructuredData() {
  if (document.querySelector('script[data-seo-schema="1"]')) return
  const robots = readMeta('meta[name="robots"]')
  if (robots.toLowerCase().includes('noindex')) return

  const canonical = readMeta('link[rel="canonical"]', 'href') || window.location.href
  const pathname = new URL(canonical, siteOrigin()).pathname
  const title = normalize(document.title)
  const headline = stripTitleSuffix(title)
  const description =
    readMeta('meta[name="description"]') ||
    readMeta('meta[property="og:description"]')
  const dateModified = detectDateModified()

  const organization = {
    '@type': 'Organization',
    '@id': `${siteOrigin()}/#organization`,
    name: '土耳其植发指南',
    url: siteOrigin(),
  }

  const graph = [organization]
  const breadcrumbItems = breadcrumbItemsForPath(pathname)

  const addWebPage = (type) => {
    const page = {
      '@type': type,
      '@id': `${canonical}#webpage`,
      url: canonical,
      name: headline || title,
      description,
      inLanguage: 'zh-CN',
      isPartOf: { '@id': `${siteOrigin()}/#website` },
      about: { '@id': `${siteOrigin()}/#organization` },
    }
    if (dateModified) page.dateModified = dateModified
    if (breadcrumbItems.length > 1) {
      page.breadcrumb = { '@id': `${canonical}#breadcrumb` }
    }
    graph.push(page)
  }

  if (breadcrumbItems.length > 1) {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${canonical}#breadcrumb`,
      itemListElement: breadcrumbItems.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    })
  }

  if (pathname === '/') {
    graph.push({
      '@type': 'WebSite',
      '@id': `${siteOrigin()}/#website`,
      url: siteOrigin(),
      name: '土耳其植发指南',
      description:
        description || '中立整理土耳其植发医生主导比例、法规和避坑信息。',
      inLanguage: 'zh-CN',
      publisher: { '@id': `${siteOrigin()}/#organization` },
    })
    addWebPage('WebPage')
  } else if (pathname === '/blog/' || pathname === '/guides/' || pathname === '/doctors/' || pathname === '/clinics/') {
    graph.push({
      '@type': 'WebSite',
      '@id': `${siteOrigin()}/#website`,
      url: siteOrigin(),
      name: '土耳其植发指南',
      inLanguage: 'zh-CN',
      publisher: { '@id': `${siteOrigin()}/#organization` },
    })
    addWebPage('CollectionPage')
  } else if (pathname === '/hiv/') {
    graph.push({
      '@type': 'WebSite',
      '@id': `${siteOrigin()}/#website`,
      url: siteOrigin(),
      name: '土耳其植发指南',
      inLanguage: 'zh-CN',
      publisher: { '@id': `${siteOrigin()}/#organization` },
    })
    addWebPage('WebPage')
  } else if (pathname === '/about/') {
    graph.push({
      '@type': 'WebSite',
      '@id': `${siteOrigin()}/#website`,
      url: siteOrigin(),
      name: '土耳其植发指南',
      inLanguage: 'zh-CN',
      publisher: { '@id': `${siteOrigin()}/#organization` },
    })
    addWebPage('AboutPage')
  } else if (pathname.startsWith('/blog/') && pathname !== '/blog/') {
    graph.push({
      '@type': 'WebSite',
      '@id': `${siteOrigin()}/#website`,
      url: siteOrigin(),
      name: '土耳其植发指南',
      inLanguage: 'zh-CN',
      publisher: { '@id': `${siteOrigin()}/#organization` },
    })
    const article = {
      '@type': 'Article',
      '@id': `${canonical}#article`,
      mainEntityOfPage: { '@id': `${canonical}#webpage` },
      headline: headline || title,
      description,
      articleSection: '土耳其植发科普文章',
      about: { '@id': `${siteOrigin()}/#organization` },
      author: { '@id': `${siteOrigin()}/#organization` },
      publisher: { '@id': `${siteOrigin()}/#organization` },
      inLanguage: 'zh-CN',
      url: canonical,
    }
    if (dateModified) article.dateModified = dateModified
    graph.push(article)
    addWebPage('WebPage')
  } else {
    graph.push({
      '@type': 'WebSite',
      '@id': `${siteOrigin()}/#website`,
      url: siteOrigin(),
      name: '土耳其植发指南',
      inLanguage: 'zh-CN',
      publisher: { '@id': `${siteOrigin()}/#organization` },
    })
    addWebPage('WebPage')
  }

  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.dataset.seoSchema = '1'
  script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })
  document.head.appendChild(script)
}

function injectSharedFooter() {
  if (document.querySelector('footer.footer')) return
  const shell = document.querySelector('.min-h-screen, .shell')
  if (!shell) return
  const footer = document.createElement('footer')
  footer.className = 'footer'
  footer.innerHTML = `
    <div class="container">
      <div class="card footer-card">
        <p>资料更正、信息补充与版权联系：<a href="mailto:contact@trhairguide.com">contact@trhairguide.com</a></p>
      </div>
    </div>
  `
  shell.appendChild(footer)
}

async function loadJson(path) {
  if (path.includes('clinics.json') && window.__CLINICS_DATA__) {
    return window.__CLINICS_DATA__
  }
  if (path.includes('doctors.json') && window.__DOCTORS_DATA__) {
    return window.__DOCTORS_DATA__
  }
  try {
    const response = await fetch(withBase(path))
    if (!response.ok) throw new Error(`Failed to load ${path}`)
    return await response.json()
  } catch (err) {
    if (path.includes('clinics.json') && window.__CLINICS_DATA__) return window.__CLINICS_DATA__
    if (path.includes('doctors.json') && window.__DOCTORS_DATA__) return window.__DOCTORS_DATA__
    throw err
  }
}

function websiteHost(url) {
  const value = normalize(url)
  if (!value) return '—'
  return value.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

function formatRating(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return ''
  return numeric.toFixed(1)
}

function formatReviewCount(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return ''
  return String(numeric)
}

function isLikelyUrl(value) {
  const raw = normalize(value)
  return /^https?:\/\//i.test(raw) || /^www\./i.test(raw)
}

function normalizeUrl(value) {
  const raw = normalize(value)
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  if (/^www\./i.test(raw)) return `https://${raw}`
  return raw
}

function getGoogleLink(item) {
  const raw = normalize(item.google_summary_cn)
  if (!isLikelyUrl(raw)) return ''
  return normalizeUrl(raw)
}

function getGoogleSummaryText(item) {
  const raw = normalize(item.google_summary_cn)
  if (!raw || isLikelyUrl(raw)) return ''
  return raw
}

function hasGoogleSnapshot(item) {
  return Boolean(formatRating(item.google_rating) || formatReviewCount(item.google_review_count) || getGoogleLink(item) || getGoogleSummaryText(item))
}

function renderGoogleSnapshot(item) {
  const rating = formatRating(item.google_rating)
  const count = Number(item.google_review_count)
  const checkedAt = normalize(item.google_checked_at)
  const googleLink = getGoogleLink(item)
  const googleSummary = getGoogleSummaryText(item)
  const parts = []
  if (rating) parts.push(`Google ${rating} / 5`)
  if (Number.isFinite(count) && count > 0) parts.push(`${count} 条评价`)
  if (checkedAt && (rating || (Number.isFinite(count) && count > 0) || googleLink || googleSummary)) parts.push(`核对 ${checkedAt}`)
  return parts.join(' · ')
}

function renderGoogleSummary(item, emptyText = '待更新：Google 评分、评价数量和摘要尚未整理。') {
  return getGoogleSummaryText(item) || emptyText
}

function resolveDoctorPhoto(photo) {
  const value = normalize(photo)
  if (!value) return ''
  const filename = value.split('/').pop() || ''
  const basename = filename.replace(/\.(jpg|jpeg|png|webp)$/i, '')
  return withBase(`assets/doctors/${basename}.jpeg`)
}

function statusScore(doctor) {
  const status = normalize(doctor.ishrs_status).toLowerCase()
  if (status === 'fellow') return 3
  if (status === 'member') return 2
  return 0
}

function summarizeDoctorNote(doctor) {
  const raw = normalize(doctor.notes_cn || doctor.note_en || doctor.publications_cn || doctor.publications || '暂无补充信息')
  if (!raw) return '暂无补充信息'
  const lines = raw
    .split('\n')
    .map((line) => line.replace(/^[-*•\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, 3)
  return lines.join('\n')
}

function clinicStructure(clinic) {
  const type = normalize(clinic.facility_type).toLowerCase()
  const hasDoctor = normalize(clinic.lead_doctor) !== ''
  const hasPrice = normalize(clinic.price_transparency) !== ''
  if (type === 'hospital') return '大型医院'
  if (hasDoctor && hasPrice) return '有医生 + package'
  if (hasDoctor) return '有医生 + 需咨询'
  return '其他'
}

function clinicTypeLabel(clinic) {
  const type = normalize(clinic.facility_type).toLowerCase()
  if (type === 'hospital') return '综合医院'
  if (type === 'medical_center') return '医疗中心'
  if (type === 'polyclinic') return '门诊 / 诊所'
  if (type === 'private clinic') return '私人诊所'
  return normalize(clinic.facility_type) || '未标注'
}

function clinicPriceLabel(clinic) {
  return normalize(clinic.price_transparency) ? '套餐价' : '需咨询'
}

function formatLeadDoctorName(value) {
  const raw = normalize(value)
  if (!raw) return '未具名'
  return raw
    .replace(/^DR[_\s-]*/i, '')
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ')
}

function setupHome() {
  const grid = document.getElementById('clinic-grid')
  const countEl = document.getElementById('db-count')
  const totalEl = document.getElementById('db-total')
  const searchInput = document.getElementById('sidebar-search')
  const typeSelect = document.getElementById('sidebar-type')
  const sortSelect = document.getElementById('sidebar-sort')
  const resetBtn = document.getElementById('sidebar-reset-btn')
  const filterBtns = document.querySelectorAll('.db-quick-filter-btn')

  if (!grid) return

  let activeFilter = 'all'

  loadJson('/data/clinics.json')
    .then((clinics) => {
      const clinicSlugMap = buildUniqueSlugMap(
        clinics,
        (clinic) => clinic.name_en || clinic.clinic_name || clinic.official_name || clinic.clinic_id,
        (clinic) => clinic.clinic_id
      )

      if (totalEl) totalEl.textContent = clinics.length

      // 统计各项核心数据
      const doctorCount = clinics.filter((c) => normalize(c.lead_doctor) !== '').length
      const priceCount = clinics.filter((c) => normalize(c.price_transparency) === 'package').length
      const ratingCount = clinics.filter((c) => Number(c.google_rating) >= 4.7).length
      const volumeCount = clinics.filter((c) => Number(c.google_review_count) >= 1000).length

      const countAll = document.getElementById('count-all')
      const countDoctor = document.getElementById('count-doctor')
      const countPrice = document.getElementById('count-price')
      const countRating = document.getElementById('count-rating')
      const countVolume = document.getElementById('count-volume')

      if (countAll) countAll.textContent = clinics.length
      if (countDoctor) countDoctor.textContent = doctorCount
      if (countPrice) countPrice.textContent = priceCount
      if (countRating) countRating.textContent = ratingCount
      if (countVolume) countVolume.textContent = volumeCount

      const syncFilterButtons = () => {
        filterBtns.forEach((btn) => {
          const filter = btn.dataset.filter
          if (filter === activeFilter) {
            btn.classList.add('is-active')
          } else {
            btn.classList.remove('is-active')
          }
        })
      }

      const render = () => {
        const q = searchInput ? searchInput.value.trim().toLowerCase() : ''
        const selectedType = typeSelect ? typeSelect.value : 'all'
        const selectedSort = sortSelect ? sortSelect.value : 'rating'

        let result = clinics.filter((clinic) => {
          const hasDoctor = normalize(clinic.lead_doctor) !== ''
          const hasPackagePrice = normalize(clinic.price_transparency) === 'package'
          const hasHighRating = Number(clinic.google_rating) >= 4.7
          const hasHighVolume = Number(clinic.google_review_count) >= 1000

          const matchSearch =
            !q ||
            [
              clinic.clinic_id,
              clinic.clinic_name,
              clinic.official_name,
              clinic.lead_doctor,
              clinic.note,
              clinic.real_review,
              clinic.website,
              clinic.google_summary_cn,
              clinicTypeLabel(clinic),
            ]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(q))

          const matchQuick =
            activeFilter === 'all' ||
            (activeFilter === 'doctor' && hasDoctor) ||
            (activeFilter === 'price' && hasPackagePrice) ||
            (activeFilter === 'rating' && hasHighRating) ||
            (activeFilter === 'volume' && hasHighVolume)

          const cType = normalize(clinic.facility_type).toLowerCase()
          const matchType = selectedType === 'all' || cType === selectedType

          return matchSearch && matchQuick && matchType
        })

        // 排序
        result = result.sort((a, b) => {
          if (selectedSort === 'name') {
            return (a.clinic_name || a.official_name).localeCompare(b.clinic_name || b.official_name, 'zh-Hans-CN-u-co-pinyin')
          }
          if (selectedSort === 'rating') {
            const ratingDiff = Number(b.google_rating || 0) - Number(a.google_rating || 0)
            if (ratingDiff !== 0) return ratingDiff
            return Number(b.google_review_count || 0) - Number(a.google_review_count || 0)
          }
          if (selectedSort === 'reviews') {
            return Number(b.google_review_count || 0) - Number(a.google_review_count || 0)
          }
          if (selectedSort === 'recent') {
            return normalize(b.google_checked_at).localeCompare(normalize(a.google_checked_at))
          }
          return 0
        })

        if (countEl) countEl.textContent = result.length

        if (result.length === 0) {
          grid.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 48px 20px; text-align: center; background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 18px; color: #64748b;">
              <p style="font-size: 16px; font-weight: 600; color: #0b3558;">未找到符合当前筛选条件的机构</p>
              <p style="font-size: 13px; margin-top: 6px;">可尝试清空关键词或点击左侧“重置筛选”查看全部 230 家合规机构。</p>
            </div>
          `
          return
        }

        grid.innerHTML = result
          .map((clinic) => {
            const rating = formatRating(clinic.google_rating)
            const reviewCount = formatReviewCount(clinic.google_review_count)
            const googleLink = getGoogleLink(clinic)
            const doctorName = normalize(clinic.lead_doctor) ? formatLeadDoctorName(clinic.lead_doctor) : ''
            const hasDoctor = Boolean(doctorName)
            const hasPackagePrice = normalize(clinic.price_transparency) === 'package'
            const noteText = normalize(clinic.note)
            const profilePath = clinicProfilePath(clinic, clinicSlugMap)

            return `
              <article class="db-clinic-card">
                <div>
                  <div class="db-card-top">
                    <h3 class="db-card-name">
                      <a href="${profilePath}">${clinic.clinic_name || clinic.official_name}</a>
                    </h3>
                  </div>
                  <div class="db-card-badges">
                    <span class="db-badge db-badge-type">${clinicTypeLabel(clinic)}</span>
                    <span class="db-badge db-badge-verified">✓ 卫生部合规</span>
                    ${hasPackagePrice ? '<span class="db-badge db-badge-price">公开套餐价</span>' : ''}
                    ${hasDoctor ? '<span class="db-badge db-badge-doctor">含具名医生</span>' : ''}
                  </div>
                </div>

                <div class="db-card-metrics">
                  <span class="db-card-rating">⭐ ${rating ? rating : '暂无评分'}</span>
                  <span class="db-card-reviews">${reviewCount ? reviewCount + ' 条评价' : '评价待核对'}</span>
                </div>

                <div class="db-card-doctor-line">
                  <span>👨‍⚕️</span>
                  <span><strong>主导/医生：</strong>${doctorName ? doctorName : '未具名（护士/技术团队执行）'}</span>
                </div>

                ${noteText ? `<div class="db-card-note">${noteText}</div>` : ''}

                <div class="db-card-actions">
                  <div class="db-card-actions-left">
                    <a href="${profilePath}" class="db-btn-detail">查看资料页 →</a>
                    ${googleLink ? `<a href="${googleLink}" target="_blank" rel="noreferrer" class="db-link-icon">📍地图</a>` : ''}
                    ${clinic.website ? `<a href="${clinic.website}" target="_blank" rel="noreferrer" class="db-link-icon">🌐官网</a>` : ''}
                  </div>
                </div>
              </article>
            `
          })
          .join('')
      }

      if (searchInput) searchInput.addEventListener('input', render)
      if (typeSelect) typeSelect.addEventListener('change', render)
      if (sortSelect) sortSelect.addEventListener('change', render)

      filterBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          activeFilter = btn.dataset.filter || 'all'
          syncFilterButtons()
          render()
        })
      })

      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          if (searchInput) searchInput.value = ''
          if (typeSelect) typeSelect.value = 'all'
          if (sortSelect) sortSelect.value = 'rating'
          activeFilter = 'all'
          syncFilterButtons()
          render()
        })
      }

      syncFilterButtons()
      render()
    })
    .catch((err) => {
      console.error(err)
      if (grid) {
        grid.innerHTML = `<div style="grid-column: 1 / -1; padding: 30px; text-align: center; color: #dc2626;">诊所数据库加载失败：${err.message}</div>`
      }
    })
}

function clinicSurgeryModeLabel(clinic) {
  if (normalize(clinic.lead_doctor)) return '具名医生，参与度需进一步核实'
  return '执行模式未公开'
}

function clinicSurgeryModeCompactLabel(clinic) {
  if (normalize(clinic.lead_doctor)) return '具名医生'
  return '未公开'
}

function doctorProfilePath(doctor, slugMap) {
  const slug = slugMap.get(doctor.doctor_id)
  return slug ? `/doctors/${slug}/` : '/doctors/'
}

function clinicProfilePath(clinic, slugMap) {
  const slug = slugMap.get(clinic.clinic_id)
  return slug ? `/clinics/${slug}/` : '/clinics/'
}

function setupDoctors() {
  const grid = document.getElementById('doctor-grid')
  const count = document.getElementById('doctor-count')
  const searchInput = document.getElementById('doctor-search')
  const citySelect = document.getElementById('doctor-city')
  const statusSelect = document.getElementById('doctor-status')
  const sortSelect = document.getElementById('doctor-sort')

  loadJson('/data/doctors.json').then((doctors) => {
    const doctorSlugMap = buildUniqueSlugMap(
      doctors,
      (doctor) => doctor.doctor_name_en || doctor.doctor_name_cn || doctor.doctor_id,
      (doctor) => doctor.doctor_id
    )
    const cities = [...new Set(doctors.map((doctor) => doctor.city_cn || doctor.city).filter(Boolean))]
    citySelect.innerHTML = `<option value="all">全部城市</option>${cities
      .map((city) => `<option value="${city}">${city}</option>`)
      .join('')}`

    const renderDoctorCard = (doctor) => {
      const note = summarizeDoctorNote(doctor)
      const hasAbhrs = normalize(doctor.abhrs).toLowerCase() === 'yes'
      const photo = resolveDoctorPhoto(doctor.photo)
      const initials = (doctor.doctor_name_cn || doctor.doctor_name_en || 'TR').slice(0, 2)
      const status = normalize(doctor.ishrs_status).toLowerCase()
      const statusClass = status === 'fellow' ? 'pill-success' : status === 'member' ? 'pill-brand' : ''
      const profilePath = doctorProfilePath(doctor, doctorSlugMap)
      return `
        <article class="group overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-soft transition hover:-translate-y-1 hover:border-stone-300">
          <div class="grid gap-0 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div class="relative min-h-[240px] border-b border-stone-200 bg-stone-100 lg:min-h-full lg:border-b-0 lg:border-r">
              ${photo ? `<img src="${photo}" alt="${doctor.doctor_name_cn || doctor.doctor_name_en}" class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid'" />` : ''}
              <div class="avatar-fallback ${photo ? '' : '!grid'} absolute inset-0 place-items-center bg-stone-100 text-4xl font-semibold text-stone-500">${initials}</div>
            </div>

            <div class="p-5 lg:p-6">
              <div class="flex flex-col gap-5">
                <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div class="min-w-0">
                    <h2 class="mt-2 text-3xl font-semibold tracking-tight text-stone-900">${doctor.doctor_name_en || doctor.doctor_name_cn}</h2>
                    <p class="mt-1 text-sm text-stone-500">${doctor.doctor_name_cn || ''}</p>
                    <div class="mt-3 flex flex-wrap gap-2">
                      <span class="pill ${statusClass}">${formatDoctorStatus(doctor)}</span>
                      ${hasAbhrs ? '<span class="pill pill-brand">ABHRS 认证</span>' : ''}
                      <span class="pill">${doctor.city_cn || doctor.city || '未标注城市'}</span>
                    </div>
                  </div>

                  <div class="grid gap-2 rounded-[1.35rem] border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600 xl:min-w-[240px]">
                    <div>
                      <div class="text-xs uppercase tracking-[0.18em] text-stone-400">职业背景</div>
                      <div class="mt-1 font-medium text-stone-900">${doctor.background_type_cn || doctor.background_type_en || '未标注'}</div>
                    </div>
                    <div>
                      <div class="text-xs uppercase tracking-[0.18em] text-stone-400">手术模式</div>
                      <div class="mt-1 font-medium text-stone-900">${doctor.surgery_model_cn || doctor.surgery_model || '未标注'}</div>
                    </div>
                  </div>
                </div>

                <div class="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                  <div class="rounded-[1.35rem] border border-stone-200 bg-stone-50 p-4">
                    <div class="text-xs uppercase tracking-[0.18em] text-stone-400">专长方向</div>
                    <div class="mt-2 text-base font-medium text-stone-900">${doctor.specialty_cn || doctor.specialty_en || '未标注'}</div>
                  </div>

                  <div class="rounded-[1.35rem] border border-stone-200 bg-white p-4">
                    <div class="text-xs uppercase tracking-[0.18em] text-stone-400">备注</div>
                    <div class="mt-2 whitespace-pre-line text-sm leading-7 text-stone-700">${note}</div>
                  </div>
                </div>

                <div class="border-t border-stone-100 pt-4">
                  <div class="flex flex-wrap gap-3">
                    <a href="${doctor.website || '#'}" ${doctor.website ? 'target="_blank" rel="noreferrer"' : ''} class="${doctor.website ? 'button button-secondary' : 'button pointer-events-none bg-stone-200 text-stone-400'}">${doctor.website ? '官网地址' : '暂无官网地址'}</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      `
    }

    const render = () => {
      const q = searchInput.value.trim().toLowerCase()
      const city = citySelect.value
      const status = statusSelect.value
      const sort = sortSelect.value

      let result = doctors.filter((doctor) => {
        const matchSearch =
          !q ||
          [
            doctor.doctor_name_cn,
            doctor.doctor_name_en,
            doctor.city_cn,
            doctor.city,
            doctor.specialty_cn,
            doctor.specialty_en,
            doctor.notes_cn,
            doctor.note_en,
            doctor.website,
            doctor.background_type_cn,
            doctor.google_summary_cn,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(q))

        const matchCity = city === 'all' || (doctor.city_cn || doctor.city) === city
        const matchStatus = status === 'all' || normalize(doctor.ishrs_status).toLowerCase() === status
        return matchSearch && matchCity && matchStatus
      })

      result = result.sort((a, b) => {
        if (sort === 'name') {
          return (a.doctor_name_cn || a.doctor_name_en).localeCompare(b.doctor_name_cn || b.doctor_name_en, 'zh-Hans-CN-u-co-pinyin')
        }
        if (sort === 'city') {
          return (a.city_cn || a.city).localeCompare(b.city_cn || b.city, 'zh-Hans-CN-u-co-pinyin')
        }
        return statusScore(b) - statusScore(a)
      })

      if (sort === 'status') {
        const targetIndex = result.findIndex((doctor) => doctor.doctor_id === 'DR_ILHAN_SERDAROGLU')
        if (targetIndex >= 0) {
          const [ilhan] = result.splice(targetIndex, 1)
          result.splice(2, 0, ilhan)
        }
      }

      count.textContent = result.length
      grid.innerHTML = result.length
        ? `<section class="grid gap-5">${result.map(renderDoctorCard).join('')}</section>`
        : `<div class="rounded-[1.5rem] border border-dashed border-stone-300 bg-white/80 p-8 text-center text-sm leading-7 text-stone-500">没有符合当前条件的医生资料。</div>`
    }

    ;[searchInput, citySelect, statusSelect, sortSelect].forEach((el) => el.addEventListener('input', render))
    render()
  })
}

function setupClinics() {
  const tableBody = document.getElementById('clinic-table-body')
  const count = document.getElementById('clinic-count')
  const total = document.getElementById('clinic-total')
  const searchInput = document.getElementById('clinic-search')
  const sortSelect = document.getElementById('clinic-sort')
  const reviewSortButton = document.getElementById('clinic-review-sort')
  const statAllBtn = document.getElementById('stat-all')
  const statUpdatedBtn = document.getElementById('stat-updated')
  const statHighRatingBtn = document.getElementById('stat-high-rating')
  const statHighVolumeBtn = document.getElementById('stat-high-volume')
  const statDoctorBtn = document.getElementById('stat-doctor')
  let activeStat = 'all'
  let reviewSortDirection = 'desc'

  loadJson('/data/clinics.json')
    .then((clinics) => {
      const clinicSlugMap = buildUniqueSlugMap(
        clinics,
        (clinic) => clinic.name_en || clinic.clinic_name || clinic.official_name || clinic.clinic_id,
        (clinic) => clinic.clinic_id
      )
      total.textContent = clinics.length
      const updatedCount = clinics.filter((clinic) => normalize(clinic.price_transparency) === 'package').length
      const highRatingCount = clinics.filter((clinic) => Number(clinic.google_rating) >= 4.7).length
      const highVolumeCount = clinics.filter((clinic) => Number(clinic.google_review_count) >= 1000).length
      const namedDoctorCount = clinics.filter((clinic) => normalize(clinic.lead_doctor) !== '').length

      const statAllCount = document.getElementById('stat-all-count')
      const statUpdatedCount = document.getElementById('stat-updated-count')
      const statHighRatingCount = document.getElementById('stat-high-rating-count')
      const statHighVolumeCount = document.getElementById('stat-high-volume-count')
      const statDoctorCount = document.getElementById('stat-doctor-count')
      if (statAllCount) statAllCount.textContent = clinics.length
      if (statUpdatedCount) statUpdatedCount.textContent = updatedCount
      if (statHighRatingCount) statHighRatingCount.textContent = highRatingCount
      if (statHighVolumeCount) statHighVolumeCount.textContent = highVolumeCount
      if (statDoctorCount) statDoctorCount.textContent = namedDoctorCount

      const syncButtons = () => {
        const buttonMap = {
          all: statAllBtn,
          updated: statUpdatedBtn,
          rating: statHighRatingBtn,
          volume: statHighVolumeBtn,
          doctor: statDoctorBtn,
        }
        Object.entries(buttonMap).forEach(([key, button]) => {
          if (!button) return
          const isActive = activeStat === key
          button.className = `clinic-filter-btn ${isActive ? 'is-active' : ''}`
          button.setAttribute('aria-pressed', isActive ? 'true' : 'false')
        })
      }

      const render = () => {
        const q = searchInput.value.trim().toLowerCase()
        const sort = sortSelect.value

        let result = clinics.filter((clinic) => {
          const hasDoctor = normalize(clinic.lead_doctor) !== ''
          const hasGoogle = hasGoogleSnapshot(clinic)
          const hasPackagePrice = normalize(clinic.price_transparency) === 'package'
          const hasHighRating = Number(clinic.google_rating) >= 4.7
          const hasHighVolume = Number(clinic.google_review_count) >= 1000

          const matchSearch =
            !q ||
            [
              clinic.clinic_id,
              clinic.clinic_name,
              clinic.official_name,
              clinic.lead_doctor,
              clinic.note,
              clinic.real_review,
              clinic.website,
              clinic.google_summary_cn,
              clinicTypeLabel(clinic),
              clinicStructure(clinic),
            ]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(q))

          const matchStat =
            activeStat === 'all' ||
            (activeStat === 'updated' && hasPackagePrice) ||
            (activeStat === 'rating' && hasHighRating) ||
            (activeStat === 'volume' && hasHighVolume) ||
            (activeStat === 'doctor' && hasDoctor) ||
            false

          return matchSearch && matchStat
        })

        result = result.sort((a, b) => {
          if (sort === 'name') {
            return (a.clinic_name || a.official_name).localeCompare(b.clinic_name || b.official_name, 'zh-Hans-CN-u-co-pinyin')
          }
          if (sort === 'rating') {
            const ratingDiff = Number(b.google_rating || 0) - Number(a.google_rating || 0)
            if (ratingDiff !== 0) return ratingDiff
            return Number(b.google_review_count || 0) - Number(a.google_review_count || 0)
          }
          if (sort === 'reviews') {
            return reviewSortDirection === 'asc'
              ? Number(a.google_review_count || 0) - Number(b.google_review_count || 0)
              : Number(b.google_review_count || 0) - Number(a.google_review_count || 0)
          }
          if (sort === 'recent') {
            return normalize(b.google_checked_at).localeCompare(normalize(a.google_checked_at))
          }
          return 0
        })

        count.textContent = result.length
        tableBody.innerHTML = result
          .map((clinic) => {
            const rating = formatRating(clinic.google_rating)
            const reviewCount = formatReviewCount(clinic.google_review_count)
            const googleLink = getGoogleLink(clinic)
            const ratingText = rating ? `${rating} / 5 · ${reviewCount || '评价待更新'}` : '评分待更新'
            const doctorName = normalize(clinic.lead_doctor) ? formatLeadDoctorName(clinic.lead_doctor) : ''
            const publicPrice = normalize(clinic.price_transparency) ? clinicPriceLabel(clinic) : ''
            const noteText = normalize(clinic.note)
            const profilePath = clinicProfilePath(clinic, clinicSlugMap)
            const name = normalize(clinic.clinic_name) || normalize(clinic.name_zh) || normalize(clinic.name_en) || normalize(clinic.official_name) || '未公开名称'
            const officialName = normalize(clinic.official_name)
            const ratingValue = rating ? `${rating} / 5` : '未收录'
            const reviewsValue = reviewCount ? `${reviewCount} 条` : '未收录'
            return `<article><details class="directory-clinic"><summary><div class="directory-clinic-name"><a href="${profilePath}" title="${name}">${name}</a>${officialName && officialName !== name ? `<small>${officialName}</small>` : ''}</div><span class="directory-clinic-type">${clinicTypeLabel(clinic)}</span><span class="directory-clinic-rating"><b>${ratingValue}</b><small>Google 评分</small></span><span class="directory-clinic-reviews"><b>${reviewsValue}</b><small>Google 评价</small></span><span class="directory-expand">查看</span></summary><div class="directory-detail"><div><div class="directory-detail-label">具名医生</div><p>${doctorName || '未公开'}</p></div><div><div class="directory-detail-label">公开套餐信息</div><p>${publicPrice || '未公开'}</p></div><div><div class="directory-detail-label">备注</div><p>${noteText || '—'}</p></div><div class="directory-actions"><a href="${profilePath}">查看公开资料</a>${googleLink ? `<a href="${googleLink}" target="_blank" rel="noreferrer">Google 地图</a>` : ''}${clinic.website ? `<a href="${clinic.website}" target="_blank" rel="noreferrer">官方网站</a>` : ''}</div></div></details></article>`
          })
          .join('')

        syncButtons()
        if (reviewSortButton) {
          const isReviews = sort === 'reviews'
          reviewSortButton.classList.toggle('is-active', isReviews)
          reviewSortButton.setAttribute('aria-pressed', isReviews ? 'true' : 'false')
          reviewSortButton.textContent = `评价数${reviewSortDirection === 'desc' ? '最多 ↓' : '最少 ↑'}`
        }
      }

      ;[searchInput, sortSelect].forEach((el) => el.addEventListener('input', render))
      if (reviewSortButton) {
        reviewSortButton.addEventListener('click', () => {
          if (sortSelect.value !== 'reviews') {
            sortSelect.value = 'reviews'
            reviewSortDirection = 'desc'
          } else {
            reviewSortDirection = reviewSortDirection === 'desc' ? 'asc' : 'desc'
          }
          render()
        })
      }
      ;[
        ['all', statAllBtn],
        ['updated', statUpdatedBtn],
        ['rating', statHighRatingBtn],
        ['volume', statHighVolumeBtn],
        ['doctor', statDoctorBtn],
      ].forEach(([key, button]) => {
        if (!button) return
        button.addEventListener('click', () => {
          activeStat = key
          render()
        })
      })
      render()
    })
    .catch((error) => {
      console.error(error)
      if (count) count.textContent = '0'
      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="1" class="px-4 py-8 text-center text-sm text-red-600">
              诊所数据加载失败：${error.message}
            </td>
          </tr>
        `
      }
    })
}

function setupIshrsDoctorDirectory() {
  const list = document.getElementById('ishrs-doctor-list')
  if (!list) return

  loadJson('/data/doctors.json')
    .then((doctors) => {
      const doctorSlugMap = buildUniqueSlugMap(
        doctors,
        (doctor) => doctor.doctor_name_en || doctor.doctor_name_cn || doctor.doctor_id,
        (doctor) => doctor.doctor_id
      )
      const listed = doctors
        .filter((doctor) => ['fellow', 'member'].includes(normalize(doctor.ishrs_status).toLowerCase()))
        .sort((a, b) => statusScore(b) - statusScore(a) || normalize(a.doctor_name_en).localeCompare(normalize(b.doctor_name_en)))

      if (!listed.length) {
        list.innerHTML = '<p class="directory-expert-loading">暂未收录可展示的 ISHRS 公开资料。</p>'
        return
      }

      list.innerHTML = listed
        .map((doctor) => {
          const fellow = normalize(doctor.ishrs_status).toLowerCase() === 'fellow'
          const abhrs = normalize(doctor.abhrs).toLowerCase() === 'yes'
          const name = doctor.doctor_name_cn || doctor.doctor_name_en || '未公开姓名'
          const profilePath = doctorProfilePath(doctor, doctorSlugMap)
          return `<article class="directory-expert-card"><div><span class="directory-expert-status ${fellow ? 'is-fellow' : ''}">${fellow ? 'ISHRS Fellow' : 'ISHRS 会员'}</span><h3>${name}</h3><p>${doctor.doctor_name_en && doctor.doctor_name_en !== name ? doctor.doctor_name_en : ''}</p></div><div class="directory-expert-meta"><span>${doctor.city_cn || doctor.city || '城市未标注'}</span><span>${doctor.background_type_cn || doctor.background_type_en || '专业背景未标注'}</span>${abhrs ? '<span>ABHRS 认证</span>' : ''}</div><a href="${profilePath}">查看公开资料</a></article>`
        })
        .join('')
    })
    .catch(() => {
      list.innerHTML = '<p class="directory-expert-loading">医生资料暂时无法加载。</p>'
    })
}

function injectUnifiedNavigation() {
  const pathname = window.location.pathname.replace(/index\.html$/, '') || '/'
  const links = [
    { href: '/', label: '攻略信息', active: !pathname.startsWith('/clinics/') && !pathname.startsWith('/doctors/') },
    { href: '/clinics/', label: '诊所查询', active: pathname.startsWith('/clinics/') },
    { href: '/doctors/', label: 'ISHRS 医生', active: pathname.startsWith('/doctors/') },
  ]

  document.querySelectorAll('header nav').forEach((nav) => {
    const legacyNav = nav.classList.contains('nav')
    nav.setAttribute('aria-label', '网站导航')
    nav.style.display = 'flex'
    nav.innerHTML = links
      .map(({ href, label, active }) => {
        const className = legacyNav ? `nav-link${active ? ' nav-link-active' : ''}` : active ? 'active' : ''
        return `<a href="${href}" class="${className}">${label}</a>`
      })
      .join('')
  })
}

document.addEventListener('DOMContentLoaded', () => {
  applyBrandName()
  injectUnifiedNavigation()
  injectGoogleAnalytics()
  injectSocialMeta()
  injectStructuredData()
  injectSharedFooter()
  const page = document.body.dataset.page
  if (page === 'home') setupHome()
  if (page === 'doctors') setupDoctors()
  if (page === 'clinics') setupClinics()
})
