import { useState, useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, CheckCircle2, BookOpen, FileQuestion, Pencil } from 'lucide-react'
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
  const bottomRef = useRef(null)

  useEffect(() => {
    loadData()
  }, [id, user?.id])

  async function loadData() {
    setLoading(true)
    try {
      const { data: topicData } = await supabase
        .from('topics')
        .select('*')
        .eq('id', id)
        .single()

      if (!topicData) { setLoading(false); return }
      setTopic(topicData)

      const b = getBranchById(topicData.branch_id)
      setBranch(b)

      const { data: questions } = await supabase
        .from('questions')
        .select('id')
        .eq('topic_id', id)

      const qIds = questions?.map(q => q.id) || []

      if (user) {
        const { data: progress } = await supabase
          .from('user_topic_progress')
          .select('completed')
          .eq('user_id', user.id)
          .eq('topic_id', id)
          .single()

        setIsCompleted(progress?.completed || false)

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
      setIsCompleted(!newVal)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-6 sm:px-10 py-10">
          <div className="shimmer h-4 w-28 mb-8" />
          <div className="shimmer h-8 w-2/3 mb-6" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="shimmer h-4" style={{ width: `${92 - i * 5}%` }} />
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
          <p className="text-gray-600 text-xs uppercase tracking-widest">Konu bulunamadı.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-6 sm:px-10 py-10 pb-32">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to={branch ? `/branch/${branch.id}` : '/'}
            className="inline-flex items-center gap-1.5 text-gray-600 hover:text-[#ff1744] text-xs uppercase tracking-widest transition-colors"
          >
            <ChevronLeft size={14} />
            <span>{branch?.name || 'Geri'}</span>
          </Link>

          <div className="flex items-center gap-2">
            {user && cardStats.totalCount > 0 && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setShowQuestions(true)}
                className="font-bebas text-sm tracking-[0.1em] text-white px-4 py-1.5 flex items-center gap-2"
                style={{
                  background: '#ff1744',
                  clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
                }}
              >
                <FileQuestion size={13} />
                SORULAR
                {(cardStats.dueCount > 0 || cardStats.newCount > 0) && (
                  <span
                    className="font-sans text-[10px] font-bold px-1.5 py-0.5 leading-none"
                    style={{ background: 'rgba(255,255,255,0.2)' }}
                  >
                    {cardStats.dueCount || cardStats.newCount}
                  </span>
                )}
              </motion.button>
            )}

            {user?.is_admin && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowEditor(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:text-gray-300 transition-colors text-xs uppercase tracking-wider"
                style={{ background: '#111', border: '1px solid #222' }}
              >
                <Pencil size={12} />
                Düzenle
              </motion.button>
            )}
          </div>
        </div>

        {/* Topic header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 relative"
        >
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#ff1744]" />
          <div className="pl-5">
            {branch && (
              <p className="text-[#ff1744] text-[10px] font-bebas tracking-[0.2em] mb-2">
                {branch.name.toUpperCase()}
              </p>
            )}
            <h1 className="text-xl sm:text-2xl font-bold text-gray-100 leading-tight">
              {topic.title}
            </h1>

            {user && cardStats.totalCount > 0 && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
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
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
          style={{
            background: '#0f0f0f',
            border: '1px solid #1a1a1a',
            borderLeft: '3px solid #1a1a1a',
            padding: '2rem 2rem',
          }}
        >
          {topic.content ? (
            <div className="markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {topic.content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="font-bebas text-xl text-gray-700 tracking-widest">İÇERİK BEKLENİYOR</p>
              <p className="text-gray-600 text-xs mt-2 uppercase tracking-wider">Bu konu için henüz içerik eklenmemiş.</p>
            </div>
          )}
        </motion.div>

        {/* Complete / Login CTA */}
        <div ref={bottomRef} className="flex justify-center">
          {user ? (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={toggleCompleted}
              className="flex items-center gap-3 px-8 py-3.5 font-bebas tracking-[0.12em] text-base transition-all duration-250"
              style={isCompleted ? {
                background: 'rgba(240,192,64,0.1)',
                border: '2px solid rgba(240,192,64,0.4)',
                color: '#f0c040',
                clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
              } : {
                background: '#111',
                border: '2px solid #2a2a2a',
                color: '#aaa',
                clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
              }}
            >
              <AnimatePresence mode="wait">
                {isCompleted ? (
                  <motion.div key="check" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }}>
                    <CheckCircle2 size={16} />
                  </motion.div>
                ) : (
                  <motion.div key="book">
                    <BookOpen size={16} />
                  </motion.div>
                )}
              </AnimatePresence>
              {isCompleted ? 'TAMAMLANDI ✓' : 'KONUYU TAMAMLADIM'}
            </motion.button>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2.5 px-6 py-3 font-bebas tracking-[0.1em] text-sm text-gray-600 hover:text-gray-400 transition-all"
              style={{ background: '#111', border: '1px solid #1f1f1f' }}
            >
              <BookOpen size={15} />
              <span>İLERLEMEYİ TAKİP ETMEK İÇİN GİRİŞ YAP</span>
            </Link>
          )}
        </div>
      </div>

      {/* Floating Sorular button — logged in */}
      {user && cardStats.totalCount > 0 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowQuestions(true)}
          className="fixed bottom-8 right-6 z-20 font-bebas tracking-[0.1em] text-sm text-white flex items-center gap-2 px-5 py-3"
          style={{
            background: '#ff1744',
            clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
            boxShadow: '0 4px 24px rgba(255,23,68,0.4)',
            animation: 'pulseRed 2s ease-in-out infinite',
          }}
        >
          <FileQuestion size={15} />
          SORULAR
          {(cardStats.dueCount > 0 || cardStats.newCount > 0) && (
            <span
              className="font-sans text-[10px] font-bold px-1.5 py-0.5 leading-none"
              style={{ background: 'rgba(255,255,255,0.25)' }}
            >
              {cardStats.dueCount || cardStats.newCount}
            </span>
          )}
        </motion.button>
      )}

      {/* Question Panel */}
      <AnimatePresence>
        {showQuestions && (
          <QuestionPanel
            topicId={parseInt(id)}
            onClose={() => { setShowQuestions(false); loadData() }}
          />
        )}
      </AnimatePresence>

      {/* Topic Editor */}
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
