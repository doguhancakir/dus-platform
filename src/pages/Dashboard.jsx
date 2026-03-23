import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Flame, BookOpen, TrendingUp, Clock, LogIn } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { BRANCHES } from '../lib/data'
import ProgressRing from '../components/ProgressRing'
import SkeletonCard from '../components/SkeletonCard'
import Layout from '../components/Layout'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

export default function Dashboard() {
  const { user } = useAuth()
  const [branchStats, setBranchStats] = useState({})
  const [totalDue, setTotalDue] = useState(0)
  const [loading, setLoading] = useState(!!user)

  useEffect(() => {
    if (user) {
      setLoading(true)
      loadStats()
    } else {
      setLoading(false)
      setBranchStats({})
    }
  }, [user?.id])

  async function loadStats() {
    try {
      const { data: topics } = await supabase
        .from('topics')
        .select('id, branch_id')

      const { data: progress } = await supabase
        .from('user_topic_progress')
        .select('topic_id')
        .eq('user_id', user.id)
        .eq('completed', true)

      const completedIds = new Set(progress?.map(p => p.topic_id) || [])

      const now = new Date().toISOString()
      const { data: dueCards } = await supabase
        .from('user_cards')
        .select('question_id, status')
        .eq('user_id', user.id)
        .lte('due_date', now)
        .neq('status', 'new')

      const { data: questions } = await supabase
        .from('questions')
        .select('id, topic_id, topics(branch_id)')

      const questionBranchMap = {}
      questions?.forEach(q => {
        questionBranchMap[q.id] = q.topics?.branch_id
      })

      const branchDue = {}
      dueCards?.forEach(c => {
        const branchId = questionBranchMap[c.question_id]
        if (branchId) {
          branchDue[branchId] = (branchDue[branchId] || 0) + 1
        }
      })

      const stats = {}
      BRANCHES.forEach(b => {
        const branchTopics = topics?.filter(t => t.branch_id === b.id) || []
        const completedCount = branchTopics.filter(t => completedIds.has(t.id)).length
        stats[b.id] = {
          topicCount: branchTopics.length,
          completedCount,
          dueCount: branchDue[b.id] || 0,
          progress: branchTopics.length > 0
            ? Math.round((completedCount / branchTopics.length) * 100)
            : 0,
        }
      })

      setBranchStats(stats)
      setTotalDue(dueCards?.length || 0)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const totalTopics = Object.values(branchStats).reduce((s, b) => s + b.topicCount, 0)
  const completedTopics = Object.values(branchStats).reduce((s, b) => s + b.completedCount, 0)
  const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 pb-24 lg:pb-10">
        {/* Hero */}
        <div className="mb-10">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-2 leading-none">
              Davy's <span className="text-accent">Dental</span>
            </h1>
            <p className="text-gray-500 text-sm font-light tracking-wide mb-4">
              Diş Hekimliği Uzmanlık Sınavı Hazırlık Platformu
            </p>
            {user && (
              <p className="text-sm text-gray-400">
                Hoş geldin, <span className="text-accent font-semibold">{user.nickname}</span> 👋
              </p>
            )}
          </motion.div>
        </div>

        {/* Overview Cards — only for logged-in users */}
        {user ? (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8"
          >
            <motion.div variants={item} className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} className="text-accent" />
                <span className="text-xs text-gray-500 font-medium">Bugün bekleyen</span>
              </div>
              <div className="text-3xl font-black text-white">{totalDue}</div>
              <div className="text-xs text-gray-600 mt-0.5">kart</div>
            </motion.div>

            <motion.div variants={item} className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={14} className="text-blue-400" />
                <span className="text-xs text-gray-500 font-medium">Tamamlanan</span>
              </div>
              <div className="text-3xl font-black text-white">{completedTopics}</div>
              <div className="text-xs text-gray-600 mt-0.5">/ {totalTopics} konu</div>
            </motion.div>

            <motion.div variants={item} className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-emerald-400" />
                <span className="text-xs text-gray-500 font-medium">Genel ilerleme</span>
              </div>
              <div className="text-3xl font-black text-white">{overallProgress}%</div>
              <div className="progress-bar mt-2">
                <motion.div
                  className="progress-fill bg-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProgress}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                />
              </div>
            </motion.div>

            <motion.div variants={item} className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Flame size={14} className="text-orange-400" />
                <span className="text-xs text-gray-500 font-medium">Branşlar</span>
              </div>
              <div className="text-3xl font-black text-white">8</div>
              <div className="text-xs text-gray-600 mt-0.5">klinik alan</div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-5 mb-8 flex items-center justify-between"
            style={{ borderColor: 'rgba(0,212,170,0.15)' }}
          >
            <div>
              <p className="text-sm font-semibold text-gray-200">Hesap oluştur ve ilerlemeni takip et</p>
              <p className="text-xs text-gray-500 mt-0.5">Öğrendiğin konuları işaretle, tekrar kartlarını yönet</p>
            </div>
            <Link
              to="/login"
              className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-lg transition-all shrink-0 ml-4"
              style={{ background: 'rgba(0,212,170,0.15)', border: '1px solid rgba(0,212,170,0.25)' }}
            >
              <LogIn size={15} />
              Giriş yap
            </Link>
          </motion.div>
        )}

        {/* Branch Grid */}
        <div className="mb-6">
          <h2 className="text-[11px] font-semibold text-gray-600 mb-5 uppercase tracking-widest">Klinik Bilimler</h2>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3"
        >
          {BRANCHES.map((branch) => {
            const stats = branchStats[branch.id]
            return (
              <motion.div key={branch.id} variants={item}>
                <BranchCard branch={branch} stats={stats} loading={loading} showProgress={!!user} />
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </Layout>
  )
}

function BranchCard({ branch, stats, loading, showProgress }) {
  if (loading) return <SkeletonCard />

  const progress = stats?.progress || 0
  const topicCount = stats?.topicCount || 0
  const completedCount = stats?.completedCount || 0
  const dueCount = stats?.dueCount || 0

  return (
    <Link to={`/branch/${branch.id}`}>
      <motion.div
        whileHover={{ y: -3, scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="card p-4 cursor-pointer group"
        style={{ '--branch-color': branch.color }}
      >
        {/* Top row */}
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: `${branch.color}15`, border: `1px solid ${branch.color}25` }}
          >
            {branch.icon}
          </div>
          {showProgress && (
            <ProgressRing
              progress={progress}
              size={40}
              strokeWidth={3}
              color={branch.color}
            />
          )}
        </div>

        {/* Name */}
        <h3 className="text-sm font-bold text-gray-200 leading-snug mb-2 group-hover:text-white transition-colors">
          {branch.name}
        </h3>

        {/* Stats — only for logged-in users */}
        {showProgress && (
          <>
            <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
              <span>{completedCount}/{topicCount} konu</span>
              <span>{progress}%</span>
            </div>

            <div className="progress-bar">
              <motion.div
                className="progress-fill"
                style={{ backgroundColor: branch.color, width: `${progress}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, delay: 0.1 }}
              />
            </div>

            {dueCount > 0 && (
              <div className="mt-3 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <span className="text-xs text-accent">{dueCount} kart bekliyor</span>
              </div>
            )}
          </>
        )}
      </motion.div>
    </Link>
  )
}
