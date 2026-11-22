document.addEventListener('DOMContentLoaded', () => {
  const menuButton = document.querySelector('.bb-menu')
  const mobileNav = document.querySelector('.bb-mobile-nav')
  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('is-open')
      menuButton.setAttribute('aria-expanded', String(isOpen))
    })
  }

  const search = document.getElementById('site-search')
  const articles = [...document.querySelectorAll('.bb-article[data-search]')]
  const empty = document.getElementById('search-empty')
  if (search && articles.length) {
    search.addEventListener('input', () => {
      const query = search.value.trim().toLowerCase()
      let matches = 0
      articles.forEach((article) => {
        const content = `${article.dataset.search || ''} ${article.textContent}`.toLowerCase()
        const visible = !query || content.includes(query)
        article.hidden = !visible
        if (visible) matches += 1
      })
      if (empty) empty.hidden = matches > 0
    })
  }
})
