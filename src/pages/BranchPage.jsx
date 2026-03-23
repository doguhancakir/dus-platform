import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, CheckCircle2, Circle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getBranchById } from '../lib/data'
import { isDue } from '../lib/sm2'
import Layout from '../components/Layout'

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, x: -30 },
  show: { opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.7, 0, 0.3, 1] } },
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
    if (branch) loadData()
  }, [id, user?.id])

  async function loadData() {
    setLoading(true)
    try {
      const { data: topicsData } = await supabase
        .from('topics')
        .select('id, title, sort_order')
        .eq('branch_id', branch.id)
        .order('sort_order')

      setTopics(topicsData || [])

      if (!topicsData?.length) {
        setLoading(false)
        return
      }

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
          <p className="text-gray-600 text-sm uppercase tracking-widest">Branş bulunamadı.</p>
        </div>
      </Layout>
    )
  }

  const completedCount = topics.filter(t => completedIds.has(t.id)).length
  const progress = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0
  const totalDue = Object.values(topicStats).reduce((s, t) => s + t.dueCount, 0)

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-6 sm:px-10 py-10 pb-20">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-gray-600 hover:text-[#0891b2] text-xs uppercase tracking-widest mb-8 transition-colors"
        >
          <ChevronLeft size={14} />
          <span>Genel Bakış</span>
        </Link>

        {/* Branch header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 relative"
        >
          {/* Red left stripe */}
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#0891b2]" />

          <div className="pl-5">
            <h1
              className="font-bebas text-white tracking-wider leading-none"
              style={{ fontSize: 'clamp(36px, 6vw, 72px)', transform: 'skewX(-3deg)', display: 'inline-block' }}
            >
              {branch.name.toUpperCase()}
            </h1>

            {user ? (
              <div className="mt-3">
                <div className="flex items-center gap-4 text-xs text-gray-600 mb-2 uppercase tracking-wider">
                  <span>{completedCount}/{topics.length} konu tamamlandı</span>
                  {totalDue > 0 && (
                    <span className="text-[#0891b2]">{totalDue} kart bekliyor</span>
                  )}
                  <span className="text-[#0891b2] font-bebas text-lg">{progress}%</span>
                </div>
                <div className="h-[2px] w-64 max-w-full" style={{ background: '#1a2d45' }}>
                  <motion.div
                    className="h-full bg-[#0891b2]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-xs uppercase tracking-widest mt-2">{topics.length} konu</p>
            )}
          </div>
        </motion.div>

        {/* Topics list */}
        {loading ? (
          <div className="space-y-[2px]">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="relative overflow-hidden" style={{ height: 72 }}>
                <div className="shimmer absolute inset-0" />
              </div>
            ))}
          </div>
        ) : topics.length === 0 ? (
          <EmptyState branchName={branch.name} />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col"
            style={{ gap: '2px' }}
          >
            {topics.map((topic) => {
              const stats = topicStats[topic.id] || {}
              const isCompleted = completedIds.has(topic.id)
              return (
                <motion.div key={topic.id} variants={itemVariants}>
                  <TopicCard
                    topic={topic}
                    stats={stats}
                    isCompleted={isCompleted}
                    showProgress={!!user}
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

function TopicCard({ topic, stats, isCompleted, showProgress }) {
  return (
    <Link to={`/topic/${topic.id}`}>
      <motion.div
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.99 }}
        className="relative overflow-hidden cursor-pointer flex items-center gap-4 px-5 py-4"
        style={{
          background: '#0d1e35',
          borderLeft: '3px solid transparent',
          transition: 'border-left-color 0.15s ease, background 0.15s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderLeftColor = '#0891b2'
          e.currentTarget.style.background = '#111e33'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderLeftColor = 'transparent'
          e.currentTarget.style.background = '#0d1e35'
        }}
      >
        {/* Completion icon */}
        {showProgress && (
          <div className="flex-shrink-0">
            {isCompleted ? (
              <CheckCircle2 size={18} color="#f0c040" />
            ) : (
              <Circle size={18} color="#333" />
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className="text-sm font-semibold leading-snug"
            style={{ color: isCompleted && showProgress ? '#555' : '#ddd' }}
          >
            {topic.title}
          </h3>
          <div className="flex items-center gap-3 mt-1 text-[11px]">
            {stats.totalCount > 0 && (
              <>
                {showProgress && stats.newCount > 0 && (
                  <span className="text-blue-500">{stats.newCount} yeni</span>
                )}
                {showProgress && stats.dueCount > 0 && (
                  <span className="text-[#0891b2]">{stats.dueCount} bekliyor</span>
                )}
                {showProgress && stats.learnedCount > 0 && (
                  <span className="text-emerald-500">{stats.learnedCount} öğrenildi</span>
                )}
                {(!showProgress || (stats.newCount === 0 && stats.dueCount === 0 && stats.learnedCount === 0)) && (
                  <span className="text-gray-600">{stats.totalCount} soru</span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Arrow */}
        <ChevronLeft
          size={14}
          className="flex-shrink-0 rotate-180"
          style={{ color: '#333' }}
        />
      </motion.div>
    </Link>
  )
}

function EmptyState({ branchName }) {
  return (
    <div
      className="p-12 text-center"
      style={{ background: '#0d1e35', borderLeft: '3px solid #1a2d45' }}
    >
      <p className="font-bebas text-xl text-gray-700 tracking-widest mb-2">HENÜZ KONU YOK</p>
      <p className="text-gray-600 text-xs uppercase tracking-wider">{branchName} için konular yakında eklenecek.</p>
    </div>
  )
}
