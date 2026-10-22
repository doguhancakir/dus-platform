import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, ChevronDown, ChevronRight, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { supabase, fetchAllRows } from '../lib/supabase'
import { BRANCHES, TEMEL_BILIMLER } from '../lib/data'

// Admin → GEÇMİŞ: change_log tablosundaki ekleme/değişiklik/silme kayıtları.
// Art arda gelen aynı türden kayıtlar (ör. tek seferde yüklenen 500 soru) tek satırda gruplanır.

const ALL_BRANCHES = [...BRANCHES, ...TEMEL_BILIMLER]
const PAGE = 1000
const TABLE_LABEL = { questions: 'soru', topics: 'konu', books: 'kitap' }
const ACTION = {
  INSERT: { label: 'eklendi', color: '#10b981' },
  UPDATE: { label: 'değiştirildi', color: '#f0c040' },
  DELETE: { label: 'silindi', color: '#ef4444' },
}
const FIELD_LABEL = {
  question_text: 'soru metni', options: 'şıklar', correct_answer: 'doğru cevap', explanation: 'açıklama',
  source: 'kaynak', topic_id: 'konu', title: 'başlık', sort_order: 'sıra', branch_id: 'branş', content: 'içerik',
}

function rowOf(e) { return e.new_data || e.old_data || {} }

function groupKey(e) {
  const r = rowOf(e)
  const changed = e.action === 'UPDATE' ? Object.keys(e.new_data || {}).sort().join(',') : ''
  return [e.table_name, e.action, e.actor, r.topic_id ?? '', r.source ?? '', changed].join('|')
}

