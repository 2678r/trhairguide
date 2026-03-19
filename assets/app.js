const formatDoctorStatus = (doctor) => doctor.ishrs_status_cn || doctor.ishrs_status || '—'
const normalize = (value) => String(value || '').trim()

async function loadJson(path) {
  const response = await fetch(path)
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
  return `/assets/doctors/${basename}.jpeg`
}

function statusScore(doctor) {
  const status = normalize(doctor.ishrs_status).toLowerCase()
  if (status === 'fellow') return 3
  if (status === 'member') return 2
  if (status === 'former_member') return 1
  return 0
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
  if (type === 'hospital') return '医院'
  if (type === 'medical_center') return '医疗中心'
  if (type === 'polyclinic') return '门诊 / 诊所'
  if (type === 'private clinic') return '私人诊所'
  return normalize(clinic.facility_type) || '未标注'
}

function clinicPriceLabel(clinic) {
  return normalize(clinic.price_transparency) ? '套餐价' : '需咨询'
}

function setupHome() {
  Promise.all([loadJson('/data/doctors.json'), loadJson('/data/clinics.json')]).then(([doctors, clinics]) => {
    document.querySelector('[data-home-doctors]').textContent = doctors.length
    document.querySelector('[data-home-clinics]').textContent = clinics.length
  })
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
          const note = doctor.notes_cn || doctor.note_en || doctor.publications_cn || doctor.publications || '暂无补充信息'
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
                        <div class="text-xs uppercase tracking-[0.22em] text-stone-400">Doctor Profile</div>
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
                          <div class="text-xs uppercase tracking-[0.18em] text-stone-400">手术模型</div>
                          <div class="mt-1 font-medium text-stone-900">${doctor.surgery_model_cn || doctor.surgery_model || '未标注'}</div>
                        </div>
                        <div>
                          <div class="text-xs uppercase tracking-[0.18em] text-stone-400">最近核对</div>
                          <div class="mt-1 font-medium text-stone-900">${doctor.last_verified || '—'}</div>
                        </div>
                      </div>
                    </div>

                    <div class="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                      <div class="rounded-[1.35rem] border border-stone-200 bg-stone-50 p-4">
                        <div class="text-xs uppercase tracking-[0.18em] text-stone-400">专长方向</div>
                        <div class="mt-2 text-base font-medium text-stone-900">${doctor.specialty_cn || doctor.specialty_en || '未标注'}</div>
                      </div>

                      <div class="rounded-[1.35rem] border border-stone-200 bg-white p-4">
                        <div class="text-xs uppercase tracking-[0.18em] text-stone-400">备注 / 学术信息</div>
                        <div class="mt-2 whitespace-pre-line text-sm leading-7 text-stone-700">${note}</div>
                      </div>
                    </div>

                    <div class="flex items-center justify-between gap-4 border-t border-stone-100 pt-4 text-sm">
                      <a href="${doctor.website || '#'}" ${doctor.website ? 'target="_blank" rel="noreferrer"' : ''} class="font-medium text-clay ${doctor.website ? 'hover:underline' : 'pointer-events-none text-stone-400'}">${doctor.website ? websiteHost(doctor.website) : '暂无官网'}</a>
                      <span class="text-stone-500">${doctor.city_cn || doctor.city || '未标注城市'}</span>
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
  const packageBtn = document.getElementById('filter-package')
  const doctorBtn = document.getElementById('filter-doctor')
  const resetBtn = document.getElementById('filter-reset')
  let packageOnly = false
  let namedDoctorOnly = false

  loadJson('/data/clinics.json')
    .then((clinics) => {
      total.textContent = clinics.length

      const syncButtons = () => {
        if (packageBtn) {
          packageBtn.className = `clinic-filter-btn inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition ${
            packageOnly
              ? 'border-stone-900 bg-stone-900 text-white'
              : 'border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50'
          }`
        }
        if (doctorBtn) {
          doctorBtn.className = `clinic-filter-btn inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition ${
            namedDoctorOnly
              ? 'border-stone-900 bg-stone-900 text-white'
              : 'border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50'
          }`
        }
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

          const matchDoctor = !namedDoctorOnly || hasDoctor
          const matchPricing = !packageOnly || hasPrice

          return matchSearch && matchDoctor && matchPricing
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
                  <div class="mt-2 inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-500">${clinic.clinic_id}</div>
                </td>
                <td class="px-4 py-5 text-stone-700 break-words">${clinic.lead_doctor || '未具名'}</td>
                <td class="px-4 py-5"><span class="pill">${clinicTypeLabel(clinic)}</span></td>
                <td class="px-4 py-5 text-sm leading-7 text-stone-600 break-words">${clinic.official_name || '—'}</td>
                <td class="px-4 py-5 text-stone-700 whitespace-nowrap"><a href="${clinic.website || '#'}" ${clinic.website ? 'target="_blank" rel="noreferrer"' : ''} class="${clinic.website ? 'text-clay font-medium hover:underline' : 'pointer-events-none text-stone-400'}">${clinic.website ? '官网链接' : '—'}</a></td>
                <td class="px-4 py-5"><span class="pill ${normalize(clinic.price_transparency) ? 'pill-success' : 'pill-brand'}">${clinicPriceLabel(clinic)}</span></td>
                <td class="table-cell-note px-4 py-5 text-sm leading-7 text-stone-600 whitespace-pre-line break-words">${normalize(clinic.note) || '—'}</td>
                <td class="table-cell-note px-4 py-5 text-sm leading-7 ${normalize(clinic.real_review) === '欢迎真实评价' ? 'text-stone-400' : 'text-stone-700'} whitespace-pre-line break-words">${normalize(clinic.real_review) || '欢迎真实评价'}</td>
                <td class="px-4 py-5 whitespace-nowrap text-stone-500">${clinic.last_checked || '—'}</td>
              </tr>
            `
          })
          .join('')

        syncButtons()
      }

      ;[searchInput, sortSelect].forEach((el) => el.addEventListener('input', render))
      if (packageBtn) {
        packageBtn.addEventListener('click', () => {
          packageOnly = !packageOnly
          render()
        })
      }
      if (doctorBtn) {
        doctorBtn.addEventListener('click', () => {
          namedDoctorOnly = !namedDoctorOnly
          render()
        })
      }
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          packageOnly = false
          namedDoctorOnly = false
          searchInput.value = ''
          sortSelect.value = 'name'
          render()
        })
      }
      render()
    })
    .catch((error) => {
      console.error(error)
      if (count) count.textContent = '0'
      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="9" class="px-4 py-8 text-center text-sm text-red-600">
              诊所数据加载失败：${error.message}
            </td>
          </tr>
        `
      }
    })
}

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page
  if (page === 'home') setupHome()
  if (page === 'doctors') setupDoctors()
  if (page === 'clinics') setupClinics()
})
