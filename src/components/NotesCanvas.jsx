/**
 * NotesCanvas — Canva benzeri serbest not tuali
 * - Çift tıkla → metin ekle
 * - Ctrl+V veya "Görsel" butonu → resim ekle
 * - Seç → sürükle (taşı), köşe handle'lardan boyutlandır
 * - Metin seçili → toolbar: boyut / kalın / italik / altı çizili / renk
 * - Otomatik kayıt (Supabase), sonsuz scroll
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bold, Italic, Underline, Trash2, Type, Image as ImageIcon, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'

const CANVAS_MIN   = 3000
const CANVAS_GROW  = 2000
const SAVE_DELAY   = 1500

const COLORS = ['#e2e8f0','#0891b2','#f0c040','#10b981','#ef4444','#a78bfa','#fb923c','#f472b6','#ffffff','#64748b']

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6) }

/* ── Image compression ─────────────────────────────────────────────── */
function compressImage(file) {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new Image()
      img.onload = () => {
        const MAX = 1200
        let w = img.naturalWidth, h = img.naturalHeight
        if (w > MAX) { h = Math.round(h * MAX / w); w = MAX }
        if (h > 1800) { w = Math.round(w * 1800 / h); h = 1800 }
        const cv = document.createElement('canvas')
        cv.width = w; cv.height = h
        cv.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve({ src: cv.toDataURL('image/jpeg', 0.82), w, h })
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

/* ── Resize handle positions ────────────────────────────────────────── */
const HANDLES = {
  nw: { top: -5, left: -5,   cursor: 'nw-resize' },
  ne: { top: -5, right: -5,  cursor: 'ne-resize' },
  sw: { bottom: -5, left: -5,  cursor: 'sw-resize' },
  se: { bottom: -5, right: -5, cursor: 'se-resize' },
}
function Handle({ pos, onMouseDown }) {
  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute', ...HANDLES[pos],
        width: 10, height: 10,
        background: '#0891b2', border: '2px solid #06101e',
        zIndex: 9999, cursor: HANDLES[pos].cursor,
      }}
    />
  )
}

