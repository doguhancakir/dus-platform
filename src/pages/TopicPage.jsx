import { useState, useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, CheckCircle2, BookOpen, FileQuestion, Pencil, NotebookPen, X, List } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getBranchById } from '../lib/data'
import { isDue } from '../lib/sm2'
import QuestionPanel from '../components/QuestionPanel'
import TopicEditor from '../components/TopicEditor'
import Layout from '../components/Layout'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function extractHeadings(content) {
  if (!content) return []
  const regex = /^(#{2,3})\s+(.+)$/gm
  const headings = []
  let match
  while ((match = regex.exec(content)) !== null) {
    const level = match[1].length
    const text = match[2].replace(/[*_`]/g, '').replace(/^\W+/, '').trim()
    const id = slugify(text)
    if (id) headings.push({ level, text, id })
  }
  return headings
}

function getChildText(node) {
  if (!node) return ''
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(getChildText).join('')
  if (node?.props?.children !== undefined) return getChildText(node.props.children)
  return ''
}

// ─── Component ────────────────────────────────────────────────────────────────

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

  // TOC
  const [headings, setHeadings] = useState([])
  const [activeHeadingId, setActiveHeadingId] = useState(null)
  const [readSections, setReadSections] = useState(0)
  const [showMobileToc, setShowMobileToc] = useState(false)

  // Notes
  const [showNotes, setShowNotes] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [noteSaving, setNoteSaving] = useState('idle') // 'idle' | 'saving' | 'saved'
  const [noteLoading, setNoteLoading] = useState(false)
  const noteSaveTimer = useRef(null)

  useEffect(() => { loadData() }, [id, user?.id])

  useEffect(() => {
    if (topic?.content) setHeadings(extractHeadings(topic.content))
  }, [topic?.content])

  useEffect(() => {
    if (!headings.length) return
    const handleScroll = () => {
      let newActiveId = null
      let newReadSections = 0
      for (const h of headings) {
        const el = document.getElementById(h.id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= 130) newActiveId = h.id
      }
      for (const h of headings.filter(h => h.level === 2)) {
        const el = document.getElementById(h.id)
        if (!el) continue
        if (el.getBoundingClientRect().top < window.innerHeight * 0.55) newReadSections++
      }
      setActiveHeadingId(newActiveId)
      setReadSections(newReadSections)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    setTimeout(handleScroll, 150)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [headings])

  async function loadData() {
    setLoading(true)
    try {
      const { data: topicData } = await supabase
        .from('topics').select('*').eq('id', id).single()
      if (!topicData) { setLoading(false); return }
      setTopic(topicData)
      const b = getBranchById(topicData.branch_id)
      setBranch(b)
      const { data: questions } = await supabase
        .from('questions').select('id').eq('topic_id', id)
      const qIds = questions?.map(q => q.id) || []
      if (user) {
        const { data: progress } = await supabase
          .from('user_topic_progress').select('completed')
          .eq('user_id', user.id).eq('topic_id', id).single()
        setIsCompleted(progress?.completed || false)
        if (qIds.length > 0) {
          const { data: cards } = await supabase
            .from('user_cards').select('question_id, status, due_date')
            .eq('user_id', user.id).in('question_id', qIds)
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
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  async function toggleCompleted() {
    const newVal = !isCompleted
    setIsCompleted(newVal)
    try {
      await supabase.from('user_topic_progress').upsert({
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

  // ─── Notes ──────────────────────────────────────────────────────────────────

  async function loadNotes() {
    if (!user) return
    setNoteLoading(true)
    try {
      const { data } = await supabase
        .from('user_notes').select('content')
        .eq('user_id', user.id).eq('topic_id', parseInt(id)).single()
      setNoteContent(data?.content || '')
    } catch { setNoteContent('') }
    setNoteLoading(false)
  }

  async function saveNotes(content) {
    if (!user) return
    setNoteSaving('saving')
    try {
      await supabase.from('user_notes').upsert({
        user_id: user.id,
        topic_id: parseInt(id),
        content,
        updated_at: new Date().toISOString(),
      })
      setNoteSaving('saved')
      setTimeout(() => setNoteSaving('idle'), 2000)
    } catch { setNoteSaving('idle') }
  }

  function handleNoteChange(e) {
    const value = e.target.value
    setNoteContent(value)
    clearTimeout(noteSaveTimer.current)
    noteSaveTimer.current = setTimeout(() => saveNotes(value), 1000)
  }

  function handleNotesToggle() {
    if (!showNotes) loadNotes()
    setShowNotes(prev => !prev)
  }

  function scrollToHeading(hid) {
    const el = document.getElementById(hid)
    if (!el) return
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' })
    setShowMobileToc(false)
  }

  // ─── Markdown renderers ───────────────────────────────────────────────────

  const markdownComponents = {
    h2: ({ children }) => {
      const id = slugify(getChildText(children))
      return <h2 id={id || undefined}>{children}</h2>
    },
    h3: ({ children }) => {
      const id = slugify(getChildText(children))
      return <h3 id={id || undefined}>{children}</h3>
    },
    blockquote: ({ children }) => {
      const text = getChildText(children)
      let cls = ''
      if (text.includes('KRİTİK')) cls = 'callout callout-kritik'
      else if (text.includes('ÖNEMLİ')) cls = 'callout callout-onemli'
      else if (text.includes('KLİNİK')) cls = 'callout callout-klinik'
      else if (text.includes('ÖZET') || text.includes('OZET')) cls = 'callout callout-ozet'
      return <blockquote className={cls || undefined}>{children}</blockquote>
    },
  }

  const sectionCount = headings.filter(h => h.level === 2).length

  const tocInner = (
    <>
      <div className="toc-header">
        <span className="toc-title">İÇİNDEKİLER</span>
        {sectionCount > 0 && (
          <span className="toc-progress-text">{readSections}/{sectionCount} bölüm</span>
        )}
      </div>
      <ul className="toc-list">
        {headings.map(h => (
          <li key={h.id}>
            <button
              className={`toc-item${h.level === 3 ? ' toc-h3' : ''}${activeHeadingId === h.id ? ' toc-active' : ''}`}
              onClick={() => scrollToHeading(h.id)}
            >
              {h.text}
            </button>
          </li>
        ))}
      </ul>
    </>
  )

  // ─── Loading / not found ──────────────────────────────────────────────────

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

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="topic-outer">
        {/* ── Main content ── */}
        <div className="topic-main">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-8">
            <Link
              to={branch ? `/branch/${branch.id}` : '/'}
              className="inline-flex items-center gap-1.5 text-gray-600 hover:text-[#0891b2] text-xs uppercase tracking-widest transition-colors"
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
                    background: '#0891b2',
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
                  style={{ background: '#0d1e35', border: '1px solid #1e3050' }}
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
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#0891b2]" />
            <div className="pl-5">
              {branch && (
                <p className="text-[#0891b2] text-[10px] font-bebas tracking-[0.2em] mb-2">
                  {branch.name.toUpperCase()}
                </p>
              )}
              <h1 className="text-xl sm:text-2xl font-bold text-gray-100 leading-tight">
                {topic.title}
              </h1>
              {user && cardStats.totalCount > 0 && (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {cardStats.newCount > 0 && <span className="badge-blue">{cardStats.newCount} yeni</span>}
                  {cardStats.dueCount > 0 && <span className="badge-red">{cardStats.dueCount} bekliyor</span>}
                  {cardStats.learnedCount > 0 && <span className="badge-green">{cardStats.learnedCount} öğrenildi</span>}
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
              background: '#0f1d32',
              border: '1px solid #1a2d45',
              borderLeft: '3px solid #1a2d45',
              padding: '2rem 2rem',
            }}
          >
            {topic.content ? (
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
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
                  background: '#0d1e35',
                  border: '2px solid #243550',
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
                    <motion.div key="book"><BookOpen size={16} /></motion.div>
                  )}
                </AnimatePresence>
                {isCompleted ? 'TAMAMLANDI ✓' : 'KONUYU TAMAMLADIM'}
              </motion.button>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2.5 px-6 py-3 font-bebas tracking-[0.1em] text-sm text-gray-600 hover:text-gray-400 transition-all"
                style={{ background: '#0d1e35', border: '1px solid #1a2d45' }}
              >
                <BookOpen size={15} />
                <span>İLERLEMEYİ TAKİP ETMEK İÇİN GİRİŞ YAP</span>
              </Link>
            )}
          </div>
        </div>

        {/* ── TOC Sidebar (desktop ≥ 1024px, ≥ 2 headings) ── */}
        {headings.length >= 2 && (
          <aside className="topic-toc-sidebar">
            <div className="toc-container">{tocInner}</div>
          </aside>
        )}
      </div>

      {/* ── Mobile TOC toggle (< 1024px, ≥ 2 headings) ── */}
      {headings.length >= 2 && (
        <div className="toc-mobile-wrap">
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => setShowMobileToc(p => !p)}
            className="toc-mobile-btn"
          >
            <List size={12} />
            <span>İÇİNDEKİLER</span>
          </motion.button>
          <AnimatePresence>
            {showMobileToc && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="toc-mobile-dropdown"
              >
                <div className="toc-container">{tocInner}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Notes button (fixed bottom-left) ── */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleNotesToggle}
        className="fixed bottom-8 left-6 z-20 font-bebas tracking-[0.1em] text-sm flex items-center gap-2 px-4 py-2.5"
        style={{
          background: showNotes ? '#1a0a10' : '#0d1e35',
          border: `2px solid ${showNotes ? '#ff1744' : '#1e3050'}`,
          color: showNotes ? '#ff5252' : '#4a6080',
          clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
          transition: 'background 0.2s, border-color 0.2s, color 0.2s',
        }}
      >
        <NotebookPen size={14} />
        NOTLARIM
      </motion.button>

      {/* ── Notes panel ── */}
      <AnimatePresence>
        {showNotes && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="notes-panel"
          >
            <div className="notes-header">
              <div style={{ minWidth: 0 }}>
                <div className="notes-title">NOTLARIM</div>
                <div className="notes-subtitle">{topic.title}</div>
              </div>
              <button
                onClick={() => setShowNotes(false)}
                className="flex-shrink-0 text-gray-600 hover:text-gray-300 transition-colors ml-2"
              >
                <X size={14} />
              </button>
            </div>

            <div className="notes-body">
              {!user ? (
                <div className="notes-login-msg">
                  <p className="font-bebas text-lg tracking-widest" style={{ color: '#3a4a60' }}>GİRİŞ YAPILMADI</p>
                  <p className="text-xs mt-1" style={{ color: '#2a3a50' }}>Not almak için giriş yapmalısın.</p>
                  <Link
                    to="/login"
                    onClick={() => setShowNotes(false)}
                    className="inline-block mt-3 font-bebas tracking-widest text-sm px-4 py-2 text-white"
                    style={{ background: '#ff1744' }}
                  >
                    GİRİŞ YAP
                  </Link>
                </div>
              ) : noteLoading ? (
                <div style={{ padding: '1rem' }}>
                  <div className="shimmer" style={{ height: 13, width: '60%', marginBottom: 8 }} />
                  <div className="shimmer" style={{ height: 13, width: '80%', marginBottom: 8 }} />
                  <div className="shimmer" style={{ height: 13, width: '45%' }} />
                </div>
              ) : (
                <textarea
                  className="notes-textarea"
                  placeholder="Buraya notlarını yaz..."
                  value={noteContent}
                  onChange={handleNoteChange}
                  autoFocus
                />
              )}
            </div>

            {user && !noteLoading && (
              <div className="notes-footer">
                {noteSaving === 'saving' && (
                  <><span className="notes-dot saving" />kaydediliyor...</>
                )}
                {noteSaving === 'saved' && (
                  <><span className="notes-dot saved" />kaydedildi</>
                )}
                {noteSaving === 'idle' && (
                  <span style={{ color: '#1a2d45' }}>otomatik kayıt aktif</span>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Sorular button ── */}
      {user && cardStats.totalCount > 0 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowQuestions(true)}
          className="fixed bottom-8 right-6 z-20 font-bebas tracking-[0.1em] text-sm text-white flex items-center gap-2 px-5 py-3"
          style={{
            background: '#0891b2',
            clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
            boxShadow: '0 4px 24px rgba(8,145,178,0.4)',
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

      {/* ── Panels ── */}
      <AnimatePresence>
        {showQuestions && (
          <QuestionPanel
            topicId={parseInt(id)}
            onClose={() => { setShowQuestions(false); loadData() }}
          />
        )}
      </AnimatePresence>

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
