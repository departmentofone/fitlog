(() => {
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !e.closest('[aria-hidden="true"]') }
  const name = (e) => (e.getAttribute('aria-label') || (e.getAttribute('aria-labelledby') && document.getElementById(e.getAttribute('aria-labelledby'))?.innerText) || e.innerText || e.getAttribute('title') || e.value || (e.querySelector('img[alt]')?.alt) || '').trim()
  const desc = (e) => { const c = (e.className && typeof e.className === 'string' ? e.className : '').split(' ').slice(0, 4).join('.'); return e.tagName.toLowerCase() + (c ? '.' + c : '') + ' ' + (e.outerHTML.slice(0, 140).replace(/\s+/g, ' ')) }
  const out = { unnamed: [], unlabeled: [], small: [], headings: [], imgs: [] }
  for (const e of document.querySelectorAll('button, a[href], [role=button], [role=tab], [role=switch], [role=checkbox], summary')) {
    if (!vis(e)) continue
    if (!name(e)) out.unnamed.push(desc(e))
    const r = e.getBoundingClientRect()
    if ((r.width < 44 || r.height < 44) && !e.closest('nav[aria-label="Main"]')) {
      // count hit area including padding of a wrapping label? keep simple
      out.small.push(`${Math.round(r.width)}x${Math.round(r.height)} "${name(e).slice(0, 30)}" ${e.tagName.toLowerCase()}`)
    }
  }
  for (const e of document.querySelectorAll('input, select, textarea')) {
    if (!vis(e) || e.type === 'hidden') continue
    const labelled = e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || (e.id && document.querySelector(`label[for="${e.id}"]`)) || e.closest('label')
    if (!labelled) out.unlabeled.push(`${e.tagName.toLowerCase()} type=${e.type} placeholder="${e.placeholder || ''}"`)
  }
  for (const h of document.querySelectorAll('h1,h2,h3,h4,h5,h6')) if (vis(h)) out.headings.push(h.tagName + ' ' + h.innerText.trim().slice(0, 40))
  for (const i of document.querySelectorAll('img, svg[role=img]')) if (vis(i) && i.tagName === 'IMG' && !i.hasAttribute('alt')) out.imgs.push(i.src.slice(-60))
  out.small = [...new Set(out.small)].slice(0, 40)
  return out
})()
