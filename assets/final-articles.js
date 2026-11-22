const FINAL_ARTICLES = {
  '01': { title: '土耳其卫生部规定：哪些人员可以进行植发手术？分别做什么？', file: '01-土耳其卫生部植发部门管理条例.md' },
  '03': { title: '咨询时不要被营销名称蒙蔽', file: '03-咨询时不要被营销名称蒙蔽.md' },
  '04': { title: '植发咨询前需要准备什么？', file: '04-植发咨询注意事项.md' },
  '05': { title: '植发后的医嘱：如何保护移植毛囊？', file: '05-植发后的医嘱.md' },
  '06': { title: '植发不是增加发量：为什么供区决定最终效果？', file: '06-植发不是增加发量-为什么供区决定最终效果.md' },
  '07': { title: '不要看案例广告：好诊所和糟糕诊所拿出来的照片都可能无懈可击', file: '07-不要看案例广告.md' }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character])
}

function inlineMarkdown(value, sourceUrl) {
  let output = escapeHtml(value)
  output = output.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => `<img class="final-article-image" src="${escapeHtml(new URL(url, sourceUrl).href)}" alt="${escapeHtml(alt)}" />`)
  output = output.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
  output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  return output
}

function tableHtml(rows, sourceUrl) {
  const cells = (row) => row.trim().replace(/^\||\|$/g, '').split('|').map((cell) => inlineMarkdown(cell.trim(), sourceUrl))
  const header = cells(rows[0])
  const body = rows.slice(2).map((row) => `<tr>${cells(row).map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')
  return `<div class="final-table-wrap"><table><thead><tr>${header.map((cell) => `<th>${cell}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div>`
}

function markdownToHtml(markdown, sourceUrl) {
  const lines = markdown.replace(/\r/g, '').split('\n')
  const blocks = []
  let index = 0
  while (index < lines.length) {
    const line = lines[index].trim()
    if (!line || line === '---') { index += 1; continue }
    if (line.startsWith('|') && lines[index + 1] && /^\|?\s*:?-{3,}/.test(lines[index + 1].trim())) {
      const rows = [lines[index], lines[index + 1]]
      index += 2
      while (lines[index] && lines[index].trim().startsWith('|')) { rows.push(lines[index]); index += 1 }
      blocks.push(tableHtml(rows, sourceUrl)); continue
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      const level = heading[1].length
      blocks.push(`<h${level}>${inlineMarkdown(heading[2], sourceUrl)}</h${level}>`)
      index += 1; continue
    }
    const listMatch = line.match(/^[-*]\s+(.+)$/)
    const orderedMatch = line.match(/^\d+\.\s+(.+)$/)
    if (listMatch || orderedMatch) {
      const ordered = Boolean(orderedMatch)
      const items = []
      while (index < lines.length) {
        const item = lines[index].trim().match(ordered ? /^\d+\.\s+(.+)$/ : /^[-*]\s+(.+)$/)
        if (!item) break
        items.push(`<li>${inlineMarkdown(item[1], sourceUrl)}</li>`)
        index += 1
      }
      blocks.push(`<${ordered ? 'ol' : 'ul'}>${items.join('')}</${ordered ? 'ol' : 'ul'}>`); continue
    }
    if (line.startsWith('![')) { blocks.push(`<p>${inlineMarkdown(line, sourceUrl)}</p>`); index += 1; continue }
    const paragraph = []
    while (index < lines.length && lines[index].trim() && lines[index].trim() !== '---' && !/^(#{1,3})\s+/.test(lines[index].trim()) && !/^[-*]\s+/.test(lines[index].trim()) && !/^\d+\.\s+/.test(lines[index].trim()) && !lines[index].trim().startsWith('|')) {
      paragraph.push(lines[index].trim()); index += 1
    }
    const text = paragraph.join(' ')
    blocks.push(`<p${text.startsWith('声明：') ? ' class="src-checked"' : ''}>${inlineMarkdown(text, sourceUrl)}</p>`)
  }
  return blocks.join('\n')
}

async function renderFinalArticle() {
  const container = document.querySelector('#article-content')
  const id = new URLSearchParams(window.location.search).get('id')
  const article = FINAL_ARTICLES[id]
  if (!article) { container.innerHTML = '<h1>文章未找到</h1><p>请从首页选择已发布文章。</p>'; return }
  const sourceUrl = new URL(`../content/04-定稿/${article.file}`, window.location.href)
  try {
    const response = await fetch(sourceUrl)
    if (!response.ok) throw new Error('not found')
    container.innerHTML = markdownToHtml(await response.text(), sourceUrl)
    document.title = `${article.title}｜土耳其植发指南`
    document.querySelector('meta[name="description"]').setAttribute('content', article.title)
  } catch {
    container.innerHTML = '<h1>文章暂时无法加载</h1><p>请稍后重试。</p>'
  }
}

renderFinalArticle()