/* ── Text element ────────────────────────────────────────────────────── */
function DuplicateBtn({ onDuplicate }) {
  return (
    <div
      onMouseDown={e => { e.stopPropagation(); e.preventDefault() }}
      onClick={e => { e.stopPropagation(); onDuplicate() }}
      title="Kopyala (Ctrl+C → Ctrl+V)"
      style={{
        position: 'absolute', top: -13, right: -13,
        width: 22, height: 22,
        background: '#0891b2',
        border: '2px solid #06101e',
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 9999,
        fontSize: 14, fontWeight: 700, color: '#fff',
        lineHeight: 1,
        userSelect: 'none',
        boxShadow: '0 2px 8px rgba(8,145,178,0.5)',
        transition: 'transform 0.12s, background 0.12s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.15)'; e.currentTarget.style.background = '#0bb8d8' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#0891b2' }}
    >
      +
    </div>
  )
}

function TextEl({ el, selected, editing, onMouseDown, onDoubleClick, onContentChange, onResizeMouseDown, onBlur, onDuplicate }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!editing || !ref.current) return
    ref.current.focus()
    // set initial content
    if (ref.current.innerText !== (el.content ?? '')) {
      ref.current.innerText = el.content ?? ''
    }
    // cursor at end
    try {
      const range = document.createRange()
      range.selectNodeContents(ref.current)
      range.collapse(false)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    } catch {}
  }, [editing])

  return (
    <div
      style={{
        position: 'absolute', left: el.x, top: el.y,
        width: el.width, minHeight: 28,
        zIndex: el.zIndex,
        outline: selected ? '1px solid rgba(8,145,178,0.8)' : '1px solid transparent',
        cursor: editing ? 'text' : 'move',
        userSelect: editing ? 'text' : 'none',
        boxSizing: 'border-box',
      }}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
    >
      {/* Non-edit display */}
      {!editing && (
        <div style={{
          fontFamily: 'Barlow, sans-serif',
          fontSize: el.fontSize ?? 16,
          fontWeight: el.fontWeight ?? 'normal',
          fontStyle: el.fontStyle ?? 'normal',
          textDecoration: el.textDecoration ?? 'none',
          color: el.color ?? '#e2e8f0',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
          padding: '4px 6px',
          lineHeight: 1.5,
          minHeight: 28,
        }}>
          {el.content || <span style={{ opacity: 0.18, fontStyle: 'italic', fontSize: 13 }}>Yazmak için çift tıkla…</span>}
        </div>
      )}

      {/* Edit mode */}
      {editing && (
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={e => onContentChange(e.currentTarget.innerText)}
          onBlur={onBlur}
          style={{
            fontFamily: 'Barlow, sans-serif',
            fontSize: el.fontSize ?? 16,
            fontWeight: el.fontWeight ?? 'normal',
            fontStyle: el.fontStyle ?? 'normal',
            textDecoration: el.textDecoration ?? 'none',
            color: el.color ?? '#e2e8f0',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            padding: '4px 6px',
            lineHeight: 1.5,
            minHeight: 28,
            outline: 'none',
          }}
        />
      )}

      {/* Duplicate btn + right-edge resize */}
      {selected && !editing && (
        <>
          {onDuplicate && <DuplicateBtn onDuplicate={onDuplicate} />}
          <div
            onMouseDown={e => onResizeMouseDown(e, 'e')}
            style={{
              position: 'absolute', top: 0, right: -5, bottom: 0,
              width: 10,
              cursor: 'e-resize',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div style={{ width: 4, height: 24, background: '#0891b2', borderRadius: 2 }} />
          </div>
        </>
      )}
    </div>
  )
}

/* ── Image element ───────────────────────────────────────────────────── */
function ImageEl({ el, selected, onMouseDown, onResizeMouseDown, onDuplicate }) {
  return (
    <div
      style={{
        position: 'absolute', left: el.x, top: el.y,
        width: el.width, height: el.height,
        zIndex: el.zIndex,
        outline: selected ? '1px solid rgba(8,145,178,0.8)' : '1px solid transparent',
        cursor: 'move',
        userSelect: 'none',
        overflow: 'visible',
      }}
      onMouseDown={onMouseDown}
    >
      <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
        <img
          src={el.src}
          alt=""
          draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block', pointerEvents: 'none', userSelect: 'none' }}
        />
      </div>
      {selected && (
        <>
          {onDuplicate && <DuplicateBtn onDuplicate={onDuplicate} />}
          {Object.keys(HANDLES).map(h => (
            <Handle key={h} pos={h} onMouseDown={e => onResizeMouseDown(e, h)} />
          ))}
        </>
      )}
    </div>
  )
}

/* ── Element toolbar ─────────────────────────────────────────────────── */
function ElementToolbar({ el, onChange, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18 }}
      style={{
        flexShrink: 0, background: '#040c18',
        borderBottom: '1px solid #0d1e30',
        padding: '6px 14px',
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      }}
    >
      {el.type === 'text' && (
        <>
          {/* Font size */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <TBtn onClick={() => onChange({ fontSize: Math.max(8, (el.fontSize ?? 16) - 2) })}>−</TBtn>
            <span style={{ color: '#2a4060', fontFamily: 'Barlow', fontWeight: 700, fontSize: 11, minWidth: 26, textAlign: 'center' }}>
              {el.fontSize ?? 16}
            </span>
            <TBtn onClick={() => onChange({ fontSize: Math.min(120, (el.fontSize ?? 16) + 2) })}>+</TBtn>
          </div>

          <Sep />

          {/* B I U */}
          <TBtn active={el.fontWeight === 'bold'}       onClick={() => onChange({ fontWeight: el.fontWeight === 'bold' ? 'normal' : 'bold' })}><Bold size={11} /></TBtn>
          <TBtn active={el.fontStyle === 'italic'}      onClick={() => onChange({ fontStyle: el.fontStyle === 'italic' ? 'normal' : 'italic' })}><Italic size={11} /></TBtn>
          <TBtn active={el.textDecoration === 'underline'} onClick={() => onChange({ textDecoration: el.textDecoration === 'underline' ? 'none' : 'underline' })}><Underline size={11} /></TBtn>

          <Sep />

          {/* Color presets */}
          {COLORS.map(c => (
            <button key={c} onClick={() => onChange({ color: c })} style={{
              width: 16, height: 16, background: c, border: el.color === c ? '2px solid #0891b2' : '1px solid #1a2d45',
              cursor: 'pointer', flexShrink: 0, borderRadius: 2,
            }} />
          ))}
          <input type="color" value={el.color ?? '#e2e8f0'} onChange={e => onChange({ color: e.target.value })}
            title="Özel renk"
            style={{ width: 20, height: 20, padding: 0, border: '1px solid #1a2d45', background: 'transparent', cursor: 'pointer', borderRadius: 2 }} />
        </>
      )}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
        <TBtn onClick={() => onChange({ zIndex: (el.zIndex ?? 1) + 1 })} title="Öne getir" style={{ fontSize: 10, padding: '0 6px', letterSpacing: '0.06em' }}>↑ ÖNE</TBtn>
        <TBtn onClick={() => onChange({ zIndex: Math.max(0, (el.zIndex ?? 1) - 1) })} title="Arkaya gönder" style={{ fontSize: 10, padding: '0 6px', letterSpacing: '0.06em' }}>↓ ARKA</TBtn>
        <button onClick={onDelete} style={{
          display: 'flex', alignItems: 'center', gap: 4,
          color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          padding: '3px 8px', cursor: 'pointer', fontFamily: 'Barlow', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em',
        }}>
          <Trash2 size={10} /> SİL
        </button>
      </div>
    </motion.div>
  )
}

