const formatDoctorStatus = (doctor) => doctor.ishrs_status_cn || doctor.ishrs_status || '—'
const normalize = (value) => String(value || '').trim()

function getBasePath() {
  const { pathname, hostname } = window.location
  if (hostname === 'localhost' || hostname === '127.0.0.1') return ''
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length <= 1) return ''
  return `/${segments[0]}`
}

function withBase(path) {
  const cleanPath = `/${String(path || '').replace(/^\/+/, '')}`
  return `${getBasePath()}${cleanPath}`
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
  return normalize(title).replace(/\s*\|\s*土耳其植发透明指南\s*$/, '').trim()
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
  } else if (pathname === '/blog/') {
    items.push({ name: '科普文章', url: `${siteOrigin()}/blog/` })
  } else if (pathname === '/about/') {
    items.push({ name: '关于', url: `${siteOrigin()}/about/` })
  } else if (pathname === '/consult/') {
    items.push({ name: '提交反馈', url: `${siteOrigin()}/consult/` })
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

  upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: '土耳其植发透明指南' })
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
    name: '土耳其植发透明指南',
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
      name: '土耳其植发透明指南',
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
      name: '土耳其植发透明指南',
      inLanguage: 'zh-CN',
      publisher: { '@id': `${siteOrigin()}/#organization` },
    })
    addWebPage('CollectionPage')
  } else if (pathname === '/consult/') {
    graph.push({
      '@type': 'WebSite',
      '@id': `${siteOrigin()}/#website`,
      url: siteOrigin(),
      name: '土耳其植发透明指南',
      inLanguage: 'zh-CN',
      publisher: { '@id': `${siteOrigin()}/#organization` },
    })
    addWebPage('ContactPage')
  } else if (pathname === '/about/') {
    graph.push({
      '@type': 'WebSite',
      '@id': `${siteOrigin()}/#website`,
      url: siteOrigin(),
      name: '土耳其植发透明指南',
      inLanguage: 'zh-CN',
      publisher: { '@id': `${siteOrigin()}/#organization` },
    })
    addWebPage('AboutPage')
  } else if (pathname.startsWith('/blog/') && pathname !== '/blog/') {
    graph.push({
      '@type': 'WebSite',
      '@id': `${siteOrigin()}/#website`,
      url: siteOrigin(),
      name: '土耳其植发透明指南',
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
      name: '土耳其植发透明指南',
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
        <p>免责声明：本网站基于公开资料整理，仅供信息参考与术语解读，不构成医疗建议。所有医疗决定请结合官方信息、面诊结果与个人情况独立判断。</p>
      </div>
    </div>
  `
  shell.appendChild(footer)
}

async function loadJson(path) {
  const response = await fetch(withBase(path))
  if (!response.ok) throw new Error(`Failed to load ${path}`)
  return response.json()
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
  if (status === 'former_member') return 1
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
  Promise.all([loadJson('/data/doctors.json'), loadJson('/data/clinics.json')]).then(([doctors, clinics]) => {
    const doctorsEl = document.querySelector('[data-home-doctors]')
    const clinicsEl = document.querySelector('[data-home-clinics]')
    if (doctorsEl) doctorsEl.textContent = doctors.length
    if (clinicsEl) clinicsEl.textContent = clinics.length
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

function setupDoctors() {
  const grid = document.getElementById('doctor-grid')
  const count = document.getElementById('doctor-count')
  const searchInput = document.getElementById('doctor-search')
  const citySelect = document.getElementById('doctor-city')
  const statusSelect = document.getElementById('doctor-status')
  const sortSelect = document.getElementById('doctor-sort')

  loadJson('/data/doctors.json').then((doctors) => {
    const cities = [...new Set(doctors.map((doctor) => doctor.city_cn || doctor.city).filter(Boolean))]
    citySelect.innerHTML = `<option value="all">全部城市</option>${cities
      .map((city) => `<option value="${city}">${city}</option>`)
      .join('')}`

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

      count.textContent = result.length
      grid.innerHTML = result
        .map((doctor) => {
          const note = summarizeDoctorNote(doctor)
          const hasAbhrs = normalize(doctor.abhrs).toLowerCase() === 'yes'
          const photo = resolveDoctorPhoto(doctor.photo)
          const initials = (doctor.doctor_name_cn || doctor.doctor_name_en || 'TR').slice(0, 2)
          const status = normalize(doctor.ishrs_status).toLowerCase()
          const statusClass = status === 'fellow' ? 'pill-success' : status === 'member' ? 'pill-brand' : ''
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
                        <h2 class="mt-2 text-3xl font-semibold tracking-tight text-stone-900">${doctor.doctor_name_cn || doctor.doctor_name_en}</h2>
                        <p class="mt-1 text-sm text-stone-500">${doctor.doctor_name_en || ''}</p>
                        <div class="mt-3 flex flex-wrap gap-2">
                          <span class="pill ${statusClass}">${formatDoctorStatus(doctor)}</span>
                          <span class="pill ${hasAbhrs ? 'pill-brand' : ''}">${hasAbhrs ? 'ABHRS 认证' : '无 ABHRS'}</span>
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
                      <a href="${doctor.website || '#'}" ${doctor.website ? 'target="_blank" rel="noreferrer"' : ''} class="${doctor.website ? 'button button-primary' : 'button pointer-events-none bg-stone-200 text-stone-400'}">${doctor.website ? '官网地址' : '暂无官网地址'}</a>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          `
        })
        .join('')
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
  const statAllBtn = document.getElementById('stat-all')
  const statUpdatedBtn = document.getElementById('stat-updated')
  const statHighRatingBtn = document.getElementById('stat-high-rating')
  const statHighVolumeBtn = document.getElementById('stat-high-volume')
  const statDoctorBtn = document.getElementById('stat-doctor')
  let activeStat = 'all'

  loadJson('/data/clinics.json')
    .then((clinics) => {
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
          button.className = `clinic-filter-btn inline-flex w-full items-center justify-between rounded-[1.15rem] border px-4 py-3 text-left text-sm font-medium transition ${isActive ? 'is-active' : ''}`
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
            return Number(b.google_review_count || 0) - Number(a.google_review_count || 0)
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
            const ratingText = rating ? `评分 ${rating}/5` : '评分待更新'
            const reviewText = reviewCount ? `${reviewCount} 条评价` : '评价数待更新'
            const googleButton = googleLink
              ? `<a href="${googleLink}" target="_blank" rel="noreferrer" class="text-xs font-medium leading-5 text-clay hover:underline">Google地址</a>`
              : `<span class="text-xs font-medium leading-5 text-stone-400">Google地址</span>`
            const websiteButton = clinic.website
              ? `<a href="${clinic.website}" target="_blank" rel="noreferrer" class="text-xs font-medium leading-5 text-clay hover:underline">官网</a>`
              : `<span class="text-xs font-medium leading-5 text-stone-400">官网</span>`
            const doctorName = normalize(clinic.lead_doctor) ? formatLeadDoctorName(clinic.lead_doctor) : ''
            const publicPrice = normalize(clinic.price_transparency) ? clinicPriceLabel(clinic) : ''
            const noteText = normalize(clinic.note)
            return `
              <tr class="border-b border-stone-200 transition hover:bg-stone-50/70">
                <td class="px-0 py-0 text-stone-900">
                  <details class="group">
                    <summary class="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3">
                      <div class="min-w-0 flex-1">
                        <div class="grid min-w-0 gap-3 xl:grid-cols-[minmax(260px,320px)_minmax(90px,110px)_minmax(140px,170px)_minmax(96px,120px)_auto_auto] xl:items-center">
                          <div class="min-w-0">
                            <span class="block truncate text-[17px] font-semibold tracking-[-0.02em] leading-6 text-stone-900" title="${clinic.clinic_name || '—'}">${clinic.clinic_name || '—'}</span>
                          </div>
                          <div>
                            <span class="inline-flex shrink-0 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">${clinicTypeLabel(clinic)}</span>
                          </div>
                          <div class="min-w-0">
                            <span class="block truncate text-xs font-medium leading-5 text-stone-700" title="${ratingText}">${ratingText}</span>
                          </div>
                          <div class="min-w-0">
                            <span class="block truncate text-xs font-medium leading-5 text-stone-700" title="${reviewText}">${reviewText}</span>
                          </div>
                          <div>
                            ${googleButton}
                          </div>
                          <div>
                            ${websiteButton}
                          </div>
                        </div>
                      </div>
                      <span class="shrink-0 text-xs font-semibold tracking-[0.08em] text-sky-700 transition group-open:rotate-180">展开</span>
                    </summary>
                    <div class="border-t border-stone-200 bg-stone-50/60 px-4 py-3">
                      <div class="grid divide-stone-200 text-sm leading-6 text-stone-700 md:grid-cols-3 md:divide-x">
                        <div class="py-1 md:pr-4">
                          <div class="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">医生</div>
                          <div class="mt-1">${doctorName || '—'}</div>
                        </div>
                        <div class="border-t border-stone-200 pt-3 md:border-t-0 md:px-4 md:pt-1">
                          <div class="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">公开价格</div>
                          <div class="mt-1">${publicPrice || '—'}</div>
                        </div>
                        <div class="border-t border-stone-200 pt-3 md:border-t-0 md:pl-4 md:pt-1">
                          <div class="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">备注</div>
                          <div class="mt-1">${noteText || '—'}</div>
                        </div>
                      </div>
                    </div>
                  </details>
                </td>
              </tr>
            `
          })
          .join('')

        syncButtons()
      }

      ;[searchInput, sortSelect].forEach((el) => el.addEventListener('input', render))
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

document.addEventListener('DOMContentLoaded', () => {
  injectGoogleAnalytics()
  injectSocialMeta()
  injectStructuredData()
  injectSharedFooter()
  const page = document.body.dataset.page
  if (page === 'home') setupHome()
  if (page === 'doctors') setupDoctors()
  if (page === 'clinics') setupClinics()
})
