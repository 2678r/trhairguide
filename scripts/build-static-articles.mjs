import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const origin = 'https://trhairguide.com'
const updated = '2026-11-23'
const articles = [
  ['01', 'turkiye-hair-transplant-regulation', '土耳其卫生部规定：哪些人员可以进行植发手术？分别做什么？', '医生、辅助人员的资格与分工，以及开通道和手术室监督的法规要求。'],
  ['03', 'fue-dhi-marketing-terms', '咨询时不要被营销名称蒙蔽', 'FUT、FUE 与 DHI、蓝宝石等名称，分别代表什么？'],
  ['04', 'hair-transplant-consultation', '植发咨询前需要准备什么？', '拍照、健康信息和实际手术信息，应怎样完整准备？'],
  ['05', 'post-hair-transplant-care', '植发后的医嘱：如何保护移植毛囊？', '洗头、睡姿、运动、用药与随访的术后注意事项。'],
  ['06', 'donor-area-and-results', '植发不是增加发量：为什么供区决定最终效果？', '植发是有限毛囊资源的重新分配：能达到什么效果，又有哪些边界？'],
  ['07', 'do-not-trust-case-ads', '不要看案例广告：好诊所和糟糕诊所拿出来的照片都可能无懈可击', '案例照片只能参考；更应核实实际医生、手术机构和团队。'],
  ['08', 'how-to-choose-a-clinic', '如何选择土耳其植发诊所：先确认医生、团队与预算', '医生参与、团队模式、预算区间与咨询窗口，应该怎样逐项核对？'],
  ['09', 'who-performs-your-hair-transplant', '土耳其植发怎么选诊所？先问清楚：谁来给你做手术', '先分清实际手术机构，再确认当天为你做手术的人和团队。'],
  ['10', 'follicular-units-and-visual-density', '3000 个毛囊单位到底有多少？为什么同样数量，效果差很大？', '毛囊单位、原生密度、植入密度与视觉浓密感，应该怎样分清？'],
  ['11', 'realistic-hair-transplant-expectations', '植发效果应该期待到什么程度？不是每个人都能做出广告里的浓密感', '自身资源、脱发进程与毛发条件，如何决定植发效果的现实边界？'],
]

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char])
const inline = (value) => escapeHtml(value)
  .replace(/!\[([^\]]*)\]\(\.\/([^)]+)\)/g, '<img class="final-article-image" src="/articles/data/$2" alt="$1" />')
  .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

function markdownHtml(markdown) {
  const lines = markdown.replace(/\r/g, '').split('\n')
  const blocks = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()
    if (!line || line === '---') { i += 1; continue }
    const heading = line.match(/^(#{1,3})\s+(.+)$/)
    if (heading) { blocks.push(`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`); i += 1; continue }
    if (line.startsWith('> ')) { blocks.push(`<blockquote>${inline(line.slice(2))}</blockquote>`); i += 1; continue }
    if (line.startsWith('|') && /^\|?\s*:?-{3,}/.test((lines[i + 1] || '').trim())) {
      const header = line.replace(/^\||\|$/g, '').split('|').map((cell) => `<th>${inline(cell.trim())}</th>`).join('')
      i += 2
      const rows = []
      while ((lines[i] || '').trim().startsWith('|')) { rows.push(`<tr>${lines[i].trim().replace(/^\||\|$/g, '').split('|').map((cell) => `<td>${inline(cell.trim())}</td>`).join('')}</tr>`); i += 1 }
      blocks.push(`<div class="final-table-wrap"><table><thead><tr>${header}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`); continue
    }
    const unordered = line.match(/^[-*]\s+(.+)$/)
    const ordered = line.match(/^\d+\.\s+(.+)$/)
    if (unordered || ordered) {
      const isOrdered = Boolean(ordered), items = []
      while (i < lines.length) {
        const item = lines[i].trim().match(isOrdered ? /^\d+\.\s+(.+)$/ : /^[-*]\s+(.+)$/)
        if (!item) break
        items.push(`<li>${inline(item[1])}</li>`); i += 1
      }
      blocks.push(`<${isOrdered ? 'ol' : 'ul'}>${items.join('')}</${isOrdered ? 'ol' : 'ul'}>`); continue
    }
    const paragraph = []
    while (i < lines.length && lines[i].trim() && lines[i].trim() !== '---' && !/^(#{1,3})\s+|^> |^[-*]\s+|^\d+\.\s+|^\|/.test(lines[i].trim())) { paragraph.push(lines[i].trim()); i += 1 }
    blocks.push(`<p>${inline(paragraph.join(' '))}</p>`)
  }
  return blocks.join('\n')
}

for (const [id, slug, title, description] of articles) {
  const markdown = await readFile(path.join(root, `articles/data/${id}.txt`), 'utf8')
  const url = `${origin}/articles/${slug}/`
  const schema = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Article', headline: title, description, mainEntityOfPage: url, url, inLanguage: 'zh-CN', dateModified: updated, author: { '@type': 'Organization', name: '土耳其植发指南', url: origin }, publisher: { '@type': 'Organization', name: '土耳其植发指南', url: origin } })
  const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="description" content="${escapeHtml(description)}" /><meta name="robots" content="index,follow" /><link rel="canonical" href="${url}" />
<meta property="og:type" content="article" /><meta property="og:title" content="${escapeHtml(title)}" /><meta property="og:description" content="${escapeHtml(description)}" /><meta property="og:url" content="${url}" />
<title>${escapeHtml(title)}｜土耳其植发指南</title><link rel="stylesheet" href="/assets/styles.css?v=20261122j" />
<style>.static-article blockquote{margin:28px 0;padding:18px 22px;border-left:3px solid #1e5347;background:#f4f8f3;color:#28443b;font-size:18px;line-height:1.8}.static-article h1{margin-bottom:28px}.static-article h2{margin-top:44px}.static-article h3{margin-top:30px}</style><script type="application/ld+json">${schema}</script></head>
<body data-page="article"><div class="src-site"><header class="src-header"><div class="src-shell"><a href="/" class="src-brand"><span></span><b>土耳其植发指南<small>TURKEY HAIR TRANSPLANT GUIDE</small></b></a><nav><a href="/">攻略信息</a><a href="/clinics/">诊所查询</a><a href="/doctors/">ISHRS 医生</a></nav></div></header>
<main class="src-shell src-main"><article class="src-article static-article">${markdownHtml(markdown)}</article></main><footer class="src-footer"><div class="src-shell">资料更正、信息补充与版权联系：<a href="mailto:contact@trhairguide.com">contact@trhairguide.com</a></div></footer></div><script src="/assets/app.js?v=20261122l" defer></script></body></html>`
  const directory = path.join(root, 'articles', slug)
  await mkdir(directory, { recursive: true })
  await writeFile(path.join(directory, 'index.html'), html)
}

console.log(`Built ${articles.length} static article pages.`)