function TBtn({ active, onClick, children, title, style: extStyle }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: active ? 'rgba(8,145,178,0.18)' : 'transparent',
      border: active ? '1px solid rgba(8,145,178,0.5)' : '1px solid #1a2d45',
      color: active ? '#0891b2' : '#2a4060',
      cursor: 'pointer', fontFamily: 'Barlow', fontWeight: 700, fontSize: 13,
      flexShrink: 0,
      ...extStyle,
    }}>
      {children}
    </button>
  )
}
function Sep() {
  return <div style={{ width: 1, height: 18, background: '#0d1e30', flexShrink: 0 }} />
}

/* ── Main Canvas ─────────────────────────────────────────────────────── */
export default function NotesCanvas({ branchId, branchName, userId, onBack }) {
  const [elements, setElements]         = useState([])
  const [selectedIds, setSelectedIds]   = useState(new Set())
  const [editingId, setEditingId]       = useState(null)
  const [canvasHeight, setCanvasHeight] = useState(CANVAS_MIN)
  const [saving, setSaving]             = useState(false)
  const [savedAt, setSavedAt]           = useState(null)
  const [loading, setLoading]           = useState(true)
  const [selBox, setSelBox]             = useState(null) // rubber-band seçim kutusu

  const canvasRef          = useRef(null)
  const scrollRef          = useRef(null)
  const dragRef            = useRef(null)
  const elementsRef        = useRef([])
  const selectedIdsRef     = useRef(new Set())
  const heightRef          = useRef(CANVAS_MIN)
  const saveTimerRef       = useRef(null)
  const fileInputRef       = useRef(null)
  const copiedElsRef       = useRef([])
  const selDragRef         = useRef(null)  // rubber-band başlangıç bilgisi
  const selBoxRef          = useRef(null)  // selBox'ın ref kopyası (callback'lerde kullanım)
  const historyRef         = useRef([[]])  // undo stack: element snapshot'ları
  const historyIdxRef      = useRef(0)    // şu anki konum
  const textHistTimerRef   = useRef(null) // metin yazımı için debounced history push

  // Keep refs in sync
  useEffect(() => { elementsRef.current = elements }, [elements])
  useEffect(() => { selectedIdsRef.current = selectedIds }, [selectedIds])
  useEffect(() => { heightRef.current = canvasHeight }, [canvasHeight])

  // ── Load ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId || !branchId) return
    setLoading(true)
    supabase
      .from('note_canvases')
      .select('elements, canvas_height')
      .eq('user_id', userId)
      .eq('branch_id', branchId)
      .maybeSingle()
      .then(({ data }) => {
        const loaded = data?.elements?.length ? data.elements : []
        setElements(loaded)
        historyRef.current = [loaded.map(el => ({ ...el }))]
        historyIdxRef.current = 0
        if (data?.canvas_height) {
          const h = Math.max(data.canvas_height, CANVAS_MIN)
          setCanvasHeight(h)
          heightRef.current = h
        }
        setLoading(false)
      })
  }, [branchId, userId])

  // ── History (undo) ────────────────────────────────────────────────
  function pushHistory(els) {
    // Gelecekteki geçmişi sil (yeni aksiyon)
    historyRef.current = historyRef.current.slice(0, historyIdxRef.current + 1)
    historyRef.current.push(els.map(el => ({ ...el })))
    if (historyRef.current.length > 60) historyRef.current.shift()
    else historyIdxRef.current = historyRef.current.length - 1
  }

  function undo() {
    if (historyIdxRef.current <= 0) return
    historyIdxRef.current -= 1
    const prev = historyRef.current[historyIdxRef.current]
    setElements(prev)
    scheduleSave(prev, heightRef.current)
    setSelectedIds(new Set())
    setEditingId(null)
  }

  // ── Rubber-band helper ────────────────────────────────────────────
  function overlaps(el, box) {
    const elW = el.width ?? 300
    const elH = typeof el.height === 'number' ? el.height : 40
    return (
      el.x < box.x + box.w && el.x + elW > box.x &&
      el.y < box.y + box.h && el.y + elH > box.y
    )
  }

  // ── Save ──────────────────────────────────────────────────────────
  function scheduleSave(els, h) {
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => doSave(els, h), SAVE_DELAY)
  }

  async function doSave(els, h) {
    if (!userId) return
    setSaving(true)
    try {
      await supabase.from('note_canvases').upsert(
        { user_id: userId, branch_id: branchId, elements: els, canvas_height: h, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,branch_id' }
      )
      setSavedAt(new Date())
    } catch (e) { console.error('NotesCanvas save error:', e) }
    setSaving(false)
  }

  function setAndSave(newEls) {
    setElements(newEls)
    scheduleSave(newEls, heightRef.current)
  }

  // ── Extend canvas on scroll ───────────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 500) {
        const newH = heightRef.current + CANVAS_GROW
        setCanvasHeight(newH)
        heightRef.current = newH
        scheduleSave(elementsRef.current, newH)
      }
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  // ── Paste (Ctrl+V) ────────────────────────────────────────────────
  useEffect(() => {
    const handler = async (e) => {
      if (editingId) return  // text edit mode → tarayıcı halleder
      const items = [...(e.clipboardData?.items ?? [])]
      const scrollTop = scrollRef.current?.scrollTop ?? 0

      // 1. Görsel var mı?
      const imgItem = items.find(i => i.type.startsWith('image/'))
      if (imgItem) {
        e.preventDefault()
        const file = imgItem.getAsFile()
        const { src, w, h } = await compressImage(file)
        const maxW = Math.min(w, 500)
        const ratio = h / w
        addEl({ type: 'image', src, width: maxW, height: Math.round(maxW * ratio), x: 60, y: scrollTop + 80 })
        return
      }

      // 2. Metin var mı?
      const textItem = items.find(i => i.type === 'text/plain')
      if (textItem) {
        e.preventDefault()
        textItem.getAsString(text => {
          if (!text.trim()) return
          addEl({ type: 'text', content: text.trim(), x: 60, y: scrollTop + 80 })
        })
        return
      }

      // 3. Canvas elementi kopyalanmış mı? (Ctrl+C ile)
      if (copiedElsRef.current.length > 0) {
        e.preventDefault()
        copiedElsRef.current.forEach(src => addEl({ ...src, x: src.x + 24, y: src.y + 24 }))
      }
    }
    window.addEventListener('paste', handler)
    return () => window.removeEventListener('paste', handler)
  }, [editingId])

  // ── Keyboard ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (editingId) return
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      // Ctrl+Z → geri al
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        undo()
        return
      }

      // Ctrl+C → seçili elementleri kopyala
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedIdsRef.current.size > 0) {
        const sel = elementsRef.current.filter(x => selectedIdsRef.current.has(x.id))
        if (sel.length > 0) {
          e.preventDefault()
          copiedElsRef.current = sel.map(el => ({ ...el }))
        }
        return
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIdsRef.current.size > 0) {
        e.preventDefault()
        removeSelected()
      }
      if (e.key === 'Escape') { setSelectedIds(new Set()); setEditingId(null) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [editingId])

  // ── Global mouse move / up (drag & resize) ────────────────────────
  useEffect(() => {
    const onMove = (e) => {
      // Rubber-band selection
      if (selDragRef.current) {
        const s = selDragRef.current
        const adx = Math.abs(e.clientX - s.startClientX)
        const ady = Math.abs(e.clientY - s.startClientY)
        if (!s.active && (adx > 5 || ady > 5)) s.active = true
        if (s.active && canvasRef.current) {
          const rect = canvasRef.current.getBoundingClientRect()
          const ecx = e.clientX - rect.left
          const ecy = e.clientY - rect.top
          const box = {
            x: Math.min(s.cx, ecx), y: Math.min(s.cy, ecy),
            w: Math.abs(ecx - s.cx),  h: Math.abs(ecy - s.cy),
          }
          selBoxRef.current = box
          setSelBox(box)
        }
        return // rubber-band aktifken drag işlemi yapma
      }

      const ds = dragRef.current
      if (!ds) return
      const dx = e.clientX - ds.startX
      const dy = e.clientY - ds.startY

      setElements(prev => prev.map(el => {
        // Çoklu taşıma
        if (ds.type === 'move-multi') {
          const orig = ds.origins[el.id]
          if (!orig) return el
          return { ...el, x: Math.max(0, orig.x + dx), y: Math.max(0, orig.y + dy) }
        }
        if (el.id !== ds.id) return el
        if (ds.type === 'move') {
          return { ...el, x: Math.max(0, ds.ox + dx), y: Math.max(0, ds.oy + dy) }
        }
        // resize
        let x = ds.ox, y = ds.oy, w = ds.ow, h = ds.oh
        if (ds.handle === 'e')  { w = Math.max(60, ds.ow + dx) }
        if (ds.handle === 'se') { w = Math.max(60, ds.ow + dx); h = Math.max(30, ds.oh + dy) }
        if (ds.handle === 'sw') { w = Math.max(60, ds.ow - dx); h = Math.max(30, ds.oh + dy); x = ds.ox + (ds.ow - w) }
        if (ds.handle === 'ne') { w = Math.max(60, ds.ow + dx); h = Math.max(30, ds.oh - dy); y = ds.oy + (ds.oh - h) }
        if (ds.handle === 'nw') { w = Math.max(60, ds.ow - dx); h = Math.max(30, ds.oh - dy); x = ds.ox + (ds.ow - w); y = ds.oy + (ds.oh - h) }
        return { ...el, x, y, width: w, height: h }
      }))
    }

    const onUp = () => {
      if (dragRef.current) {
        dragRef.current = null
        pushHistory(elementsRef.current)
        scheduleSave(elementsRef.current, heightRef.current)
      }
      // Rubber-band: seçim kutusunu tamamla
      if (selDragRef.current) {
        const box = selBoxRef.current
        if (selDragRef.current.active && box && box.w > 4 && box.h > 4) {
          const matched = elementsRef.current.filter(el => overlaps(el, box))
          if (matched.length > 0) setSelectedIds(new Set(matched.map(x => x.id)))
        }
        selDragRef.current = null
        selBoxRef.current = null
        setSelBox(null)
      }
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  // ── Element helpers ───────────────────────────────────────────────
  function addEl(partial) {
    // id her zaman taze üret — partial içinden gelen id'yi düşür
    const { id: _drop, ...rest } = partial
    const el = {
      id: uid(),
      zIndex: elementsRef.current.length + 1,
      ...(rest.type === 'text' ? {
        content: '', color: '#e2e8f0', fontSize: 16,
        fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none',
        width: 300,
      } : {}),
      ...rest,
    }
    const newEls = [...elementsRef.current, el]
    setElements(newEls)
    pushHistory(newEls)
    scheduleSave(newEls, heightRef.current)
    return el
  }

  function removeEl(id) {
    const newEls = elementsRef.current.filter(e => e.id !== id)
    setElements(newEls)
    pushHistory(newEls)
    scheduleSave(newEls, heightRef.current)
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n })
    setEditingId(null)
  }

  function removeSelected() {
    const ids = selectedIdsRef.current
    const newEls = elementsRef.current.filter(e => !ids.has(e.id))
    setElements(newEls)
    pushHistory(newEls)
    scheduleSave(newEls, heightRef.current)
    setSelectedIds(new Set())
    setEditingId(null)
  }

  function updateEl(id, changes) {
    const newEls = elementsRef.current.map(e => e.id === id ? { ...e, ...changes } : e)
    setElements(newEls)
    scheduleSave(newEls, heightRef.current)
  }

  // ── Canvas click handlers ─────────────────────────────────────────
  function onCanvasBgMouseDown(e) {
    if (e.target !== canvasRef.current && !e.target.classList.contains('canvas-bg-dot')) return
    setSelectedIds(new Set())
    setEditingId(null)
    // Rubber-band başlat
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      selDragRef.current = {
        startClientX: e.clientX, startClientY: e.clientY,
        cx: e.clientX - rect.left,
        cy: e.clientY - rect.top,
        active: false,
      }
    }
  }

  function onCanvasBgDblClick(e) {
    if (e.target !== canvasRef.current && !e.target.classList.contains('canvas-bg-dot')) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top  // rect zaten scroll'u içeriyor, scrollTop ekleme
    const el = addEl({ type: 'text', x: Math.max(0, x - 150), y: Math.max(0, y - 14) })
    setSelectedIds(new Set([el.id]))
    setEditingId(el.id)
  }

  function onElMouseDown(e, id) {
    if (editingId === id) return
    e.stopPropagation()
    setEditingId(null)

    if (e.ctrlKey || e.metaKey) {
      // Ctrl basılı: toggle seçim
      setSelectedIds(prev => {
        const next = new Set(prev)
        next.has(id) ? next.delete(id) : next.add(id)
        return next
      })
      return  // drag başlatma
    }

    // Normal tıklama: eğer zaten seçiliyse seçimi koru (drag için), değilse tek seç
    if (!selectedIdsRef.current.has(id)) {
      setSelectedIds(new Set([id]))
    }

    // Drag başlat — seçili tüm elementlerin başlangıç pozisyonlarını kaydet
    const currentSelected = selectedIdsRef.current.has(id)
      ? selectedIdsRef.current
      : new Set([id])

    const origins = {}
    elementsRef.current.forEach(el => {
      if (currentSelected.has(el.id)) origins[el.id] = { x: el.x, y: el.y }
    })

    dragRef.current = {
      type: 'move-multi',
      origins,
      startX: e.clientX,
      startY: e.clientY,
    }
  }

  function onResizeMouseDown(e, id, handle) {
    e.stopPropagation()
    e.preventDefault()
    const el = elementsRef.current.find(x => x.id === id)
    if (!el) return
    dragRef.current = {
      type: 'resize', id, handle,
      startX: e.clientX, startY: e.clientY,
      ox: el.x, oy: el.y,
      ow: el.width ?? 300,
      oh: typeof el.height === 'number' ? el.height : 40,
    }
  }

  // ── File upload ───────────────────────────────────────────────────
  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const { src, w, h } = await compressImage(file)
    const scrollTop = scrollRef.current?.scrollTop ?? 0
    const maxW = Math.min(w, 500)
    const ratio = h / w
    addEl({ type: 'image', src, width: maxW, height: Math.round(maxW * ratio), x: 60, y: scrollTop + 80 })
  }

  // ── Add text button ───────────────────────────────────────────────
  function addTextAtView() {
    const scrollTop = scrollRef.current?.scrollTop ?? 0
    const el = addEl({ type: 'text', x: 60, y: scrollTop + 80 })
    setSelectedIds(new Set([el.id]))
    setEditingId(el.id)
  }

  // Toolbar için: tek seçim varsa o elementi göster, çoklu seçimde sadece sil butonu
  const selectedArr = elements.filter(e => selectedIds.has(e.id))
  const singleSelected = selectedArr.length === 1 ? selectedArr[0] : null

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: '#06101e', fontFamily: 'Barlow, sans-serif' }}
    >
      {/* ── Top bar ── */}
      <div style={{
        background: '#040910', borderBottom: '1px solid #0d1e30',
        flexShrink: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '8px 16px', gap: 12,
      }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onBack}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              color: '#1a3050', background: 'transparent', border: '1px solid #1a2d45',
              padding: '4px 10px', cursor: 'pointer',
              fontFamily: 'Barlow', fontWeight: 700, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase',
            }}
          >
            <ArrowLeft size={11} /> Geri
          </button>
          <div style={{ width: 1, height: 16, background: '#0d1e30' }} />
          <span style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 14, letterSpacing: '0.18em', color: '#0891b2' }}>
            NOTLARIM
          </span>
          <span style={{ fontFamily: 'Barlow', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', color: '#1a3050', textTransform: 'uppercase' }}>
            / {branchName}
          </span>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ActionBtn icon={<Type size={11} />} label="Metin" onClick={addTextAtView} />
          <ActionBtn icon={<ImageIcon size={11} />} label="Görsel" onClick={() => fileInputRef.current?.click()} />
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
          <span style={{ fontSize: 9, letterSpacing: '0.1em', color: saving ? '#0891b2' : '#0d1e30', fontWeight: 700, textTransform: 'uppercase', marginLeft: 8, minWidth: 90, textAlign: 'right' }}>
            {saving ? 'KAYDEDİLİYOR…' : savedAt ? `✓ ${savedAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}` : ''}
          </span>
        </div>
      </div>

      {/* ── Element toolbar (when selected) ── */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          singleSelected
            ? <ElementToolbar
                el={singleSelected}
                onChange={changes => updateEl(singleSelected.id, changes)}
                onDelete={removeSelected}
              />
            : /* Çoklu seçim toolbar */
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                style={{ flexShrink: 0, background: '#040c18', borderBottom: '1px solid #0d1e30', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 10 }}
              >
                <span style={{ fontFamily: 'Barlow', fontWeight: 700, fontSize: 11, color: '#0891b2', letterSpacing: '0.1em' }}>
                  {selectedIds.size} ÖĞE SEÇİLİ
                </span>
                <span style={{ color: '#0d1e30', fontSize: 11 }}>—</span>
                <span style={{ fontFamily: 'Barlow', fontWeight: 600, fontSize: 10, color: '#1a3050', letterSpacing: '0.08em' }}>Sürükle → hepsini taşı &nbsp;·&nbsp; Ctrl+C → kopyala</span>
                <button onClick={removeSelected} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', padding: '3px 8px', cursor: 'pointer', fontFamily: 'Barlow', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em' }}>
                  <Trash2 size={10} /> HEPSİNİ SİL
                </button>
              </motion.div>
        )}
      </AnimatePresence>

      {/* ── Canvas scroll area ── */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
        <div
          ref={canvasRef}
          style={{ position: 'relative', width: '100%', minWidth: 900, minHeight: canvasHeight }}
          onMouseDown={onCanvasBgMouseDown}
          onDoubleClick={onCanvasBgDblClick}
        >
          {/* Dot grid */}
          <div
            className="canvas-bg-dot"
            style={{
              position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
              backgroundImage: 'radial-gradient(circle, #14253a 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />

          {/* Empty state hint */}
          {!loading && elements.length === 0 && (
            <div style={{ position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', pointerEvents: 'none', zIndex: 1 }}>
              <p style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 22, letterSpacing: '0.15em', color: '#0d1e2e' }}>ÇİFT TIKLA → METİN EKLE</p>
              <p style={{ fontFamily: 'Barlow', fontWeight: 600, fontSize: 10, color: '#0a1820', letterSpacing: '0.14em', marginTop: 8, textTransform: 'uppercase' }}>CTRL + V → GÖRSEL YAPIŞTIR</p>
            </div>
          )}

          {/* Rubber-band seçim kutusu */}
          {selBox && (
            <div style={{
              position: 'absolute',
              left: selBox.x, top: selBox.y,
              width: selBox.w, height: selBox.h,
              border: '1px dashed rgba(8,145,178,0.9)',
              background: 'rgba(8,145,178,0.06)',
              pointerEvents: 'none',
              zIndex: 9998,
            }} />
          )}

          {/* Elements */}
          {elements.map(el => el.type === 'text'
            ? <TextEl
                key={el.id} el={el}
                selected={selectedIds.has(el.id)}
                editing={editingId === el.id}
                onMouseDown={e => onElMouseDown(e, el.id)}
                onDoubleClick={e => { e.stopPropagation(); setSelectedIds(new Set([el.id])); setEditingId(el.id) }}
                onContentChange={c => {
                  updateEl(el.id, { content: c })
                  clearTimeout(textHistTimerRef.current)
                  textHistTimerRef.current = setTimeout(() => pushHistory(elementsRef.current), 1000)
                }}
                onResizeMouseDown={(e, h) => onResizeMouseDown(e, el.id, h)}
                onBlur={() => setEditingId(null)}
                onDuplicate={selectedIds.size === 1 ? () => addEl({ ...el, x: el.x + 24, y: el.y + 24 }) : null}
              />
            : <ImageEl
                key={el.id} el={el}
                selected={selectedIds.has(el.id)}
                onMouseDown={e => onElMouseDown(e, el.id)}
                onResizeMouseDown={(e, h) => onResizeMouseDown(e, el.id, h)}
                onDuplicate={selectedIds.size === 1 ? () => addEl({ ...el, x: el.x + 24, y: el.y + 24 }) : null}
              />
          )}
        </div>
      </div>
    </div>
  )
}

function ActionBtn({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(8,145,178,0.08)', border: '1px solid rgba(8,145,178,0.25)',
        color: '#0891b2', padding: '5px 10px', cursor: 'pointer',
        fontFamily: 'Barlow', fontWeight: 700, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(8,145,178,0.18)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(8,145,178,0.08)'}
    >
      {icon} {label}
    </button>
  )
}