function fmtDate(iso) {
  return new Date(iso).toLocaleString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ChangeLogTab() {
  const [entries, setEntries] = useState([])
  const [topics, setTopics] = useState({})
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [tableFilter, setTableFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [open, setOpen] = useState(null)

  useEffect(() => {
    fetchAllRows(q => q.from('topics').select('id, title, branch_id'))
      .then(rows => setTopics(Object.fromEntries(rows.map(t => [t.id, t]))))
      .catch(() => {})
  }, [])

  useEffect(() => { load(true) }, [tableFilter, actionFilter])

  async function load(reset) {
    setLoading(true)
    const offset = reset ? 0 : entries.length
    let q = supabase.from('change_log').select('*').order('id', { ascending: false })
    if (tableFilter !== 'all') q = q.eq('table_name', tableFilter)
    if (actionFilter !== 'all') q = q.eq('action', actionFilter)
    const { data, error } = await q.range(offset, offset + PAGE - 1)
    setLoading(false)
    if (error) { setMissing(true); return }
    setMissing(false)
    setEntries(prev => (reset ? data : [...prev, ...data]))
    setHasMore(data.length === PAGE)
    if (reset) setOpen(null)
  }

  const groups = useMemo(() => {
    const out = []
    for (const e of entries) {
      const last = out[out.length - 1]
      const k = groupKey(e)
      if (last && last.key === k) last.items.push(e)
      else out.push({ key: k, items: [e] })
    }
    return out
  }, [entries])

  function topicLabel(id) {
    const t = topics[id]
    if (!t) return id != null ? `konu #${id} (silinmiş)` : ''
    const b = ALL_BRANCHES.find(b => b.id === t.branch_id)
    return `${b ? b.name + ' › ' : ''}${t.title}`
  }

  function describeUpdate(e) {
    const n = e.new_data || {}
    const o = e.old_data || {}
    return Object.keys(n).map(k => {
      if (k === 'source') return `kaynak: ${o.source || '—'} → ${n.source || '—'}`
      if (k === 'topic_id') return `konu: ${topicLabel(o.topic_id)} → ${topicLabel(n.topic_id)}`
      if (k === 'title') return `başlık: ${o.title} → ${n.title}`
      return FIELD_LABEL[k] || k
    }).join(' · ')
  }

  async function restore(group) {
    const rows = group.items.map(e => e.old_data).filter(Boolean)
    if (!window.confirm(`${rows.length} silinmiş ${TABLE_LABEL[group.items[0].table_name] || 'kayıt'} geri getirilsin mi?`)) return
    const { error } = await supabase.from(group.items[0].table_name).insert(rows)
    if (error) {
      console.error(error)
      toast.error(/duplicate|23505/i.test(`${error.code} ${error.message}`)
        ? 'Bu kayıtlar zaten geri getirilmiş görünüyor'
        : /foreign|23503/i.test(`${error.code} ${error.message}`)
          ? 'Bağlı olduğu konu artık yok — önce konuyu geri getir'
          : 'Geri getirilemedi')
      return
    }
    toast.success(`${rows.length} kayıt geri getirildi`)
    load(true)
  }

  const chip = (active) => ({
    color: active ? '#0891b2' : '#6b7a8f',
    border: `1px solid ${active ? '#0891b2' : '#1e3050'}`,
    background: active ? 'rgba(8,145,178,0.1)' : 'transparent',
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {[['all', 'Hepsi'], ['questions', 'Sorular'], ['topics', 'Konular'], ['books', 'Kitaplar']].map(([id, label]) => (
          <button key={id} onClick={() => setTableFilter(id)} className="px-3 py-1 text-[12px]" style={chip(tableFilter === id)}>{label}</button>
        ))}
        <span className="w-3" />
        {[['all', 'Tüm işlemler'], ['INSERT', 'Eklenen'], ['UPDATE', 'Değişen'], ['DELETE', 'Silinen']].map(([id, label]) => (
          <button key={id} onClick={() => setActionFilter(id)} className="px-3 py-1 text-[12px]" style={chip(actionFilter === id)}>{label}</button>
        ))}
      </div>

      {missing ? (
        <div className="p-4 text-sm" style={{ background: 'rgba(240,192,64,0.06)', border: '1px solid rgba(240,192,64,0.3)', color: '#f0c040' }}>
          Geçmiş tablosu henüz yok (supabase_migration_change_log.sql çalıştırılmalı).
        </div>
      ) : !loading && groups.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: '#6b7a8f' }}>Henüz kayıt yok. Bundan sonra eklenen, değişen ve silinen her şey burada görünecek.</p>
      ) : (
        <div className="space-y-1.5">
          {groups.map((g, gi) => {
            const first = g.items[0]
            const last = g.items[g.items.length - 1]
            const r = rowOf(first)
            const act = ACTION[first.action] || { label: first.action, color: '#888' }
            const isOpen = open === gi
            const canRestore = first.action === 'DELETE' && first.table_name !== 'books'
            return (
              <div key={first.id} style={{ background: '#0b1626', border: '1px solid #18263a', borderLeft: `3px solid ${act.color}` }}>
                <button onClick={() => setOpen(isOpen ? null : gi)} className="w-full text-left px-3 py-2 flex items-start gap-2">
                  {isOpen ? <ChevronDown size={14} className="mt-0.5 flex-shrink-0" color="#6b7a8f" /> : <ChevronRight size={14} className="mt-0.5 flex-shrink-0" color="#6b7a8f" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-white">
                      <span className="font-semibold">{g.items.length} {TABLE_LABEL[first.table_name] || first.table_name}</span>{' '}
                      <span style={{ color: act.color }}>{act.label}</span>
                      {first.table_name === 'questions' && first.action !== 'UPDATE' && r.source && <span style={{ color: '#9aa8bc' }}> · {r.source}</span>}
                      {first.table_name === 'topics' && first.action !== 'UPDATE' && <span style={{ color: '#9aa8bc' }}> · {r.title}</span>}
                      {first.table_name === 'books' && first.action !== 'UPDATE' && <span style={{ color: '#9aa8bc' }}> · {r.title}</span>}
                    </p>
                    <p className="text-[12px] mt-0.5" style={{ color: '#6b7a8f' }}>
                      {first.action === 'UPDATE' ? describeUpdate(first) : first.table_name === 'questions' ? topicLabel(r.topic_id) : ''}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: '#4a5a70' }}>
                      {g.items.length > 1 && fmtDate(last.at) !== fmtDate(first.at) ? `${fmtDate(last.at)} – ${fmtDate(first.at)}` : fmtDate(first.at)}
                      {' · '}{first.actor === 'claude' ? 'Claude' : 'admin paneli'}
                    </p>
                  </div>
                  {canRestore && (
                    <span
                      role="button"
                      onClick={e => { e.stopPropagation(); restore(g) }}
                      className="flex items-center gap-1 px-2 py-1 text-[11px] flex-shrink-0"
                      style={{ color: '#10b981', border: '1px solid rgba(16,185,129,0.4)' }}
                    >
                      <RotateCcw size={11} /> Geri getir
                    </span>
                  )}
                </button>
                {isOpen && (
                  <div className="px-3 pb-3 pl-8 space-y-1 max-h-80 overflow-y-auto">
                    {g.items.map(e => {
                      const d = rowOf(e)
                      const text = d.question_text || d.title || ''
                      return (
                        <p key={e.id} className="text-[12px] leading-snug" style={{ color: '#9aa8bc' }}>
                          <span style={{ color: '#4a5a70' }}>#{e.row_id}</span>{' '}
                          {e.action === 'UPDATE' ? describeUpdate(e) : text.slice(0, 140)}
                        </p>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {loading && <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin" color="#0891b2" /></div>}
      {!loading && hasMore && (
        <button onClick={() => load(false)} className="w-full py-2 text-[12px]" style={{ color: '#0891b2', border: '1px solid #1e3050' }}>
          Daha eskileri yükle
        </button>
      )}
    </motion.div>
  )
}
