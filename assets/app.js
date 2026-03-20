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

                    <div class="border-t border-stone-100 pt-4 text-sm">
                      <a href="${doctor.website || '#'}" ${doctor.website ? 'target="_blank" rel="noreferrer"' : ''} class="font-medium text-clay ${doctor.website ? 'hover:underline' : 'pointer-events-none text-stone-400'}">${doctor.website ? websiteHost(doctor.website) : '暂无官网'}</a>
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
  const statDoctorBtn = document.getElementById('stat-doctor')
  const statHospitalBtn = document.getElementById('stat-hospital')
  const statPriceBtn = document.getElementById('stat-price')
  let activeStat = 'all'

  loadJson('/data/clinics.json')
    .then((clinics) => {
      total.textContent = clinics.length
      const namedDoctorCount = clinics.filter((clinic) => normalize(clinic.lead_doctor) !== '').length
      const hospitalCount = clinics.filter((clinic) => normalize(clinic.facility_type).toLowerCase() === 'hospital').length
      const priceCount = clinics.filter((clinic) => normalize(clinic.price_transparency) !== '').length

      const statAllCount = document.getElementById('stat-all-count')
      const statDoctorCount = document.getElementById('stat-doctor-count')
      const statHospitalCount = document.getElementById('stat-hospital-count')
      const statPriceCount = document.getElementById('stat-price-count')
      const overviewDoctorCount = document.getElementById('overview-doctor-count')
      const overviewHospitalCount = document.getElementById('overview-hospital-count')
      const overviewPriceCount = document.getElementById('overview-price-count')
      if (statAllCount) statAllCount.textContent = clinics.length
      if (statDoctorCount) statDoctorCount.textContent = namedDoctorCount
      if (statHospitalCount) statHospitalCount.textContent = hospitalCount
      if (statPriceCount) statPriceCount.textContent = priceCount
      if (overviewDoctorCount) overviewDoctorCount.textContent = namedDoctorCount
      if (overviewHospitalCount) overviewHospitalCount.textContent = hospitalCount
      if (overviewPriceCount) overviewPriceCount.textContent = priceCount

      const syncButtons = () => {
        const buttonMap = {
          all: statAllBtn,
          doctor: statDoctorBtn,
          hospital: statHospitalBtn,
          price: statPriceBtn,
        }
        Object.entries(buttonMap).forEach(([key, button]) => {
          if (!button) return
          button.className = `clinic-filter-btn inline-flex w-full items-center justify-between rounded-[1.15rem] border px-4 py-3 text-left text-sm font-medium transition ${
            activeStat === key
              ? 'border-[#8b5e34] bg-[#8b5e34] text-white shadow-[0_14px_30px_rgba(139,94,52,0.22)]'
              : 'border-[#dcc8b0] bg-[#f7ecdf] text-stone-800 hover:border-[#b99976] hover:bg-[#f2e2cf]'
          }`
        })
      }

      const render = () => {
        const q = searchInput.value.trim().toLowerCase()
        const sort = sortSelect.value

        let result = clinics.filter((clinic) => {
          const hasDoctor = normalize(clinic.lead_doctor) !== ''
          const hasPrice = normalize(clinic.price_transparency) !== ''

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
              clinicTypeLabel(clinic),
              clinicStructure(clinic),
            ]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(q))

          const matchStat =
            activeStat === 'all' ||
            (activeStat === 'doctor' && hasDoctor) ||
            (activeStat === 'hospital' && normalize(clinic.facility_type).toLowerCase() === 'hospital') ||
            (activeStat === 'price' && hasPrice)

          return matchSearch && matchStat
        })

        result = result.sort((a, b) => {
          if (sort === 'name') {
            return (a.clinic_name || a.official_name).localeCompare(b.clinic_name || b.official_name, 'zh-Hans-CN-u-co-pinyin')
          }
          if (sort === 'recent') {
            return normalize(b.last_checked).localeCompare(normalize(a.last_checked))
          }
          return 0
        })

        count.textContent = result.length
        tableBody.innerHTML = result
          .map((clinic) => {
            return `
              <tr class="border-b border-stone-200 align-top transition hover:bg-stone-50/70">
                <td class="px-4 py-5 text-stone-900">
                  <div class="font-semibold text-stone-900">${clinic.clinic_name || '—'}</div>
                  <div class="mt-2 text-sm text-stone-500">${clinicTypeLabel(clinic)}</div>
                </td>
                <td class="px-4 py-5 text-stone-700 break-words">${formatLeadDoctorName(clinic.lead_doctor)}</td>
                <td class="px-4 py-5 text-sm leading-7 text-stone-600 break-words">${clinicSurgeryModeLabel(clinic)}</td>
                <td class="px-4 py-5 text-stone-700 whitespace-nowrap"><a href="${clinic.website || '#'}" ${clinic.website ? 'target="_blank" rel="noreferrer"' : ''} class="${clinic.website ? 'text-clay font-medium hover:underline' : 'pointer-events-none text-stone-400'}">${clinic.website ? '官网链接' : '—'}</a></td>
                <td class="px-4 py-5"><span class="pill ${normalize(clinic.price_transparency) ? 'pill-success' : 'pill-brand'}">${clinicPriceLabel(clinic)}</span></td>
                <td class="table-cell-note px-4 py-5 text-sm leading-7 text-stone-600 whitespace-pre-line break-words">${normalize(clinic.note) || '—'}</td>
              </tr>
            `
          })
          .join('')

        syncButtons()
      }

      ;[searchInput, sortSelect].forEach((el) => el.addEventListener('input', render))
      ;[
        ['all', statAllBtn],
        ['doctor', statDoctorBtn],
        ['hospital', statHospitalBtn],
        ['price', statPriceBtn],
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
            <td colspan="6" class="px-4 py-8 text-center text-sm text-red-600">
              诊所数据加载失败：${error.message}
            </td>
          </tr>
        `
      }
    })
}

document.addEventListener('DOMContentLoaded', () => {
  injectSharedFooter()
  const page = document.body.dataset.page
  if (page === 'home') setupHome()
  if (page === 'doctors') setupDoctors()
  if (page === 'clinics') setupClinics()
})
