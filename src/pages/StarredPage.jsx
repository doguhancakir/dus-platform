import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Copy, Star, Loader2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../contexts/AuthContext'
import { fetchAllRows } from '../lib/supabase'
import { BRANCHES, TEMEL_BILIMLER } from '../lib/data'
import { questionToText } from '../lib/questionText'
import { loadNotes, saveNote, removeNote, notesErrorMessage } from '../lib/questionNotes'
import Layout from '../components/Layout'
import BulkCopyBar from '../components/BulkCopyBar'

const ALL_BRANCHES = [...BRANCHES, ...TEMEL_BILIMLER]
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

async function fetchInChunks(ids, build, size = 150) {
  let all = []
  for (let i = 0; i < ids.length; i += size) {
    const rows = await fetchAllRows(q => build(q, ids.slice(i, i + size)))
    all = all.concat(rows || [])
  }
  return all
}

export default function StarredPage() {
  const { user } = useAuth()
  const [groups, setGroups] = useState([]) // [{ branch, items: [{ question, topic }] }]
  const [notes, setNotes] = useState({})
  const [available, setAvailable] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) load() }, [user?.id])

  async function load() {
    setLoading(true)
    try {
      const { map, available } = await loadNotes(user.id)
      setAvailable(available)
      setNotes(map)
      const qIds = Object.keys(map).map(Number)
      if (qIds.length === 0) { setGroups([]); setLoading(false); return }

      const questions = await fetchInChunks(qIds, (q, chunk) => q.from('questions').select('*').in('id', chunk))
      const topicIds = [...new Set(questions.map(q => q.topic_id))]
      const topics = await fetchInChunks(topicIds, (q, chunk) => q.from('topics').select('id, title, branch_id, sort_order').in('id', chunk))
      const topicById = Object.fromEntries(topics.map(t => [t.id, t]))

      setGroups(ALL_BRANCHES.map(branch => ({
        branch,
        items: questions
          .filter(q => topicById[q.topic_id]?.branch_id === branch.id)
          .map(q => ({ question: q, topic: topicById[q.topic_id] }))
          .sort((a, b) => (a.topic.sort_order - b.topic.sort_order) || (a.question.id - b.question.id)),
      })).filter(g => g.items.length > 0))
    } catch (err) {
      console.error(err)
      toast.error('Yıldızlı sorular yüklenemedi')
    }
    setLoading(false)
  }

  async function copyText(text, label) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(label)
    } catch {
      toast.error('Kopyalanamadı')
    }
  }

  async function updateNote(qid, text) {
    const err = await saveNote(user.id, qid, text)
    if (err) { toast.error(notesErrorMessage(err)); return false }
    setNotes(prev => ({ ...prev, [qid]: text }))
    toast.success('Not kaydedildi')
    return true
  }

  async function unstar(qid) {
    const err = await removeNote(user.id, qid)
    if (err) { toast.error(notesErrorMessage(err)); return }
    setNotes(prev => { const n = { ...prev }; delete n[qid]; return n })
    setGroups(prev => prev
      .map(g => ({ ...g, items: g.items.filter(it => it.question.id !== qid) }))
      .filter(g => g.items.length > 0))
    toast.success('Yıldız kaldırıldı')
  }

  const total = groups.reduce((s, g) => s + g.items.length, 0)

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-8 pb-24">
        <Link to="/" className="inline-flex items-center gap-2 mb-6 text-sm" style={{ color: '#6b7a8f' }}>
          <ChevronLeft size={15} /> Ana sayfa
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold text-white flex items-center gap-3">
            <Star size={28} color="#f0c040" fill="#f0c040" />
            Yıldızlı Sorular
          </h1>
          <p className="mt-1 text-[14px]" style={{ color: '#6b7a8f' }}>
            {loading ? 'yükleniyor…' : `${total} soru · soru çözerken yıldıza basıp not düştüklerin`}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={26} className="animate-spin" style={{ color: '#f0c040' }} /></div>
        ) : !available ? (
          <div className="rounded-lg p-4 text-sm" style={{ background: 'rgba(240,192,64,0.06)', border: '1px solid rgba(240,192,64,0.3)', color: '#f0c040' }}>
            Yıldız/not tablosu henüz yok (supabase_migration_question_notes.sql çalıştırılmalı).
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-lg p-10 text-center" style={{ background: '#0b1626', border: '1px solid #18263a' }}>
            <Star size={28} className="mx-auto mb-3" style={{ color: '#2e3b4d' }} />
            <p className="text-sm" style={{ color: '#6b7a8f' }}>Henüz yıldızlı soru yok. Soru çözerken ☆ butonuna basıp not düşebilirsin.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {groups.map(({ branch, items }) => (
              <section key={branch.id}>
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <div className="w-[4px] h-7 rounded" style={{ background: branch.color }} />
                  <h2 className="text-white text-xl sm:text-2xl font-semibold">{branch.name}</h2>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ color: branch.color, background: `${branch.color}18` }}>{items.length}</span>
                  <div className="flex-1" />
                  <BulkCopyBar
                    texts={items.map(it => questionToText(it.question, { topicTitle: it.topic.title }))}
                    title={`${branch.name} yıldızlı sorular`}
                    color={branch.color}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {items.map(({ question, topic }) => (
                    <StarredCard
                      key={question.id}
                      question={question}
                      topic={topic}
                      note={notes[question.id] ?? ''}
                      color={branch.color}
                      onCopy={() => copyText(questionToText(question, { topicTitle: topic.title }), 'Soru kopyalandı')}
                      onSaveNote={text => updateNote(question.id, text)}
                      onUnstar={() => unstar(question.id)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

function StarredCard({ question, topic, note, color, onCopy, onSaveNote, onUnstar }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(note)

  return (
    <div className="flex flex-col rounded-md overflow-hidden" style={{ background: '#0a1525', border: '1px solid #16283f', borderTop: `3px solid ${color}` }}>
      <div className="flex items-start justify-between gap-2 px-4 pt-3">
        <span className="text-[12px] font-semibold uppercase tracking-wide leading-snug" style={{ color }}>
          {topic.title}
          {question.source && <span className="block normal-case font-normal tracking-normal text-[11px] mt-0.5" style={{ color: '#6b7a8f' }}>{question.source}</span>}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={onCopy} title="Kopyala" className="p-2" style={{ color: '#8aa4c0', border: '1px solid #1e3555', background: '#0d1a2e' }}>
            <Copy size={14} />
          </button>
          <button onClick={onUnstar} title="Yıldızı kaldır" className="p-2" style={{ color: '#f0c040', border: '1px solid rgba(240,192,64,0.45)', background: 'rgba(240,192,64,0.1)' }}>
            <Star size={14} fill="#f0c040" />
          </button>
        </div>
      </div>

      {/* Not */}
      <div className="mx-4 mt-3 rounded px-3 py-2" style={{ background: 'rgba(240,192,64,0.07)', borderLeft: '2px solid #f0c040' }}>
        {editing ? (
          <>
            <textarea
              autoFocus
              rows={3}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              className="w-full rounded px-2 py-1.5 text-[13px] outline-none resize-y"
              style={{ background: '#0a1628', border: '1px solid #223044', color: '#e1e5ec' }}
            />
            <div className="flex gap-1.5 mt-1.5">
              <button
                onClick={async () => { if (await onSaveNote(draft.trim())) setEditing(false) }}
                className="h-7 px-3 rounded text-[12px] font-semibold"
                style={{ background: '#f0c040', color: '#0a1628' }}
              >Kaydet</button>
              <button onClick={() => { setDraft(note); setEditing(false) }} className="h-7 px-2 text-[12px]" style={{ color: '#7d8ca0' }}>İptal</button>
            </div>
          </>
        ) : (
          <button onClick={() => { setDraft(note); setEditing(true) }} className="w-full text-left flex items-start gap-2 group">
            <span className="flex-1 text-[13px] leading-snug whitespace-pre-line" style={{ color: note ? '#f4e3b0' : '#7d8ca0' }}>
              {note || 'Not yok — eklemek için dokun'}
            </span>
            <Pencil size={12} className="mt-0.5 flex-shrink-0 opacity-50 group-hover:opacity-100" style={{ color: '#f0c040' }} />
          </button>
        )}
      </div>

      <p className="px-4 pt-3 text-[15px] leading-relaxed whitespace-pre-line" style={{ color: '#e2e8f0' }}>
        {question.question_text}
      </p>

      <div className="px-4 pt-3 space-y-1">
        {(question.options || []).map((opt, i) => {
          const correct = i === question.correct_answer
          return (
            <p
              key={i}
              className="text-sm leading-snug px-2 py-1"
              style={{
                color: correct ? '#6ee7b7' : '#8090a8',
                background: correct ? 'rgba(16,185,129,0.08)' : 'transparent',
                borderLeft: `2px solid ${correct ? '#10b981' : 'transparent'}`,
              }}
            >
              <span className="font-bold mr-1.5">{LETTERS[i] ?? i + 1})</span>{opt}{correct && ' ✓'}
            </p>
          )
        })}
      </div>

      {question.explanation
        ? <p className="mx-4 mt-3 mb-4 text-[13px] leading-relaxed whitespace-pre-line px-3 py-2" style={{ color: '#9aa8bc', background: 'rgba(8,145,178,0.05)', borderLeft: '2px solid rgba(8,145,178,0.35)' }}>{question.explanation}</p>
        : <div className="mb-4" />}
    </div>
  )
}
