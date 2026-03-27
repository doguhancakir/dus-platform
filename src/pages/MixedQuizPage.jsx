import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { X, ChevronRight, ChevronDown, Trophy, ArrowLeft, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { BRANCHES } from '../lib/data'
import Layout from '../components/Layout'

function fisherYates(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function MixedQuizPage() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState('filter')

  // Filter state
  const [topics, setTopics] = useState([])
  const [questionCounts, setQuestionCounts] = useState({})
  const [selectedTopics, setSelectedTopics] = useState(new Set())
  const [expandedBranches, setExpandedBranches] = useState(new Set(BRANCHES.map(b => b.id)))
  const [filterLoading, setFilterLoading] = useState(true)

  // Quiz state
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [selectedOption, setSelectedOption] = useState(null)
  const [eliminatedOptions, setEliminatedOptions] = useState(new Set())
  const [results, setResults] = useState([])
  const [quizLoading, setQuizLoading] = useState(false)

  useEffect(() => {
    loadFilterData()
    const handler = (e) => { if (e.key === 'Escape' && phase === 'filter') navigate('/') }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  async function loadFilterData() {
    setFilterLoading(true)
    try {
      const [{ data: topicsData }, { data: questionData }] = await Promise.all([
        supabase.from('topics').select('id, branch_id, title').order('sort_order'),
        supabase.from('questions').select('id, topic_id'),
      ])
      const counts = {}
      questionData?.forEach(q => {
        counts[q.topic_id] = (counts[q.topic_id] || 0) + 1
      })
      setTopics(topicsData || [])
      setQuestionCounts(counts)
    } catch (err) {
      console.error('Filter load error:', err)
    }
    setFilterLoading(false)
  }

  const totalSelectedQuestions = [...selectedTopics].reduce(
    (sum, id) => sum + (questionCounts[id] || 0),
    0
  )

  function toggleTopic(topicId) {
    setSelectedTopics(prev => {
      const next = new Set(prev)
      next.has(topicId) ? next.delete(topicId) : next.add(topicId)
      return next
    })
  }

  function selectBranchTopics(branchId) {
    const ids = topics
      .filter(t => t.branch_id === branchId && (questionCounts[t.id] || 0) > 0)
      .map(t => t.id)
    setSelectedTopics(prev => {
      const next = new Set(prev)
      ids.forEach(id => next.add(id))
      return next
    })
  }

  function deselectBranchTopics(branchId) {
    const ids = topics.filter(t => t.branch_id === branchId).map(t => t.id)
    setSelectedTopics(prev => {
      const next = new Set(prev)
      ids.forEach(id => next.delete(id))
      return next
    })
  }

  function toggleBranch(branchId) {
    setExpandedBranches(prev => {
      const next = new Set(prev)
      next.has(branchId) ? next.delete(branchId) : next.add(branchId)
      return next
    })
  }

  function isBranchFullySelected(branchId) {
    const branchTopics = topics.filter(
      t => t.branch_id === branchId && (questionCounts[t.id] || 0) > 0
    )
    return branchTopics.length > 0 && branchTopics.every(t => selectedTopics.has(t.id))
  }

  async function startQuiz() {
    if (selectedTopics.size === 0 || totalSelectedQuestions === 0) return
    setQuizLoading(true)
    try {
      const topicIds = [...selectedTopics]
      const { data: qs } = await supabase
        .from('questions')
        .select('*')
        .in('topic_id', topicIds)
      setQuestions(fisherYates(qs || []))
      setCurrentIndex(0)
      setShowAnswer(false)
      setSelectedOption(null)
      setEliminatedOptions(new Set())
      setResults([])
      setPhase('quiz')
    } catch (err) {
      console.error('Quiz load error:', err)
    }
    setQuizLoading(false)
  }

  function toggleElimination(i) {
    setEliminatedOptions(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  function handleReveal() {
    setShowAnswer(true)
    setEliminatedOptions(new Set())
  }

  function handleSelfAssess(isCorrect) {
    const q = questions[currentIndex]
    const topic = topics.find(t => t.id === q.topic_id)
    const branchId = topic?.branch_id
    const newResults = [...results, { branchId, isCorrect, questionId: q.id }]
    setResults(newResults)

    if (currentIndex + 1 >= questions.length) {
      setPhase('summary')
    } else {
      setCurrentIndex(prev => prev + 1)
      setShowAnswer(false)
      setSelectedOption(null)
      setEliminatedOptions(new Set())
    }
  }

  if (phase === 'quiz') {
    const q = questions[currentIndex]
    const options = q?.options || []
    const correctIndex = q?.correct_answer
    return (
      <QuizScreen
        question={q}
        options={options}
        correctIndex={correctIndex}
        currentIndex={currentIndex}
        totalQuestions={questions.length}
        showAnswer={showAnswer}
        selectedOption={selectedOption}
        eliminatedOptions={eliminatedOptions}
        onSelectOption={i => !showAnswer && setSelectedOption(i)}
        onToggleElimination={toggleElimination}
        onReveal={handleReveal}
        onAssess={handleSelfAssess}
        onClose={() => navigate('/')}
      />
    )
  }

  if (phase === 'summary') {
    return (
      <SummaryScreen
        results={results}
        questions={questions}
        topics={topics}
        onRestart={() => {
          setPhase('filter')
          setResults([])
        }}
        onClose={() => navigate('/')}
      />
    )
  }

  // phase === 'filter'
  return (
    <Layout>
      <FilterScreen
        topics={topics}
        questionCounts={questionCounts}
        selectedTopics={selectedTopics}
        expandedBranches={expandedBranches}
        filterLoading={filterLoading}
        totalSelectedQuestions={totalSelectedQuestions}
        quizLoading={quizLoading}
        onToggleTopic={toggleTopic}
        onSelectBranch={selectBranchTopics}
        onDeselectBranch={deselectBranchTopics}
        onToggleBranch={toggleBranch}
        onStart={startQuiz}
        onBack={() => navigate('/')}
        isBranchFullySelected={isBranchFullySelected}
      />
    </Layout>
  )
}

// ─── FILTER SCREEN ────────────────────────────────────────────────────────────

function FilterScreen({
  topics, questionCounts, selectedTopics, expandedBranches,
  filterLoading, totalSelectedQuestions, quizLoading,
  onToggleTopic, onSelectBranch, onDeselectBranch, onToggleBranch,
  onStart, onBack, isBranchFullySelected,
}) {
  const selectedCount = selectedTopics.size

  if (filterLoading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[rgba(8,145,178,0.2)] border-t-[#0891b2] rounded-full animate-spin" />
          <p className="font-bebas text-gray-700 tracking-widest text-xs">KONULAR YÜKLENİYOR</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 sm:px-10 pb-32 pt-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center gap-4 mb-8"
      >
        <button
          onClick={onBack}
          className="p-2 text-gray-600 hover:text-white transition-colors flex-shrink-0"
          style={{ border: '1px solid #1a2d45', background: '#0d1e35' }}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1
            className="font-bebas text-white tracking-widest leading-none"
            style={{ fontSize: 'clamp(28px, 6vw, 52px)', transform: 'skewX(-4deg)', display: 'inline-block' }}
          >
            KARIŞIK SORU <span style={{ color: '#0891b2' }}>MODU</span>
          </h1>
          <p className="text-gray-600 text-[11px] uppercase tracking-[0.25em] mt-1">
            Konu seç · Soruları karıştır · Quiz'e başla
          </p>
        </div>
      </motion.div>

      {/* Selected summary banner */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 px-4 py-3 flex items-center justify-between"
            style={{
              background: 'rgba(8,145,178,0.08)',
              border: '1px solid rgba(8,145,178,0.25)',
              borderLeft: '4px solid #0891b2',
            }}
          >
            <span className="font-bebas text-[#0891b2] tracking-widest text-lg">
              {selectedCount} KONU SEÇİLDİ
            </span>
            <span className="font-bebas text-white tracking-wider text-xl">
              {totalSelectedQuestions} SORU
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Branch sections */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="space-y-[2px]"
      >
        {BRANCHES.map((branch, bi) => {
          const branchTopics = topics.filter(t => t.branch_id === branch.id)
          const isExpanded = expandedBranches.has(branch.id)
          const branchSelectedCount = branchTopics.filter(t => selectedTopics.has(t.id)).length
          const branchQuestionCount = branchTopics.reduce(
            (sum, t) => sum + (questionCounts[t.id] || 0), 0
          )

          return (
            <motion.div
              key={branch.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: bi * 0.04 }}
            >
              {/* Branch header row */}
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
                style={{
                  background: '#0d1e35',
                  borderLeft: `4px solid ${branch.color}`,
                  borderBottom: '1px solid #111',
                }}
                onClick={() => onToggleBranch(branch.id)}
              >
                <ChevronDown
                  size={13}
                  style={{
                    color: branch.color,
                    transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform 0.2s ease',
                    flexShrink: 0,
                  }}
                />
                <span className="font-bebas text-white tracking-widest text-lg flex-1 leading-none">
                  {branch.name.toUpperCase()}
                </span>
                <span className="text-[10px] uppercase tracking-wider flex-shrink-0" style={{ color: branch.color, opacity: 0.8 }}>
                  {branchSelectedCount}/{branchTopics.length} · {branchQuestionCount} soru
                </span>
                <div
                  className="flex gap-1.5 ml-2 flex-shrink-0"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    className="text-[10px] px-2 py-0.5 font-semibold uppercase tracking-wider transition-all hover:opacity-100"
                    style={{ border: `1px solid ${branch.color}50`, color: branch.color, background: `${branch.color}10`, opacity: 0.8 }}
                    onClick={() => onSelectBranch(branch.id)}
                  >
                    Tümü
                  </button>
                  <button
                    className="text-[10px] px-2 py-0.5 font-semibold uppercase tracking-wider transition-all hover:opacity-100"
                    style={{ border: '1px solid #2a2a2a', color: '#555', background: 'transparent', opacity: 0.8 }}
                    onClick={() => onDeselectBranch(branch.id)}
                  >
                    Kaldır
                  </button>
                </div>
              </div>

              {/* Topics list */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ background: '#0a1628', borderLeft: `4px solid ${branch.color}20`, borderBottom: '1px solid #111' }}>
                      {branchTopics.length === 0 ? (
                        <div className="px-6 py-3 text-gray-700 text-xs uppercase tracking-wider">Konu yok</div>
                      ) : (
                        branchTopics.map(topic => {
                          const count = questionCounts[topic.id] || 0
                          const isSelected = selectedTopics.has(topic.id)
                          const hasQuestions = count > 0

                          return (
                            <div
                              key={topic.id}
                              className="flex items-center gap-3 px-6 py-2.5 transition-all duration-150"
                              style={{
                                borderBottom: '1px solid #0f1f35',
                                opacity: hasQuestions ? 1 : 0.38,
                                background: isSelected ? `${branch.color}0a` : 'transparent',
                                cursor: hasQuestions ? 'pointer' : 'not-allowed',
                              }}
                              onClick={() => hasQuestions && onToggleTopic(topic.id)}
                            >
                              {/* Custom checkbox */}
                              <div
                                className="flex-shrink-0 flex items-center justify-center transition-all duration-150"
                                style={{
                                  width: 16,
                                  height: 16,
                                  border: `2px solid ${isSelected ? branch.color : '#2a2a2a'}`,
                                  background: isSelected ? branch.color : 'transparent',
                                  clipPath: 'polygon(0 0, calc(100% - 3px) 0, 100% 3px, 100% 100%, 3px 100%, 0 calc(100% - 3px))',
                                }}
                              >
                                {isSelected && (
                                  <Check size={10} strokeWidth={3} style={{ color: '#000' }} />
                                )}
                              </div>

                              <span
                                className="flex-1 text-sm leading-snug transition-colors duration-150"
                                style={{ color: isSelected ? '#e2e8f0' : '#555' }}
                              >
                                {topic.title}
                              </span>

                              <span
                                className="text-[10px] font-semibold flex-shrink-0"
                                style={{ color: hasQuestions ? branch.color : '#2a2a2a' }}
                              >
                                {count > 0 ? `${count} soru` : 'soru yok'}
                              </span>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Sticky BAŞLA button */}
      <div
        className="fixed bottom-0 left-0 right-0 p-5 flex justify-center"
        style={{ background: 'linear-gradient(to top, #0a1628 55%, transparent)', zIndex: 50 }}
      >
        <motion.button
          whileHover={totalSelectedQuestions > 0 ? { scale: 1.02 } : {}}
          whileTap={totalSelectedQuestions > 0 ? { scale: 0.97 } : {}}
          onClick={onStart}
          disabled={totalSelectedQuestions === 0 || quizLoading}
          className="w-full max-w-md flex items-center justify-center gap-3 py-4 font-bebas tracking-[0.22em] text-xl transition-all duration-200"
          style={{
            background: totalSelectedQuestions > 0 ? '#0891b2' : '#1a2d45',
            color: totalSelectedQuestions > 0 ? '#fff' : '#333',
            clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))',
            boxShadow: totalSelectedQuestions > 0 ? '0 8px 40px rgba(8,145,178,0.35)' : 'none',
            cursor: totalSelectedQuestions > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          {quizLoading ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              BAŞLA
              {totalSelectedQuestions > 0 && (
                <span style={{ opacity: 0.65, fontSize: '0.72em', marginLeft: 6 }}>
                  ({totalSelectedQuestions} soru)
                </span>
              )}
              <ChevronRight size={20} />
            </>
          )}
        </motion.button>
      </div>
    </div>
  )
}

// ─── QUIZ SCREEN ─────────────────────────────────────────────────────────────

function QuizScreen({
  question, options, correctIndex, currentIndex, totalQuestions,
  showAnswer, selectedOption, eliminatedOptions,
  onSelectOption, onToggleElimination, onReveal, onAssess, onClose,
}) {
  if (!question) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: '#0a1628' }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-5 py-3.5 flex-shrink-0 relative"
        style={{ borderBottom: '1px solid #1a2d45', background: '#0a1628' }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#0891b2]" />
        <div className="flex items-center gap-4 pl-3">
          <span
            className="font-bebas text-white tracking-[0.15em] text-lg"
            style={{ transform: 'skewX(-4deg)', display: 'inline-block' }}
          >
            DAVY'S <span className="text-[#0891b2]">DENTAL</span>
          </span>
          <span
            className="font-bebas text-[#0891b2] text-xs tracking-[0.2em] px-2 py-0.5"
            style={{ background: 'rgba(8,145,178,0.1)', border: '1px solid rgba(8,145,178,0.2)' }}
          >
            KARIŞIK MOD
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold">
            SORU {currentIndex + 1} / {totalQuestions}
          </span>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-white transition-colors"
            style={{ background: '#0d1e35', border: '1px solid #1a2d45' }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-[3px] flex-shrink-0" style={{ background: '#1a2d45' }}>
        <motion.div
          className="h-full bg-[#0891b2]"
          animate={{ width: `${(currentIndex / totalQuestions) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Question area */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id + '-' + showAnswer}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className="p-6 sm:p-10 max-w-2xl mx-auto w-full"
          >
            {/* Question text */}
            <div
              className="mb-7 p-5 relative"
              style={{ background: '#0d1e35', borderLeft: '4px solid #0891b2' }}
            >
              <p className="text-gray-100 text-base sm:text-lg leading-relaxed font-medium">
                {question.question_text}
              </p>
            </div>

            {/* Options */}
            {options.length > 0 && (
              <div className="space-y-2 mb-6">
                {options.map((opt, i) => {
                  const isEliminated = !showAnswer && eliminatedOptions.has(i)
                  let bg = '#111', borderColor = '#2a2a2a', textColor = '#aaa'

                  if (showAnswer) {
                    if (i === correctIndex) {
                      bg = 'rgba(16,185,129,0.1)'; borderColor = 'rgba(16,185,129,0.5)'; textColor = '#6ee7b7'
                    } else if (i === selectedOption && i !== correctIndex) {
                      bg = 'rgba(255,23,68,0.08)'; borderColor = 'rgba(255,23,68,0.4)'; textColor = '#ff8888'
                    } else {
                      bg = '#0a1628'; borderColor = '#1a2d45'; textColor = '#444'
                    }
                  } else if (i === selectedOption) {
                    bg = 'rgba(8,145,178,0.08)'; borderColor = '#0891b2'; textColor = '#67d9f0'
                  }

                  return (
                    <div key={i} style={{ display: 'flex', gap: '3px', alignItems: 'stretch' }}>
                      <motion.button
                        whileHover={!showAnswer ? { x: 4 } : {}}
                        whileTap={!showAnswer ? { scale: 0.99 } : {}}
                        onClick={() => onSelectOption(i)}
                        disabled={showAnswer}
                        className="flex-1 text-left px-4 py-3 flex items-start gap-3 transition-all duration-150 cursor-pointer disabled:cursor-default"
                        style={{
                          background: bg,
                          border: `1px solid ${borderColor}`,
                          borderLeft: `3px solid ${borderColor}`,
                          opacity: isEliminated ? 0.35 : 1,
                        }}
                      >
                        <span
                          className="text-xs font-semibold mt-0.5 w-5 flex-shrink-0"
                          style={{ color: textColor, opacity: 0.7 }}
                        >
                          {String.fromCharCode(65 + i)}.
                        </span>
                        <span
                          className="text-sm leading-relaxed"
                          style={{
                            color: textColor,
                            textDecoration: isEliminated ? 'line-through' : 'none',
                            textDecorationColor: '#0891b2',
                            textDecorationThickness: '2px',
                          }}
                        >
                          {opt}
                        </span>
                        {showAnswer && i === correctIndex && (
                          <span className="ml-auto text-emerald-400 flex-shrink-0">✓</span>
                        )}
                      </motion.button>
                      {!showAnswer && (
                        <button
                          onClick={() => onToggleElimination(i)}
                          className="w-7 flex-shrink-0 flex items-center justify-center text-[10px] transition-all duration-150"
                          style={{
                            background: isEliminated ? 'rgba(8,145,178,0.12)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${isEliminated ? 'rgba(8,145,178,0.5)' : '#1a2d45'}`,
                            color: isEliminated ? '#0891b2' : '#333',
                            fontWeight: 700,
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Explanation */}
            {showAnswer && question.explanation && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 mb-4"
                style={{ background: 'rgba(8,145,178,0.05)', borderLeft: '3px solid rgba(8,145,178,0.4)' }}
              >
                <p className="text-[10px] font-semibold text-[#0891b2] mb-1.5 uppercase tracking-[0.2em]">Açıklama</p>
                <p className="text-gray-400 text-sm leading-relaxed">{question.explanation}</p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom actions */}
      <div
        className="p-4 sm:p-6 flex-shrink-0"
        style={{ borderTop: '1px solid #1a2d45', background: '#0a1628' }}
      >
        {!showAnswer ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onReveal}
            className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 py-4 px-6 font-bebas tracking-[0.15em] text-base text-white"
            style={{
              background: '#0891b2',
              clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
              boxShadow: '0 4px 24px rgba(8,145,178,0.3)',
            }}
          >
            CEVABI GÖSTER
            <ChevronRight size={18} />
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-2 max-w-2xl mx-auto"
          >
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onAssess(true)}
              className="flex items-center justify-center gap-2 py-3.5 font-bebas tracking-[0.15em] text-base"
              style={{
                background: 'rgba(16,185,129,0.1)',
                border: '2px solid rgba(16,185,129,0.5)',
                color: '#6ee7b7',
                clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
              }}
            >
              <Check size={16} strokeWidth={2.5} />
              DOĞRU
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onAssess(false)}
              className="flex items-center justify-center gap-2 py-3.5 font-bebas tracking-[0.15em] text-base"
              style={{
                background: 'rgba(255,23,68,0.08)',
                border: '2px solid rgba(255,23,68,0.4)',
                color: '#ff8888',
                clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
              }}
            >
              <X size={16} strokeWidth={2.5} />
              YANLIŞ
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

// ─── SUMMARY SCREEN ───────────────────────────────────────────────────────────

function SummaryScreen({ results, questions, topics, onRestart, onClose }) {
  const correct = results.filter(r => r.isCorrect).length
  const total = results.length
  const wrong = total - correct
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0

  // Branch breakdown
  const branchStatsMap = {}
  BRANCHES.forEach(b => {
    branchStatsMap[b.id] = { correct: 0, total: 0, branch: b }
  })
  results.forEach(r => {
    if (r.branchId && branchStatsMap[r.branchId]) {
      branchStatsMap[r.branchId].total++
      if (r.isCorrect) branchStatsMap[r.branchId].correct++
    }
  })
  const activeBranches = Object.values(branchStatsMap).filter(s => s.total > 0)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ background: '#0a1628' }}
    >
      {/* Corner accents */}
      <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none" style={{ background: '#0891b2', opacity: 0.04, clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }} />
      <div className="absolute bottom-0 left-0 w-48 h-48 pointer-events-none" style={{ background: '#0891b2', opacity: 0.04, clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />

      <div className="min-h-full flex flex-col items-center justify-center p-6 py-20">
        {/* Victory header */}
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 20, delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-1">
            <Trophy size={22} style={{ color: '#f59e0b' }} />
            <h1
              className="font-bebas text-[#0891b2] tracking-widest leading-none"
              style={{ fontSize: 'clamp(44px, 9vw, 76px)', transform: 'skewX(-4deg)', display: 'inline-block' }}
            >
              TAMAMLANDI!
            </h1>
            <Trophy size={22} style={{ color: '#f59e0b' }} />
          </div>
          <p className="text-gray-600 text-[11px] uppercase tracking-[0.3em]">Karışık Soru Modu — Sonuçlar</p>
        </motion.div>

        {/* Big three stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 w-full max-w-lg mb-5"
          style={{ gap: '2px', background: '#0d1e35' }}
        >
          <div className="bg-[#0a1628] px-4 py-6 text-center relative">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-500" />
            <div className="font-bebas text-5xl text-emerald-400 leading-none">{correct}</div>
            <div className="text-[10px] text-gray-600 uppercase tracking-wider mt-1.5">Doğru</div>
          </div>
          <div className="bg-[#0a1628] px-4 py-6 text-center relative">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#0891b2]" />
            <div className="font-bebas text-5xl text-[#0891b2] leading-none">{percentage}%</div>
            <div className="text-[10px] text-gray-600 uppercase tracking-wider mt-1.5">Başarı</div>
          </div>
          <div className="bg-[#0a1628] px-4 py-6 text-center relative">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-red-500" />
            <div className="font-bebas text-5xl text-red-400 leading-none">{wrong}</div>
            <div className="text-[10px] text-gray-600 uppercase tracking-wider mt-1.5">Yanlış</div>
          </div>
        </motion.div>

        {/* Branch breakdown */}
        {activeBranches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full max-w-lg mb-8"
          >
            <div className="text-[10px] text-gray-700 uppercase tracking-[0.2em] mb-2 font-semibold px-1">
              Branş Bazında Sonuçlar
            </div>
            <div className="space-y-[2px]">
              {activeBranches.map(({ branch, correct: c, total: t }, i) => (
                <motion.div
                  key={branch.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.04 }}
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{ background: '#0d1e35', borderLeft: `3px solid ${branch.color}` }}
                >
                  <span className="flex-1 text-sm text-gray-500 leading-snug">{branch.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bebas text-lg leading-none" style={{ color: branch.color }}>
                      {c}/{t}
                    </span>
                    <span className="text-[10px] text-gray-600 w-9 text-right">
                      {t > 0 ? Math.round((c / t) * 100) : 0}%
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="flex gap-3 w-full max-w-lg"
        >
          <button
            onClick={onRestart}
            className="flex-1 py-3.5 font-bebas tracking-[0.15em] text-base text-gray-500 hover:text-white hover:border-[#0891b2] transition-all duration-200"
            style={{
              border: '1px solid #1a2d45',
              clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
            }}
          >
            YENİDEN BAŞLA
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3.5 font-bebas tracking-[0.15em] text-base text-white"
            style={{
              background: '#0891b2',
              clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
              boxShadow: '0 4px 24px rgba(8,145,178,0.3)',
            }}
          >
            ANA SAYFAYA DÖN
          </button>
        </motion.div>
      </div>
    </motion.div>
  )
}
