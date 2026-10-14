// Not tuvali metin temizleyici.
// Tuvaldeki yazılar `white-space: pre` ile gösterilir; dışarıdan yapıştırılan HTML'deki
// görünmez satır sonları boş satır olarak görünür, satır içi font-size da elemanın
// yazı boyutunu ezer. Bu modül yapıştırılan/var olan içeriği sade hale getirir:
// sadece metin + satır sonu + kalın/italik/altı çizili + renk kalır.

const BLOCK = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'UL', 'OL', 'BLOCKQUOTE',
  'PRE', 'TR', 'TABLE', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER'])
const HEADINGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6'])
const BULLET_RE = /^\s*(?:[*\-–•·▪◦]|\d+[.)])\s+/

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function colorOf(el) {
  const c = el.getAttribute?.('color') || el.style?.color
  if (!c) return null
  // siyah/çok koyu renkler (sayfadan gelen varsayılan) atılır — koyu zeminde okunmaz
  const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (m && +m[1] + +m[2] + +m[3] < 120) return null
  if (/^(#000(000)?|black)$/i.test(c.trim())) return null
  return c
}

// preserveNewlines: kayıtlı not içeriğini temizlerken metindeki \n'ler korunur;
// yapıştırılan HTML'de ise boşluklar tek boşluğa indirilir (tarayıcı gibi).
function walk(node, ctx, out) {
  if (node.nodeType === 3) {
    let t = node.nodeValue
    if (!ctx.pre) {
      t = t.replace(/[\t\r\n ]+/g, ' ')
    }
    if (!t.trim()) {
      const besideBlock = BLOCK.has(node.previousSibling?.tagName) || BLOCK.has(node.nextSibling?.tagName)
      if (ctx.pre) {
        // kayıtlı not: kullanıcının yazdığı boş satırlar korunur, sadece
        // paragraf/madde etiketlerinin arasındaki görünmez satır sonları atılır
        if (besideBlock) return
        out.push(esc(t))
        return
      }
      // yapıştırılan HTML: bloklar arası boşluk atılır, satır içi boşluk tek boşluk olur
      if (!besideBlock && t && out.length && !/[\n ]$/.test(out[out.length - 1])) out.push(' ')
      return
    }
    out.push(esc(t))
    return
  }
  if (node.nodeType !== 1) return
  const tag = node.tagName
  if (tag === 'STYLE' || tag === 'SCRIPT' || tag === 'META' || tag === 'TITLE') return
  if (tag === 'BR') { out.push('\n'); return }

  const isBlock = BLOCK.has(tag)
  if (isBlock) out.push('\n')

  let open = '', close = ''
  if (tag === 'B' || tag === 'STRONG' || HEADINGS.has(tag) ||
      (node.style && (node.style.fontWeight === 'bold' || +node.style.fontWeight >= 600))) {
    open += '<b>'; close = '</b>' + close
  }
  if (tag === 'I' || tag === 'EM' || node.style?.fontStyle === 'italic') { open += '<i>'; close = '</i>' + close }
  if (tag === 'U' || node.style?.textDecoration?.includes('underline')) { open += '<u>'; close = '</u>' + close }
  const color = colorOf(node)
  if (color) { open += `<span style="color:${esc(color)}">`; close = '</span>' + close }

  if (tag === 'LI') {
    const parent = node.parentElement
    if (parent?.tagName === 'OL') {
      const idx = [...parent.children].filter(c => c.tagName === 'LI').indexOf(node) + 1
      out.push(`${idx}. `)
    } else out.push('• ')
  }

  out.push(open)
  const childCtx = tag === 'PRE' ? { ...ctx, pre: true } : ctx
  node.childNodes.forEach(ch => walk(ch, childCtx, out))
  out.push(close)
  if (isBlock) out.push('\n')
}

function tidy(s) {
  const lines = s.split('\n').map(l => l.replace(/[ \t]+$/g, '').replace(/^ +(?=\S)/, m => (m.length > 1 ? m : '')))
  // baştaki/sondaki boş satırları at, art arda boş satırları teke indir,
  // iki madde arasındaki boş satırları kaldır
  const res = []
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    const plain = l.replace(/<[^>]+>/g, '')
    if (!plain.trim()) {
      const prev = res[res.length - 1]
      if (prev === undefined || prev === '') continue
      let j = i + 1
      while (j < lines.length && !lines[j].replace(/<[^>]+>/g, '').trim()) j++
      const next = lines[j]
      const prevPlain = prev.replace(/<[^>]+>/g, '')
      const nextPlain = (next ?? '').replace(/<[^>]+>/g, '')
      if (next !== undefined && BULLET_RE.test(prevPlain) && BULLET_RE.test(nextPlain)) continue
      res.push('')
      continue
    }
    res.push(l)
  }
  while (res.length && res[res.length - 1] === '') res.pop()
  // boş etiketleri temizle
  return res.join('\n').replace(/<(b|i|u)><\/\1>/g, '').replace(/<span style="[^"]*"><\/span>/g, '')
}

export function htmlToNoteHtml(html, { preserveNewlines = false } = {}) {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
  const out = []
  doc.body.childNodes.forEach(n => walk(n, { pre: preserveNewlines }, out))
  // <li><p>..</p></li> gibi yapılarda madde işareti ayrı satıra düşmesin
  const joined = out.join('').replace(/(^|\n)((?:<[biu]>)*)(•|\d+\.) *((?:<\/?[biu]>|<span[^>]*>|<\/span>)*)\n+/g, '$1$2$3 $4')
  return tidy(joined)
}

export function plainToNoteHtml(text) {
  const norm = text.replace(/\r\n?/g, '\n').replace(/ /g, ' ')
  const lines = norm.split('\n').map(l => {
    const m = l.match(/^(\s*)[*\-•·▪◦]\s+(.*)$/)
    return esc(m ? `${m[1]}• ${m[2]}` : l)
  })
  return tidy(lines.join('\n'))
}

// Pano verisinden temiz içerik üret (HTML varsa onu, yoksa düz metni kullan)
export function clipboardToNoteHtml(clipboardData) {
  const html = clipboardData?.getData('text/html')
  if (html && html.trim()) {
    const r = htmlToNoteHtml(html)
    if (r.replace(/<[^>]+>/g, '').trim()) return r
  }
  return plainToNoteHtml(clipboardData?.getData('text/plain') || '')
}
