import { useState, useEffect } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, CheckCircle2, Circle, ChevronRight, ChevronDown, BarChart3 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getBranchById } from '../lib/data'
import { getExamWisdom } from '../lib/examWisdom'
import { isDue } from '../lib/sm2'
import Layout from '../components/Layout'

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, x: -40, skewX: -3 },
  show: {
    opacity: 1,
    x: 0,
    skewX: 0,
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
  },
}

export default function BranchPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const branch = getBranchById(id)

  const [topics, setTopics] = useState([])
  const [completedIds, setCompletedIds] = useState(new Set())
  const [topicStats, setTopicStats] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [id, user?.id])

  if (!branch) return <Navigate to="/" replace />

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
      const { data: questions } = await supabase
        .from('questions')
        .select('id, topic_id')
        .in('topic_id', topicIds)

      if (user) {
        const { data: progress } = await supabase
          .from('user_topic_progress')
          .select('topic_id')
          .eq('user_id', user.id)
          .eq('completed', true)
          .in('topic_id', topicIds)

        setCompletedIds(new Set(progress?.map(p => p.topic_id) || []))

        const qIds = questions?.map(q => q.id) || []
        let cardsMap = {}
        if (qIds.length > 0) {
          const { data: cards } = await supabase
            .from('user_cards')
            .select('question_id, status, due_date')
            .eq('user_id', user.id)
            .in('question_id', qIds)
          cards?.forEach(c => { cardsMap[c.question_id] = c })
        }

        const stats = {}
        topicsData.forEach(topic => {
          const topicQs = questions?.filter(q => q.topic_id === topic.id) || []
          const newCount = topicQs.filter(q => !cardsMap[q.id] || cardsMap[q.id].status === 'new').length
          const dueCount = topicQs.filter(q => {
            const c = cardsMap[q.id]
            return c && c.status !== 'new' && isDue(c)
          }).length
          const learnedCount = topicQs.filter(q => cardsMap[q.id]?.status === 'review').length
          stats[topic.id] = { totalCount: topicQs.length, newCount, dueCount, learnedCount }
        })
        setTopicStats(stats)
      } else {
        const stats = {}
        topicsData.forEach(topic => {
          const topicQs = questions?.filter(q => q.topic_id === topic.id) || []
          stats[topic.id] = { totalCount: topicQs.length, newCount: 0, dueCount: 0, learnedCount: 0 }
        })
        setTopicStats(stats)
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  if (!branch) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p
            className="font-barlow font-bold text-[11px] uppercase tracking-[0.2em]"
            style={{ color: '#2a3a50' }}
          >
            Branş bulunamadı.
          </p>
        </div>
      </Layout>
    )
  }

  const completedCount = topics.filter(t => completedIds.has(t.id)).length
  const progress = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0
  const totalDue = Object.values(topicStats).reduce((s, t) => s + t.dueCount, 0)

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-6 sm:px-10 pt-8 pb-24">

        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 transition-colors group"
            style={{ color: '#2a3a50' }}
            onMouseEnter={e => e.currentTarget.style.color = '#0891b2'}
            onMouseLeave={e => e.currentTarget.style.color = '#2a3a50'}
          >
            <ChevronLeft size={13} />
            <span
              className="font-barlow font-bold text-[11px] uppercase tracking-[0.2em]"
            >
              Genel Bakış
            </span>
          </Link>
        </motion.div>

        {/* Branch header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 relative overflow-hidden"
        >
          {/* Branch color accent */}
          <div
            className="absolute left-0 top-0 bottom-0 w-[4px]"
            style={{ background: branch.color }}
          />
          {/* Background diagonal */}
          <div
            className="absolute right-0 top-0 bottom-0 pointer-events-none"
            style={{
              width: '40%',
              background: `linear-gradient(to left, ${branch.color}08, transparent)`,
              clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0 100%)',
            }}
          />

          <div className="pl-6 pr-4 py-5 relative z-10">
            {/* Branch eyebrow */}
            <div className="mb-2">
              <span
                className="font-barlow font-bold text-[10px] tracking-[0.22em] uppercase px-2 py-0.5"
                style={{
                  color: branch.color,
                  background: `${branch.color}12`,
                  border: `1px solid ${branch.color}25`,
                }}
              >
                Klinik Bilim
              </span>
            </div>

            <h1
              className="font-bebas text-white tracking-wider leading-none"
              style={{
                fontSize: 'clamp(32px, 6vw, 68px)',
                transform: 'skewX(-3deg)',
                display: 'inline-block',
              }}
            >
              {branch.name.toUpperCase()}
            </h1>

            {user && !loading ? (
              <div className="mt-4">
                {/* Stats row */}
                <div
                  className="flex items-center gap-4 font-barlow font-bold text-[10px] uppercase tracking-wider mb-3"
                  style={{ color: '#3a5070' }}
                >
                  <span>{completedCount}/{topics.length} konu</span>
                  {totalDue > 0 && (
                    <span style={{ color: branch.color }}>{totalDue} kart bekliyor</span>
                  )}
                  <span
                    className="font-bebas text-lg leading-none"
                    style={{ color: branch.color }}
                  >
                    {progress}%
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-[2px] w-64 max-w-full" style={{ background: '#1a2d45' }}>
                  <motion.div
                    className="h-full"
                    style={{ background: branch.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            ) : !loading ? (
              <p
                className="font-barlow font-bold text-[10px] uppercase tracking-[0.2em] mt-2"
                style={{ color: '#2a3a50' }}
              >
                {topics.length} konu
              </p>
            ) : null}
          </div>
        </motion.div>

        {/* Sınav ağırlığı / wisdom paneli */}
        <ExamWisdomPanel branchColor={branch.color} data={getExamWisdom(branch.id)} />

        {/* Topics divider */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-[3px] h-4" style={{ background: branch.color }} />
          <span
            className="font-barlow font-bold text-[11px] uppercase tracking-[0.2em]"
            style={{ color: '#2a3a50' }}
          >
            Konular
          </span>
          <div className="flex-1 h-px" style={{ background: '#1a2d45' }} />
          {!loading && (
            <span
              className="font-barlow font-bold text-[10px] uppercase tracking-wider"
              style={{ color: '#1a2d45' }}
            >
              {topics.length}
            </span>
          )}
        </div>

        {/* Topics list */}
        {loading ? (
          <div className="space-y-[2px]">
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className="relative overflow-hidden"
                style={{ height: 72, background: '#0a1525' }}
              >
                <div className="shimmer absolute inset-0" style={{ animationDelay: `${i * 0.08}s` }} />
                <div
                  className="absolute left-0 top-0 bottom-0 w-[3px]"
                  style={{ background: '#1a2d45' }}
                />
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
            className="flex flex-col"
            style={{ gap: '2px' }}
          >
            {topics.map((topic, idx) => {
              const stats = topicStats[topic.id] || {}
              const isCompleted = completedIds.has(topic.id)
              return (
                <motion.div key={topic.id} variants={itemVariants}>
                  <TopicCard
                    topic={topic}
                    stats={stats}
                    isCompleted={isCompleted}
                    showProgress={!!user}
                    branchColor={branch.color}
                    index={idx}
                  />
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </Layout>
  )
}

function TopicCard({ topic, stats, isCompleted, showProgress, branchColor, index }) {
  return (
    <Link to={`/topic/${topic.id}`}>
      <motion.div
        whileHover={{ x: 6 }}
        whileTap={{ scale: 0.99 }}
        className="relative overflow-hidden cursor-pointer flex items-center gap-4 group"
        style={{
          background: '#0a1525',
          borderLeft: '3px solid transparent',
          padding: '1rem 1.25rem',
          transition: 'background 0.15s ease, border-left-color 0.15s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderLeftColor = branchColor
          e.currentTarget.style.background = '#0d1a2e'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderLeftColor = 'transparent'
          e.currentTarget.style.background = '#0a1525'
        }}
      >
        {/* Completion state */}
        {showProgress && (
          <div className="flex-shrink-0">
            {isCompleted ? (
              <CheckCircle2 size={16} color={branchColor} />
            ) : (
              <Circle size={16} color="#1e3040" />
            )}
          </div>
        )}

        {/* Index number */}
        <div
          className="flex-shrink-0 font-barlow font-bold text-[11px] tracking-wider w-6 text-center"
          style={{ color: '#1e3040' }}
        >
          {String(index + 1).padStart(2, '0')}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className="text-sm font-semibold leading-snug"
            style={{ color: isCompleted && showProgress ? '#3a4a5a' : '#d8dce8' }}
          >
            {topic.title}
          </h3>
          {stats.totalCount > 0 && (
            <div
              className="flex items-center gap-3 mt-1 font-barlow font-bold text-[10px] uppercase tracking-wider"
            >
              {showProgress && stats.newCount > 0 && (
                <span style={{ color: '#4466ff' }}>{stats.newCount} yeni</span>
              )}
              {showProgress && stats.dueCount > 0 && (
                <span style={{ color: branchColor }}>{stats.dueCount} bekliyor</span>
              )}
              {showProgress && stats.learnedCount > 0 && (
                <span style={{ color: '#10b981' }}>{stats.learnedCount} öğrenildi</span>
              )}
              {(!showProgress || (stats.newCount === 0 && stats.dueCount === 0 && stats.learnedCount === 0)) && (
                <span style={{ color: '#1e3040' }}>{stats.totalCount} soru</span>
              )}
            </div>
          )}
        </div>

        {/* Arrow */}
        <ChevronRight
          size={13}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{ color: branchColor }}
        />
      </motion.div>
    </Link>
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
