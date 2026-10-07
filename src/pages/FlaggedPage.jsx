import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronLeft, Copy, Flag, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../contexts/AuthContext'
import { supabase, fetchAllRows } from '../lib/supabase'
import { BRANCHES, TEMEL_BILIMLER } from '../lib/data'
import { questionToText } from '../lib/questionText'
import Layout from '../components/Layout'

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

export default function FlaggedPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const topicFilter = searchParams.get('topic') ? Number(searchParams.get('topic')) : null

  const [groups, setGroups] = useState([]) // [{ branch, items: [{ question, topic }] }]
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) load() }, [user?.id])

  async function load() {
    setLoading(true)
    try {
      const flagged = await fetchAllRows(q => q
        .from('user_cards').select('question_id').eq('user_id', user.id).eq('flagged', true)
      )
      const qIds = (flagged || []).map(c => c.question_id)
      if (qIds.length === 0) { setGroups([]); setLoading(false); return }

      const questions = await fetchInChunks(qIds, (q, chunk) => q.from('questions').select('*').in('id', chunk))
      const topicIds = [...new Set(questions.map(q => q.topic_id))]
      const topics = await fetchInChunks(topicIds, (q, chunk) => q.from('topics').select('id, title, branch_id, sort_order').in('id', chunk))
      const topicById = Object.fromEntries(topics.map(t => [t.id, t]))

      const result = ALL_BRANCHES.map(branch => {
        const items = questions
          .filter(q => topicById[q.topic_id]?.branch_id === branch.id)
          .map(q => ({ question: q, topic: topicById[q.topic_id] }))
          .sort((a, b) => (a.topic.sort_order - b.topic.sort_order) || (a.question.id - b.question.id))
        return { branch, items }
      }).filter(g => g.items.length > 0)

      setGroups(result)
    } catch (err) {
      console.error(err)
      toast.error('Bayraklı sorular yüklenemedi')
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

  async function unflag(questionId) {
    const { error } = await supabase
      .from('user_cards')
      .update({ flagged: false })
      .eq('user_id', user.id)
      .eq('question_id', questionId)
    if (error) { toast.error('Bayrak kaldırılamadı'); return }
    setGroups(prev => prev
      .map(g => ({ ...g, items: g.items.filter(it => it.question.id !== questionId) }))
      .filter(g => g.items.length > 0))
    toast.success('Bayrak kaldırıldı — soru normal sıraya döndü')
  }

  const visibleGroups = topicFilter
    ? groups
        .map(g => ({ ...g, items: g.items.filter(it => it.topic.id === topicFilter) }))
        .filter(g => g.items.length > 0)
    : groups
  const total = visibleGroups.reduce((s, g) => s + g.items.length, 0)
  const filterTopicTitle = topicFilter ? visibleGroups[0]?.items[0]?.topic.title : null

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-8 pb-24">
        <Link
          to="/"
          className="inline-flex items-center gap-2 mb-6"
          style={{ color: '#3a5070' }}
        >
          <ChevronLeft size={14} />
          <span className="font-barlow font-bold text-xs uppercase tracking-[0.2em]">Genel Bakış</span>
        </Link>

        <div className="mb-8 relative pl-5">
          <div className="absolute left-0 top-0 bottom-0 w-[4px]" style={{ background: '#cc0000' }} />
          <h1 className="font-bebas text-white tracking-widest leading-none flex items-center gap-3" style={{ fontSize: 'clamp(30px, 5vw, 52px)' }}>
            <Flag size={26} color="#ff5252" fill="#ff5252" />
            BAYRAKLI SORULAR
          </h1>
          <p className="font-barlow font-bold text-xs uppercase tracking-wider mt-2" style={{ color: '#6a5050' }}>
            {loading ? 'yükleniyor…' : `${total} soru${filterTopicTitle ? ` · ${filterTopicTitle}` : ''}`}
          </p>
          {topicFilter && !loading && (
            <Link to="/flagged" className="inline-block mt-2 font-barlow font-bold text-xs uppercase tracking-wider" style={{ color: '#0891b2' }}>
              ← Tüm bayraklı soruları göster
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={26} className="animate-spin text-[#cc0000]" /></div>
        ) : visibleGroups.length === 0 ? (
          <div className="p-10 text-center" style={{ background: '#0a1525', border: '1px solid #1a2d45' }}>
            <p className="font-bebas text-xl tracking-widest" style={{ color: '#3a4a60' }}>BAYRAKLI SORU YOK</p>
            <p className="text-sm mt-2" style={{ color: '#3a4a60' }}>
              Soru çözerken kırmızı bayrağa basarsan soru buraya düşer.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {visibleGroups.map(({ branch, items }) => (
              <section key={branch.id}>
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <div className="w-[4px] h-7" style={{ background: branch.color }} />
                  <h2 className="font-bebas text-white tracking-wider leading-none" style={{ fontSize: 'clamp(20px, 3vw, 28px)' }}>
                    {branch.name.toUpperCase()}
                  </h2>
                  <span className="font-barlow font-bold text-xs px-2 py-0.5" style={{ color: branch.color, background: `${branch.color}18` }}>
                    {items.length}
                  </span>
                  <div className="flex-1" />
                  <button
                    onClick={() => copyText(
                      items.map(it => questionToText(it.question, { topicTitle: it.topic.title })).join('\n\n'),
                      `${branch.name}: ${items.length} soru kopyalandı`,
                    )}
                    className="flex items-center gap-2 font-barlow font-bold text-xs uppercase tracking-wider px-4 py-2"
                    style={{ color: '#fff', background: branch.color }}
                  >
                    <Copy size={13} />
                    Hepsini Kopyala
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {items.map(({ question, topic }) => (
                    <FlaggedCard
                      key={question.id}
                      question={question}
                      topic={topic}
                      color={branch.color}
                      onCopy={() => copyText(questionToText(question, { topicTitle: topic.title }), 'Soru kopyalandı')}
                      onUnflag={() => unflag(question.id)}
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

function FlaggedCard({ question, topic, color, onCopy, onUnflag }) {
  return (
    <div className="flex flex-col" style={{ background: '#0a1525', border: '1px solid #16283f', borderTop: `3px solid ${color}` }}>
      <div className="flex items-start justify-between gap-2 px-4 pt-3">
        <span className="font-barlow font-bold text-[11px] uppercase tracking-wider leading-snug" style={{ color }}>
          {topic.title}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={onCopy}
            title="Kopyala"
            className="p-2 transition-colors"
            style={{ color: '#8aa4c0', border: '1px solid #1e3555', background: '#0d1a2e' }}
          >
            <Copy size={14} />
          </button>
          <button
            onClick={onUnflag}
            title="Bayrağı kaldır (normal sıraya döner)"
            className="p-2 transition-colors"
            style={{ color: '#ff5252', border: '1px solid rgba(204,0,0,0.4)', background: 'rgba(204,0,0,0.1)' }}
          >
            <Flag size={14} fill="#ff5252" />
          </button>
        </div>
      </div>

      <p className="px-4 pt-2 text-[15px] leading-relaxed whitespace-pre-line" style={{ color: '#e2e8f0' }}>
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

      {question.explanation && (
        <p className="mx-4 mt-3 mb-4 text-[13px] leading-relaxed whitespace-pre-line px-3 py-2" style={{ color: '#9aa8bc', background: 'rgba(8,145,178,0.05)', borderLeft: '2px solid rgba(8,145,178,0.35)' }}>
          {question.explanation}
        </p>
      )}
      {!question.explanation && <div className="mb-4" />}
    </div>
  )
}
