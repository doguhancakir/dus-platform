import { useState, useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, CheckCircle2, BookOpen, Clock, FileQuestion, X, Pencil } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getBranchById } from '../lib/data'
import { isDue } from '../lib/sm2'
import QuestionPanel from '../components/QuestionPanel'
import TopicEditor from '../components/TopicEditor'
import Layout from '../components/Layout'

export default function TopicPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [topic, setTopic] = useState(null)
  const [branch, setBranch] = useState(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const [cardStats, setCardStats] = useState({ newCount: 0, dueCount: 0, learnedCount: 0, totalCount: 0 })
  const [showQuestions, setShowQuestions] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [loading, setLoading] = useState(true)
  const [completingAnim, setCompletingAnim] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    loadData()
  }, [id, user?.id])

  async function loadData() {
    setLoading(true)
    try {
      // Konu
      const { data: topicData } = await supabase
        .from('topics')
        .select('*')
        .eq('id', id)
        .single()

      if (!topicData) { setLoading(false); return }
      setTopic(topicData)

      const b = getBranchById(topicData.branch_id)
      setBranch(b)

      // Soru sayısı (herkese açık)
      const { data: questions } = await supabase
        .from('questions')
        .select('id')
        .eq('topic_id', id)

      const qIds = questions?.map(q => q.id) || []

      if (user) {
        // Tamamlama durumu
        const { data: progress } = await supabase
          .from('user_topic_progress')
          .select('completed')
          .eq('user_id', user.id)
          .eq('topic_id', id)
          .single()

        setIsCompleted(progress?.completed || false)

        // Kart istatistikleri
        if (qIds.length > 0) {
          const { data: cards } = await supabase
            .from('user_cards')
            .select('question_id, status, due_date')
            .eq('user_id', user.id)
            .in('question_id', qIds)

          const cardsMap = {}
          cards?.forEach(c => { cardsMap[c.question_id] = c })

          const newCount = qIds.filter(qId => !cardsMap[qId] || cardsMap[qId].status === 'new').length
          const dueCount = qIds.filter(qId => {
            const c = cardsMap[qId]
            return c && c.status !== 'new' && isDue(c)
          }).length
          const learnedCount = qIds.filter(qId => cardsMap[qId]?.status === 'review').length

          setCardStats({ newCount, dueCount, learnedCount, totalCount: qIds.length })
        } else {
          setCardStats({ newCount: 0, dueCount: 0, learnedCount: 0, totalCount: 0 })
        }
      } else {
        setIsCompleted(false)
        setCardStats({ newCount: 0, dueCount: 0, learnedCount: 0, totalCount: qIds.length })
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  async function toggleCompleted() {
    setCompletingAnim(true)
    const newVal = !isCompleted
    setIsCompleted(newVal)

    try {
      await supabase
        .from('user_topic_progress')
        .upsert({
          user_id: user.id,
          topic_id: parseInt(id),
          completed: newVal,
          completed_at: newVal ? new Date().toISOString() : null,
        })
    } catch (err) {
      console.error(err)
      setIsCompleted(!newVal) // revert
    }

    setTimeout(() => setCompletingAnim(false), 600)
  }

  const dueLabel = cardStats.dueCount > 0
    ? `${cardStats.dueCount} bekliyor`
    : cardStats.newCount > 0
    ? `${cardStats.newCount} yeni`
    : cardStats.totalCount > 0
    ? `${cardStats.totalCount} soru`
    : 'Soru yok'

  if (loading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="shimmer h-6 w-32 rounded mb-8" />
          <div className="shimmer h-8 w-2/3 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="shimmer h-4 rounded" style={{ width: `${90 - i * 5}%` }} />
            ))}
          </div>
        </div>
      </Layout>
    )
  }

  if (!topic) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Konu bulunamadı.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-32 lg:pb-12">
        {/* Back */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to={branch ? `/branch/${branch.id}` : '/'}
            className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            <ChevronLeft size={16} />
            <span>{branch?.name || 'Geri'}</span>
          </Link>

          {/* Admin Edit Button */}
          {user?.is_admin && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowEditor(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1e1e1e] border border-[#2a2a2a]
                text-gray-400 hover:text-gray-200 hover:border-[#3a3a3a] transition-all text-sm font-medium"
            >
              <Pencil size={14} />
              <span>Düzenle</span>
            </motion.button>
          )}

          {/* Question Button */}
          {user && cardStats.totalCount > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowQuestions(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/10 border border-accent/20
                text-accent hover:bg-accent/15 transition-all text-sm font-medium"
            >
              <FileQuestion size={15} />
              <span>Sorular</span>
              {(cardStats.dueCount > 0 || cardStats.newCount > 0) && (
                <span className="bg-accent text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {cardStats.dueCount || cardStats.newCount}
                </span>
              )}
            </motion.button>
          )}
        </div>

        {/* Topic Header */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start gap-3">
            {branch && (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0 mt-0.5"
                style={{ background: `${branch.color}15`, border: `1px solid ${branch.color}25` }}
              >
                {branch.icon}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-100 leading-tight">{topic.title}</h1>
              {branch && (
                <p className="text-sm text-gray-500 mt-1">{branch.name}</p>
              )}
            </div>
          </div>

          {/* Card stats (logged-in users only) */}
          {user && cardStats.totalCount > 0 && (
            <div className="flex items-center gap-3 mt-4">
              {cardStats.newCount > 0 && (
                <span className="badge-blue">{cardStats.newCount} yeni</span>
              )}
              {cardStats.dueCount > 0 && (
                <span className="badge-red">{cardStats.dueCount} bekliyor</span>
              )}
              {cardStats.learnedCount > 0 && (
                <span className="badge-green">{cardStats.learnedCount} öğrenildi</span>
              )}
            </div>
          )}
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="card p-6 sm:p-8 mb-8"
        >
          {topic.content ? (
            <div className="markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {topic.content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-3xl mb-3">📝</div>
              <p className="text-gray-500">Bu konu için henüz içerik eklenmemiş.</p>
            </div>
          )}
        </motion.div>

        {/* Complete Button / Login Prompt */}
        <div ref={bottomRef} className="flex justify-center">
          {user ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={toggleCompleted}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-xl border font-medium text-sm
                transition-all duration-200 ${
                isCompleted
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-[#1e1e1e] border-[#2a2a2a] text-gray-400 hover:border-[#3a3a3a] hover:text-gray-200'
              }`}
            >
              <AnimatePresence mode="wait">
                {isCompleted ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  >
                    <CheckCircle2 size={18} className="text-emerald-400" />
                  </motion.div>
                ) : (
                  <motion.div key="circle" initial={{ scale: 1 }}>
                    <BookOpen size={18} />
                  </motion.div>
                )}
              </AnimatePresence>
              <span>{isCompleted ? 'Tamamlandı ✓' : 'Konuyu Tamamladım'}</span>
            </motion.button>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl border border-[#2a2a2a]
                bg-[#1e1e1e] text-gray-500 hover:border-[#3a3a3a] hover:text-gray-300 font-medium text-sm transition-all"
            >
              <BookOpen size={18} />
              <span>İlerlemeyi takip etmek için giriş yap</span>
            </Link>
          )}
        </div>
      </div>

      {/* Question Panel Modal */}
      <AnimatePresence>
        {showQuestions && (
          <QuestionPanel
            topicId={parseInt(id)}
            onClose={() => { setShowQuestions(false); loadData() }}
          />
        )}
      </AnimatePresence>

      {/* Admin Topic Editor */}
      <AnimatePresence>
        {showEditor && topic && (
          <TopicEditor
            topic={topic}
            onClose={() => setShowEditor(false)}
            onSaved={(newContent) => setTopic(t => ({ ...t, content: newContent }))}
          />
        )}
      </AnimatePresence>
    </Layout>
  )
}
