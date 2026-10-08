import { useState } from 'react'
import { Download, BookOpen } from 'lucide-react'
import { BOOK_CATEGORIES, r2Url, formatSize, categoryLabel } from '../lib/books'

// Kategori sekmeleri + kapak grid'i. showMeta: kartta branş adı gibi ek etiket
export default function BookGrid({ books, accent = '#0891b2', metaFor }) {
  const counts = Object.fromEntries(BOOK_CATEGORIES.map(c => [c.id, books.filter(b => b.category === c.id).length]))
  const [cat, setCat] = useState('all')
  const visible = cat === 'all' ? books : books.filter(b => b.category === cat)

  if (books.length === 0) {
    return (
      <div className="rounded-lg p-10 text-center" style={{ background: '#0b1626', border: '1px solid #18263a' }}>
        <BookOpen size={28} className="mx-auto mb-3" style={{ color: '#2e3b4d' }} />
        <p className="text-sm" style={{ color: '#6b7a8f' }}>Burada henüz kitap yok.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 flex-wrap mb-5">
        <Chip active={cat === 'all'} onClick={() => setCat('all')} accent={accent}>Tümü · {books.length}</Chip>
        {BOOK_CATEGORIES.filter(c => counts[c.id] > 0).map(c => (
          <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)} accent={accent}>
            {c.label} · {counts[c.id]}
          </Chip>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
        {visible.map(b => (
          <BookCard key={b.id} book={b} accent={accent} meta={metaFor?.(b)} showCategory={cat === 'all'} />
        ))}
      </div>
    </div>
  )
}

function Chip({ active, onClick, accent, children }) {
  return (
    <button
      onClick={onClick}
      className="h-8 px-3 rounded-full text-[13px] transition-colors"
      style={active
        ? { background: `${accent}2e`, color: '#fff', border: `1px solid ${accent}80` }
        : { background: 'transparent', color: '#7d8ca0', border: '1px solid #223044' }}
    >
      {children}
    </button>
  )
}

export function BookCard({ book, accent, meta, showCategory = true }) {
  const [imgOk, setImgOk] = useState(!!book.cover_key)
  const url = r2Url(book.file_key)
  return (
    <div className="flex flex-col min-w-0">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        download
        title={`${book.title} — indir`}
        className="group relative block rounded-md overflow-hidden"
        style={{ aspectRatio: '3 / 4', background: '#0f1b2c', border: '1px solid #1c2a3e' }}
      >
        {imgOk ? (
          <img
            src={r2Url(book.cover_key)}
            alt=""
            loading="lazy"
            onError={() => setImgOk(false)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center" style={{ background: `linear-gradient(160deg, ${accent}33, #0f1b2c)` }}>
            <BookOpen size={26} style={{ color: accent }} />
            <span className="mt-2 text-[13px] leading-snug line-clamp-4" style={{ color: '#c8d0dc' }}>{book.title}</span>
          </div>
        )}
        <div className="absolute inset-0 flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(to top, rgba(4,10,20,0.85), transparent 55%)' }}>
          <span className="flex items-center gap-1.5 text-[13px] font-medium text-white"><Download size={14} /> İndir</span>
        </div>
      </a>
      <p className="mt-2 text-[14px] leading-snug line-clamp-2" style={{ color: '#e1e5ec' }} title={book.title}>{book.title}</p>
      <p className="mt-0.5 text-[12px] truncate" style={{ color: '#6b7a8f' }}>
        {[meta, showCategory ? categoryLabel(book.category) : null, formatSize(book.size_bytes)].filter(Boolean).join(' · ')}
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        download
        className="mt-2 flex items-center justify-center gap-1.5 h-9 rounded-md text-[13px] font-medium transition-colors"
        style={{ color: '#fff', background: `${accent}33`, border: `1px solid ${accent}66` }}
      >
        <Download size={14} /> İndir
      </a>
    </div>
  )
}
