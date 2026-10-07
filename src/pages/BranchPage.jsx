import { useState, useEffect } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, ChevronDown, BarChart3, Layers, Check, Zap, X, Play, FileText, Flag } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, fetchAllRows } from '../lib/supabase'
import { getBranchById } from '../lib/data'
import { getExamWisdom } from '../lib/examWisdom'
import { computeTopicStats } from '../lib/topicStats'
import Layout from '../components/Layout'
import QuestionPanel from '../components/QuestionPanel'
import QuestionsTextModal from '../components/QuestionsTextModal'

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, x: -30 },
  show: { opacity: 1, x: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
}

export default function BranchPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const branch = getBranchById(id)

  const [topics, setTopics] = useState([])
  const [topicStats, setTopicStats] = useState({})
  const [loading, setLoading] = useState(true)

  // Çözüm paneli: tek konu (sayı) ya da toplu çöz (dizi)
  const [panelTopicIds, setPanelTopicIds] = useState(null)
  const [textTopic, setTextTopic] = useState(null)

  // ── Toplu çöz ──────────────────────────────────────────────────────────────
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedBulk, setSelectedBulk] = useState(new Set())

  useEffect(() => {
    loadData()
  }, [id, user?.id])

  if (!branch) return <Navigate to="/" replace />

  function topicHasPending(topicId) {
    const s = topicStats[topicId]
    return !!s && (s.dueCount > 0 || s.newCount > 0)
  }

  function toggleBulkMode() {
    setBulkMode(v => !v)
    setSelectedBulk(new Set())
  }

  function toggleBulkTopic(topicId) {
    if (!topicHasPending(topicId)) return
    setSelectedBulk(prev => {
      const next = new Set(prev)
      next.has(topicId) ? next.delete(topicId) : next.add(topicId)
      return next
    })
  }

  function selectAllBulkTopics() {
    setSelectedBulk(new Set(topics.filter(t => topicHasPending(t.id)).map(t => t.id)))
  }

  function startBulkSolve() {
    if (selectedBulk.size === 0) return
    setPanelTopicIds([...selectedBulk])
  }

  function closePanel() {
    setPanelTopicIds(null)
    setBulkMode(false)
    setSelectedBulk(new Set())
    loadData()
  }

  const bulkSelectedQuestionCount = [...selectedBulk].reduce((sum, tId) => {
    const s = topicStats[tId]
    return sum + (s ? s.dueCount + s.newCount : 0)
  }, 0)

  async function loadData() {
    setLoading(true)
    try {
      const { data: topicsData } = await supabase
        .from('topics')
        .select('id, title, sort_order')
        .eq('branch_id', branch.id)
        .order('sort_order')

      setTopics(topicsData || [])
      if (!topicsData?.length) { setLoading(false); return }

      const topicIds = topicsData.map(t => t.id)
      const questions = await fetchAllRows(q => q
        .from('questions')
        .select('id, topic_id')
        .in('topic_id', topicIds)
      )

      const cardsMap = {}
      const qIds = questions?.map(q => q.id) || []
      if (user && qIds.length > 0) {
        const cards = await fetchAllRows(q => q
          .from('user_cards')
          .select('question_id, status, due_date, flagged')
          .eq('user_id', user.id)
          .in('question_id', qIds)
        )
        cards?.forEach(c => { cardsMap[c.question_id] = c })
      }

      const stats = {}
      topicsData.forEach(topic => {
        const ids = (questions || []).filter(q => q.topic_id === topic.id).map(q => q.id)
        stats[topic.id] = computeTopicStats(ids, cardsMap)
      })
      setTopicStats(stats)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const masteredCount = topics.filter(t => topicStats[t.id]?.isMastered).length
  const progress = topics.length > 0 ? Math.round((masteredCount / topics.length) * 100) : 0
  const totalDue = Object.values(topicStats).reduce((s, t) => s + t.dueCount, 0)
  const totalNew = Object.values(topicStats).reduce((s, t) => s + t.newCount, 0)

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-10 pt-8 pb-28">

        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 transition-colors"
            style={{ color: '#3a5070' }}
            onMouseEnter={e => e.currentTarget.style.color = '#0891b2'}
            onMouseLeave={e => e.currentTarget.style.color = '#3a5070'}
          >
            <ChevronLeft size={14} />
            <span className="font-barlow font-bold text-xs uppercase tracking-[0.2em]">Genel Bakış</span>
          </Link>
        </motion.div>

        {/* Branch header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 relative overflow-hidden"
        >
          <div className="absolute left-0 top-0 bottom-0 w-[4px]" style={{ background: branch.color }} />
          <div
            className="absolute right-0 top-0 bottom-0 pointer-events-none"
            style={{
              width: '40%',
              background: `linear-gradient(to left, ${branch.color}08, transparent)`,
              clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0 100%)',
            }}
          />

          <div className="pl-6 pr-4 py-5 relative z-10">
            <h1
              className="font-bebas text-white tracking-wider leading-none"
              style={{ fontSize: 'clamp(32px, 6vw, 68px)', transform: 'skewX(-3deg)', display: 'inline-block' }}
            >
              {branch.name.toUpperCase()}
            </h1>

            {user && !loading ? (
              <div className="mt-4">
                <div
                  className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[14px] mb-3"
                  style={{ color: '#6b7a8f' }}
                >
                  <span><span style={{ color: '#c8d0dc' }}>{masteredCount}/{topics.length}</span> konu tamamlandı</span>
                  {totalDue > 0 && <><span style={{ color: '#2e3b4d' }}>·</span><span><span style={{ color: '#c8d0dc' }}>{totalDue}</span> tekrar</span></>}
                  {totalNew > 0 && <><span style={{ color: '#2e3b4d' }}>·</span><span>{totalNew} yeni</span></>}
                </div>
                <div className="h-[3px] w-72 max-w-full rounded-full overflow-hidden" style={{ background: '#16212f' }}>
                  <motion.div
                    className="h-full"
                    style={{ background: '#10b981' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>

        {/* Sınav ağırlığı / wisdom paneli */}
        <ExamWisdomPanel branchColor={branch.color} data={getExamWisdom(branch.id)} />

        {/* Topics divider */}
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <div className="w-[3px] h-4" style={{ background: branch.color }} />
          <span className="font-barlow font-bold text-xs uppercase tracking-[0.2em]" style={{ color: '#4a6080' }}>
            Konular
          </span>
          <div className="flex-1 h-px" style={{ background: '#1a2d45' }} />
          {!loading && user && topics.length > 0 && (
            <>
              {bulkMode && (
                <button
                  onClick={selectAllBulkTopics}
                  className="font-barlow font-bold text-[11px] uppercase tracking-wider px-2.5 py-1.5 transition-colors"
                  style={{ color: branch.color, background: `${branch.color}0e`, border: `1px solid ${branch.color}40` }}
                >
                  Tümünü Seç
                </button>
              )}
              <button
                onClick={toggleBulkMode}
                className="flex items-center gap-1.5 font-barlow font-bold text-[11px] uppercase tracking-wider px-3 py-1.5 transition-colors"
                style={bulkMode ? {
                  color: '#fff', background: branch.color, border: `1px solid ${branch.color}`,
                } : {
                  color: '#6a8aaa', background: 'transparent', border: '1px solid #1e3555',
                }}
              >
                {bulkMode ? <X size={12} /> : <Layers size={12} />}
                {bulkMode ? 'VAZGEÇ' : 'TOPLU ÇÖZ'}
              </button>
            </>
          )}
        </div>

        {/* Topics list */}
        {loading ? (
          <div className="space-y-[2px]">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="relative overflow-hidden" style={{ height: 76, background: '#0a1525' }}>
                <div className="shimmer absolute inset-0" style={{ animationDelay: `${i * 0.08}s` }} />
              </div>
            ))}
          </div>
        ) : topics.length === 0 ? (
          <EmptyState branchName={branch.name} color={branch.color} />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col rounded-lg overflow-hidden divide-y divide-[#152234]"
            style={{ background: "#0b1626", border: "1px solid #18263a" }}
          >
            {topics.map((topic, idx) => (
              <motion.div key={topic.id} variants={itemVariants}>
                <TopicCard
                  topic={topic}
                  stats={topicStats[topic.id] || {}}
                  showProgress={!!user}
                  branchColor={branch.color}
                  index={idx}
                  bulkMode={bulkMode}
                  isSelected={selectedBulk.has(topic.id)}
                  onToggleBulk={toggleBulkTopic}
                  onSolve={() => setPanelTopicIds(topic.id)}
                  onShowText={() => setTextTopic(topic)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* ── Toplu çöz — sticky başla barı ── */}
      <AnimatePresence>
        {bulkMode && selectedBulk.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-0 left-0 right-0 p-5 flex justify-center"
            style={{ background: 'linear-gradient(to top, #06101e 55%, transparent)', zIndex: 50 }}
          >
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={startBulkSolve}
              className="w-full max-w-md flex items-center justify-center gap-3 py-4 font-bebas tracking-[0.22em] text-xl text-white relative overflow-hidden"
              style={{
                background: branch.color,
                clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))',
              }}
            >
              <Zap size={16} strokeWidth={2.5} />
              BAŞLA
              <span className="font-barlow font-bold text-[12px] uppercase tracking-wider ml-1" style={{ opacity: 0.75 }}>
                {selectedBulk.size} konu · {bulkSelectedQuestionCount} soru
              </span>
              <ChevronRight size={18} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {panelTopicIds && (
          <QuestionPanel topicId={panelTopicIds} onClose={closePanel} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {textTopic && (
          <QuestionsTextModal topic={textTopic} onClose={() => setTextTopic(null)} />
        )}
      </AnimatePresence>
    </Layout>
  )
}

function TopicCard({ topic, stats, showProgress, branchColor, index, bulkMode, isSelected, onToggleBulk, onSolve, onShowText }) {
  const isMastered = showProgress && stats.isMastered
  const pending = (stats.dueCount || 0) + (stats.newCount || 0)
  const hasPending = pending > 0
  const disabledInBulk = bulkMode && !hasPending
  const total = stats.totalCount || 0
  const learned = stats.learnedCount || 0
  const learnedPct = total > 0 ? Math.round((learned / total) * 100) : 0

  function handleCardClick() {
    if (bulkMode) onToggleBulk(topic.id)
    else if (total > 0) onSolve()
  }

  // Alt satır: sade, küçük harf, tek renk; sadece "tekrar" vurgulu
  const meta = []
  if (showProgress && total > 0) {
    if (isMastered) meta.push(<span key="m" style={{ color: '#4fae8c' }}>tamamlandı</span>)
    else {
      if (stats.dueCount > 0) meta.push(<span key="d" style={{ color: '#c8d0dc' }}>{stats.dueCount} tekrar</span>)
      if (stats.newCount > 0) meta.push(<span key="n">{stats.newCount} yeni</span>)
    }
  }
  if (total > 0 && !showProgress) meta.push(<span key="t">{total} soru</span>)

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3.5 transition-colors"
      style={{
        background: bulkMode && isSelected ? `${branchColor}14` : 'transparent',
        opacity: disabledInBulk ? 0.35 : 1,
        cursor: disabledInBulk ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={e => { if (!bulkMode) e.currentTarget.style.background = 'rgba(255,255,255,0.025)' }}
      onMouseLeave={e => { e.currentTarget.style.background = bulkMode && isSelected ? `${branchColor}14` : 'transparent' }}
    >
      {/* Sol: numara / tamamlandı / toplu seçim kutusu */}
      <div className="flex-shrink-0 w-7 flex items-center justify-center">
        {bulkMode ? (
          <div
            className="flex items-center justify-center"
            style={{
              width: 18, height: 18, borderRadius: 4,
              border: `2px solid ${isSelected ? branchColor : '#2a3a50'}`,
              background: isSelected ? branchColor : 'transparent',
            }}
          >
            {isSelected && <Check size={11} strokeWidth={3} style={{ color: '#000' }} />}
          </div>
        ) : isMastered ? (
          <div className="flex items-center justify-center" style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(16,185,129,0.15)' }}>
            <Check size={13} strokeWidth={3} style={{ color: '#34d399' }} />
          </div>
        ) : (
          <span className="text-sm tabular-nums" style={{ color: '#3a4a60' }}>{index + 1}</span>
        )}
      </div>

      {/* Orta: başlık + ilerleme */}
      <div className="flex-1 min-w-0">
        <h3 className="text-[16px] leading-snug font-medium truncate" style={{ color: isMastered ? '#9fdcc4' : '#e1e5ec' }}>
          {topic.title}
        </h3>
        {meta.length > 0 && (
          <div className="flex items-center flex-wrap gap-x-1.5 mt-1 text-[13px]" style={{ color: '#6b7a8f' }}>
            {meta.map((m, i) => (
              <span key={i} className="flex items-center gap-1.5 whitespace-nowrap">
                {i > 0 && <span style={{ color: '#2e3b4d' }}>·</span>}
                {m}
              </span>
            ))}
          </div>
        )}
        {showProgress && total > 0 && (
          <div className="flex items-center gap-2.5 mt-2" title={`${learned}/${total} öğrenildi`}>
            <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: '#16212f', maxWidth: 220 }}>
              <div className="h-full rounded-full" style={{ width: `${learnedPct}%`, background: isMastered ? '#34d399' : `${branchColor}aa` }} />
            </div>
            <span className="text-[12px] tabular-nums whitespace-nowrap" style={{ color: '#4f5e72' }}>{learned}/{total}</span>
          </div>
        )}
      </div>

      {/* Sağ: aksiyonlar */}
      {!bulkMode && total > 0 && (
        <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
          {stats.flaggedCount > 0 && (
            <Link
              to={`/flagged?topic=${topic.id}`}
              className="flex items-center gap-1 h-9 px-2.5 rounded-md text-[13px] transition-colors hover:bg-white/5"
              style={{ color: '#e07a7a' }}
              title="Bu konunun bayraklı soruları"
            >
              <Flag size={14} />
              {stats.flaggedCount}
            </Link>
          )}
          <button
            onClick={onShowText}
            className="flex items-center justify-center w-9 h-9 rounded-md transition-colors hover:bg-white/5"
            style={{ color: '#7d8ca0' }}
            title="Soruları metin olarak gör / kopyala"
            aria-label="Metin"
          >
            <FileText size={17} />
          </button>
          <button
            onClick={onSolve}
            className="flex items-center justify-center gap-1.5 h-9 min-w-[76px] px-3 rounded-md text-[14px] font-medium tabular-nums transition-colors"
            style={hasPending
              ? { color: '#fff', background: `${branchColor}33`, border: `1px solid ${branchColor}66` }
              : { color: '#7d8ca0', border: '1px solid #223044' }}
            title="Bu konunun sorularını çöz"
          >
            <Play size={13} fill="currentColor" />
            {hasPending ? pending : 'Çöz'}
          </button>
        </div>
      )}
    </div>
  )
}

function ExamWisdomPanel({ branchColor, data }) {
  const [expanded, setExpanded] = useState(false)
  if (!data) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="mb-8 relative overflow-hidden"
      style={{ background: '#0a1525', border: '1px solid #1a2d45', borderLeft: `3px solid ${branchColor}` }}
    >
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left p-4 sm:p-5 flex items-start gap-4"
      >
        <BarChart3 size={16} className="flex-shrink-0 mt-0.5" style={{ color: branchColor }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="font-barlow font-bold text-[10px] tracking-[0.2em] uppercase"
              style={{ color: branchColor }}
            >
              Sınavda Bu Branş
            </span>
            <span
              className="font-bebas text-sm leading-none"
              style={{ color: '#5a6d88' }}
            >
              {data.total} SORU
            </span>
          </div>
          {data.wisdom && (
            <p
              className="text-xs text-gray-500 leading-relaxed"
              style={{ display: '-webkit-box', WebkitLineClamp: expanded ? 'unset' : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
            >
              {data.wisdom}
            </p>
          )}
          {!data.wisdom && !expanded && (
            <p className="text-xs text-gray-600">Konulara göre soru dağılımını gör</p>
          )}
        </div>
        <ChevronDown
          size={14}
          className="flex-shrink-0 mt-0.5 transition-transform duration-200"
          style={{ color: '#3a4a5a', transform: expanded ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {expanded && (
        <div className="px-4 sm:px-5 pb-5" style={{ borderTop: '1px solid #12233a' }}>
          <div className="space-y-2 pt-4">
            {data.topics.map(t => {
              const [min, max] = t.q
              const qLabel = min === max ? `${min}` : `${min}–${max}`
              return (
                <div key={t.name} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs text-gray-400 truncate">{t.name}</span>
                      <span
                        className="font-barlow font-bold text-[10px] uppercase tracking-wider flex-shrink-0"
                        style={{ color: branchColor }}
                      >
                        {qLabel} soru
                      </span>
                    </div>
                    <div className="h-[3px] w-full" style={{ background: '#12233a' }}>
                      <div
                        className="h-full"
                        style={{ width: `${t.pct}%`, background: branchColor }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </motion.div>
  )
}

function EmptyState({ branchName, color }) {
  return (
    <div
      className="p-12 text-center relative overflow-hidden"
      style={{ background: '#0a1525', borderLeft: `3px solid ${color}30` }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${color}04, transparent)`,
        }}
      />
      <p
        className="font-bebas text-xl tracking-widest mb-2 relative z-10"
        style={{ color: '#1e3040' }}
      >
        HENÜZ KONU YOK
      </p>
      <p
        className="font-barlow font-bold text-[11px] uppercase tracking-wider relative z-10"
        style={{ color: '#1a2a38' }}
      >
        {branchName} için konular yakında eklenecek.
      </p>
    </div>
  )
}
