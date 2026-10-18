import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Star } from 'lucide-react'

// Soruya yıldız + kişisel not.
// - Masaüstü: yıldızın üstüne gelince not görünür, tıklayınca düzenleme kutusu açılır.
// - Telefon: dokununca düzenleme kutusu açılır (not orada okunur/düzenlenir).
// note === undefined → yıldızsız; '' → yıldızlı ama notsuz.
export default function StarButton({ note, onSave, onRemove, size = 12, align = 'right' }) {
  const starred = note !== undefined
  const [hover, setHover] = useState(false)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const wrapRef = useRef(null)
  const popRef = useRef(null)
  const [pos, setPos] = useState(null) // { top, left|right } — ekran koordinatı (fixed)
  const canHover = typeof window !== 'undefined' && window.matchMedia?.('(hover: hover)').matches

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (wrapRef.current?.contains(e.target) || popRef.current?.contains(e.target)) return
      setOpen(false)
    }
    const close = () => setOpen(false)
    const follow = () => measure()
    window.addEventListener('resize', close)
    window.addEventListener('scroll', follow, true)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', follow, true)
    }
  }, [open])

  // Soru panelindeki katmanların altında kalmasın diye kutu body'ye (portal) çizilir
  function measure() {
    const r = wrapRef.current?.getBoundingClientRect()
    if (!r) return
    setPos(align === 'right'
      ? { top: r.bottom + 6, right: Math.max(8, window.innerWidth - r.right) }
      : { top: r.bottom + 6, left: Math.max(8, r.left) })
  }

  function openEditor() {
    measure()
    setDraft(note || '')
    setHover(false)
    setOpen(true)
  }

  async function save() {
    setSaving(true)
    const ok = await onSave(draft.trim())
    setSaving(false)
    if (ok !== false) setOpen(false)
  }

  async function remove() {
    setSaving(true)
    const ok = await onRemove()
    setSaving(false)
    if (ok !== false) setOpen(false)
  }

  const popStyle = pos ? { position: 'fixed', top: pos.top, left: pos.left, right: pos.right, zIndex: 1000 } : { display: 'none' }

  return (
    <div ref={wrapRef} className="relative flex-shrink-0">
      <button
        onClick={() => (open ? setOpen(false) : openEditor())}
        onMouseEnter={() => { if (canHover) { measure(); setHover(true) } }}
        onMouseLeave={() => setHover(false)}
        title={canHover ? undefined : (starred ? 'Notu gör / düzenle' : 'Yıldızla ve not ekle')}
        aria-label={starred ? 'Yıldızlı — notu gör' : 'Yıldızla'}
        className="p-1.5 transition-colors"
        style={starred
          ? { background: 'rgba(240,192,64,0.14)', border: '1px solid rgba(240,192,64,0.6)', color: '#f0c040' }
          : { background: '#0a1628', border: '1px solid #1a2d45', color: '#6a7a90' }}
      >
        <Star size={size} fill={starred ? '#f0c040' : 'none'} />
      </button>

      {/* Üstüne gelince not önizleme (sadece fareli cihazlar) */}
      {hover && !open && createPortal(
        <div
          className="w-64 max-w-[80vw] rounded-md px-3 py-2 text-[13px] leading-snug whitespace-pre-line shadow-lg pointer-events-none"
          style={{ ...popStyle, background: '#13233a', border: '1px solid rgba(240,192,64,0.45)', color: starred && note ? '#f4e3b0' : '#7d8ca0' }}
        >
          {starred
            ? (note || 'Yıldızlı — not yok. Not eklemek için tıkla.')
            : 'Yıldızla ve not ekle'}
        </div>,
        document.body,
      )}

      {/* Not düzenleme kutusu */}
      {open && createPortal(
        <div
          ref={popRef}
          className="w-72 max-w-[86vw] rounded-md p-2.5 shadow-xl"
          style={{ ...popStyle, background: '#0f1d31', border: '1px solid rgba(240,192,64,0.5)' }}
        >
          <p className="text-[11px] mb-1.5 flex items-center gap-1.5" style={{ color: '#f0c040' }}>
            <Star size={11} fill="#f0c040" /> {starred ? 'Notun' : 'Yıldızla — kendine not düş'}
          </p>
          <textarea
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              e.stopPropagation()
              if (e.key === 'Escape') setOpen(false)
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) save()
            }}
            placeholder="Bu soruda neyi hatırlamak istiyorsun? (boş da bırakabilirsin)"
            rows={4}
            className="w-full rounded px-2 py-1.5 text-[13px] leading-snug outline-none resize-y"
            style={{ background: '#0a1628', border: '1px solid #223044', color: '#e1e5ec' }}
          />
          <div className="flex items-center gap-1.5 mt-2">
            <button
              onClick={save}
              disabled={saving}
              className="h-8 px-3 rounded text-[12px] font-semibold"
              style={{ background: '#f0c040', color: '#0a1628', opacity: saving ? 0.6 : 1 }}
            >
              {starred ? 'Kaydet' : 'Yıldızla'}
            </button>
            {starred && (
              <button onClick={remove} disabled={saving} className="h-8 px-3 rounded text-[12px]" style={{ color: '#f87171', border: '1px solid rgba(239,68,68,0.35)' }}>
                Yıldızı kaldır
              </button>
            )}
            <button onClick={() => setOpen(false)} className="h-8 px-2 text-[12px] ml-auto" style={{ color: '#7d8ca0' }}>
              İptal
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
