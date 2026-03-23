import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, CheckCircle2, Circle, BookOpen, Clock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getBranchById } from '../lib/data'
import { isDue } from '../lib/sm2'
import SkeletonCard from '../components/SkeletonCard'
import Layout from '../components/Layout'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}
const item = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.2 } },
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
      // Konular
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

      // Soru sayıları (always load for question counts)
      const { data: questions } = await supabase
        .from('questions')
        .select('id, topic_id')
        .in('topic_id', topicIds)

      if (user) {
        // Tamamlanan konular
        const { data: progress } = await supabase
          .from('user_topic_progress')
          .select('topic_id')
          .eq('user_id', user.id)
          .eq('completed', true)
          .in('topic_id', topicIds)

        setCompletedIds(new Set(progress?.map(p => p.topic_id) || []))

        // Kart verileri
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

        // Topic bazlı istatistikler
        const stats = {}
        topicsData.forEach(topic => {
          const topicQs = questions?.filter(q => q.topic_id === topic.id) || []
          const newCount = topicQs.filter(q => !cardsMap[q.id] || cardsMap[q.id].status === 'new').length
          const dueCount = topicQs.filter(q => {
            const c = cardsMap[q.id]
            return c && c.status !== 'new' && isDue(c)
          }).length
          const learnedCount = topicQs.filter(q => {
            const c = cardsMap[q.id]
            return c?.status === 'review'
          }).length

          stats[topic.id] = {
            totalCount: topicQs.length,
            newCount,
            dueCount,
            learnedCount,
          }
        })

        setTopicStats(stats)
      } else {
        // Not logged in: just show question counts per topic
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
          <p className="text-gray-500">Branş bulunamadı.</p>
        </div>
      </Layout>
    )
  }

  const completedCount = topics.filter(t => completedIds.has(t.id)).length
  const progress = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0
  const totalDue = Object.values(topicStats).reduce((s, t) => s + t.dueCount, 0)

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 pb-24 lg:pb-10">
        {/* Back */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-accent text-sm mb-6 transition-colors">
          <ChevronLeft size={16} />
          <span>Genel Bakış</span>
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: `${branch.color}15`, border: `1px solid ${branch.color}25` }}
            >
              {branch.icon}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-100 mb-1">{branch.name}</h1>
              {user ? (
                <>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{completedCount}/{topics.length} konu tamamlandı</span>
                    {totalDue > 0 && (
                      <span className="text-accent flex items-center gap-1">
                        <Clock size={12} />
                        {totalDue} kart bekliyor
                      </span>
                    )}
                  </div>
                  <div className="progress-bar mt-3">
                    <motion.div
                      className="progress-fill"
                      style={{ backgroundColor: branch.color, width: `${progress}%` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">{topics.length} konu</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Topics */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : topics.length === 0 ? (
          <EmptyState branchName={branch.name} />
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
            {topics.map((topic) => {
              const stats = topicStats[topic.id] || {}
              const isCompleted = completedIds.has(topic.id)
              return (
                <motion.div key={topic.id} variants={item}>
                  <TopicCard
                    topic={topic}
                    stats={stats}
                    isCompleted={isCompleted}
                    branchColor={branch.color}
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

function TopicCard({ topic, stats, isCompleted, branchColor, showProgress }) {
  return (
    <Link to={`/topic/${topic.id}`}>
      <motion.div
        whileHover={{ x: 3, scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="card p-4 cursor-pointer group flex items-center gap-4"
      >
        {/* Completion Icon */}
        {showProgress && (
          <div className="flex-shrink-0">
            {isCompleted ? (
              <CheckCircle2 size={20} style={{ color: branchColor }} />
            ) : (
              <Circle size={20} className="text-gray-700 group-hover:text-gray-500 transition-colors" />
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-semibold mb-1 group-hover:text-white transition-colors
            ${isCompleted && showProgress ? 'text-gray-400' : 'text-gray-100'}`}>
            {topic.title}
          </h3>
          <div className="flex items-center gap-3 text-xs">
            {stats.totalCount > 0 && (
              <>
                {showProgress && stats.newCount > 0 && (
                  <span className="text-blue-400">{stats.newCount} yeni</span>
                )}
                {showProgress && stats.dueCount > 0 && (
                  <span className="text-red-400">{stats.dueCount} bekliyor</span>
                )}
                {showProgress && stats.learnedCount > 0 && (
                  <span className="text-emerald-400">{stats.learnedCount} öğrenildi</span>
                )}
                {(!showProgress || (stats.newCount === 0 && stats.dueCount === 0 && stats.learnedCount === 0)) && (
                  <span className="text-gray-600">{stats.totalCount} soru</span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Arrow */}
        <ChevronLeft size={16} className="text-gray-700 group-hover:text-gray-400 rotate-180 flex-shrink-0 transition-colors" />
      </motion.div>
    </Link>
  )
}

function EmptyState({ branchName }) {
  return (
    <div className="card p-12 text-center">
      <div className="text-4xl mb-3">📚</div>
      <h3 className="text-lg font-medium text-gray-300 mb-2">Henüz konu yok</h3>
      <p className="text-gray-600 text-sm">{branchName} için konular yakında eklenecek.</p>
    </div>
  )
}
