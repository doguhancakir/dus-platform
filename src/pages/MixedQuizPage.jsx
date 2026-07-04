import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { X, ChevronRight, ChevronDown, Trophy, ArrowLeft, Check, Zap, Shuffle, ListChecks, Layers } from 'lucide-react'
import { toast } from 'sonner'
import { supabase, fetchAllRows } from '../lib/supabase'
import { BRANCHES } from '../lib/data'
import Layout from '../components/Layout'
import { useStudyTimer } from '../contexts/StudyTimerContext'
import { useAuth } from '../contexts/AuthContext'

const SHAYLA_TOPIC_ID = 9109

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
  const location = useLocation()
  const { user } = useAuth()
  const { triggerQuestion } = useStudyTimer()
  const shaylaPreset = !!location.state?.shaylaPreset
  const [phase, setPhase] = useState(shaylaPreset ? 'shayla-source' : 'filter')
  const [shaylaSource, setShaylaSource] = useState(null) // 'attempted' | 'all'

  const [topics, setTopics] = useState([])
  const [questionCounts, setQuestionCounts] = useState({})
  const [selectedTopics, setSelectedTopics] = useState(new Set())
  const [expandedBranches, setExpandedBranches] = useState(new Set(BRANCHES.map(b => b.id)))
  const [filterLoading, setFilterLoading] = useState(true)

  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [selectedOption, setSelectedOption] = useState(null)
  const [eliminatedOptions, setEliminatedOptions] = useState(new Set())
  const [results, setResults] = useState([])
  const [quizLoading, setQuizLoading] = useState(false)

  const CHOICE_PHASES = ['filter', 'shayla-source', 'shayla-count']

  useEffect(() => {
    if (!shaylaPreset) loadFilterData()
    const handler = (e) => { if (e.key === 'Escape' && CHOICE_PHASES.includes(phase)) navigate('/') }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  async function loadFilterData() {
    setFilterLoading(true)
    try {
      const [{ data: topicsData }, questionData] = await Promise.all([
        supabase.from('topics').select('id, branch_id, title').order('sort_order'),
        fetchAllRows(q => q.from('questions').select('id, topic_id')),
      ])
      const counts = {}
      questionData?.forEach(q => { counts[q.topic_id] = (counts[q.topic_id] || 0) + 1 })
      setTopics(topicsData || [])
      setQuestionCounts(counts)
    } catch (err) {
      console.error('Filter load error:', err)
    }
    setFilterLoading(false)
  }

  function chooseShaylaSource(source) {
    setShaylaSource(source)
    setPhase('shayla-count')
  }

  async function startShaylaQuiz(limit) {
    setQuizLoading(true)
    try {
      const allQuestions = await fetchAllRows(q => q
        .from('questions').select('*').eq('topic_id', SHAYLA_TOPIC_ID)
      )
      let pool = allQuestions
      if (shaylaSource === 'attempted') {
        const attempted = await fetchAllRows(q => q
          .from('user_cards').select('question_id').eq('user_id', user.id)
        )
        const attemptedIds = new Set(attempted.map(c => c.question_id))
        pool = allQuestions.filter(q => attemptedIds.has(q.id))
      }
      if (pool.length === 0) {
        toast.error('Bu seçenekte henüz çözülmüş soru yok')
        setPhase('shayla-source')
        setQuizLoading(false)
        return
      }
      let shuffled = fisherYates(pool)
      if (limit) shuffled = shuffled.slice(0, limit)
      setQuestions(shuffled)
      setCurrentIndex(0)
      setShowAnswer(false)
      setSelectedOption(null)
      setEliminatedOptions(new Set())
      setResults([])
      setPhase('quiz')
    } catch (err) {
      console.error('Shayla quiz load error:', err)
    }
    setQuizLoading(false)
  }

  const totalSelectedQuestions = [...selectedTopics].reduce(
    (sum, id) => sum + (questionCounts[id] || 0), 0
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
    triggerQuestion()
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
        onRestart={() => { setPhase(shaylaPreset ? 'shayla-source' : 'filter'); setResults([]) }}
        onClose={() => navigate('/')}
      />
    )
  }

  if (phase === 'shayla-source') {
    return (
      <Layout>
        <ShaylaChoiceScreen
          eyebrow="Shayla · Loşimani"
          title="HANGİ SORULAR?"
          subtitle="Karışık çözmek için soru havuzunu seç"
          onBack={() => navigate(-1)}
          options={[
            {
              icon: ListChecks,
              label: 'Çözdüğün Sorular',
              desc: 'Daha önce cevapladığın sorular karışık sırayla',
              onClick: () => chooseShaylaSource('attempted'),
            },
            {
              icon: Layers,
              label: 'Tüm Sorular',
              desc: '1000 sorunun tamamından karışık',
              onClick: () => chooseShaylaSource('all'),
            },
          ]}
        />
      </Layout>
    )
  }

  if (phase === 'shayla-count') {
    return (
      <Layout>
        <ShaylaChoiceScreen
          eyebrow="Shayla · Loşimani"
          title="KAÇ SORU?"
          subtitle="Karışık soru sayısını seç"
          onBack={() => setPhase('shayla-source')}
          loading={quizLoading}
          options={[
            {
              icon: Zap,
              label: '50 Soru',
              desc: 'Havuzdan rastgele 50 soru',
              onClick: () => startShaylaQuiz(50),
            },
            {
              icon: Layers,
              label: 'Tüm Sorular',
              desc: 'Havuzdaki tüm sorular karışık',
              onClick: () => startShaylaQuiz(null),
            },
          ]}
        />
      </Layout>
    )
  }

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

// ─── SHAYLA CHOICE SCREEN (kaynak / soru sayısı seçimi) ─────────────────────────

function ShaylaChoiceScreen({ eyebrow, title, subtitle, onBack, options, loading }) {
  const accent = '#0ea5e9'
  return (
    <div className="px-6 sm:px-10 pb-36 pt-8 relative min-h-[70vh]">
      <div
        className="absolute top-0 right-0 pointer-events-none select-none"
        style={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: 'clamp(80px, 15vw, 160px)',
          color: `${accent}08`,
          letterSpacing: '0.05em',
          lineHeight: 1,
          paddingTop: '2rem',
          paddingRight: '1rem',
        }}
      >
        <Shuffle size={140} strokeWidth={1} />
      </div>

      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center gap-4 mb-10 relative z-10"
      >
        <button
          onClick={onBack}
          className="p-2 text-gray-600 hover:text-white transition-colors flex-shrink-0"
          style={{ border: '1px solid #1e3555', background: '#0d1a2e' }}
        >
          <ArrowLeft size={15} />
        </button>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-[3px] h-5" style={{ background: accent }} />
            <span
              className="font-barlow font-bold text-[10px] tracking-[0.22em] uppercase"
              style={{ color: accent }}
            >
              {eyebrow}
            </span>
          </div>
          <h1
            className="font-bebas text-white tracking-widest leading-none"
            style={{ fontSize: 'clamp(24px, 5vw, 48px)', transform: 'skewX(-4deg)', display: 'inline-block' }}
          >
            {title}
          </h1>
          <p
            className="font-barlow font-bold text-[10px] uppercase tracking-[0.22em] mt-1"
            style={{ color: '#2a3a50' }}
          >
            {subtitle}
          </p>
        </div>
      </motion.div>

      <div className="grid sm:grid-cols-2 gap-3 relative z-10 max-w-2xl">
        {options.map((opt, i) => {
          const Icon = opt.icon
          return (
            <motion.button
              key={opt.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={opt.onClick}
              disabled={loading}
              className="text-left p-5 flex flex-col gap-3 disabled:opacity-50 disabled:cursor-wait"
              style={{ background: '#0a1525', border: `1px solid ${accent}30`, borderLeft: `4px solid ${accent}` }}
            >
              <Icon size={20} style={{ color: accent }} />
              <div>
                <p className="font-bebas text-white tracking-wider text-xl leading-none mb-1">
                  {opt.label}
                </p>
                <p className="font-barlow text-gray-500 text-xs leading-relaxed">
                  {opt.desc}
                </p>
              </div>
            </motion.button>
          )
        })}
      </div>

      {loading && (
        <p className="font-barlow font-bold text-[10px] uppercase tracking-[0.25em] mt-6 relative z-10" style={{ color: accent }}>
          Sorular yükleniyor…
        </p>
      )}
    </div>
  )
}

// ─── FILTER SCREEN ─────────────────────────────────────────────────────────────

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
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-48 h-[2px] overflow-hidden" style={{ background: '#1a2d45' }}>
            <motion.div
              className="absolute inset-y-0 left-0 w-full bg-[#0891b2]"
              animate={{ scaleX: [0, 1, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', times: [0, 0.5, 1] }}
              style={{ transformOrigin: 'left' }}
            />
          </div>
          <p className="font-barlow font-bold text-[#0891b2] tracking-[0.25em] text-xs uppercase">
            KONULAR YÜKLENİYOR
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 sm:px-10 pb-36 pt-8 relative">
      {/* Background watermark */}
      <div
        className="absolute top-0 right-0 pointer-events-none select-none"
        style={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: 'clamp(80px, 15vw, 160px)',
          color: 'rgba(8,145,178,0.03)',
          letterSpacing: '0.05em',
          lineHeight: 1,
          paddingTop: '2rem',
          paddingRight: '1rem',
        }}
      >
        QUIZ
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center gap-4 mb-8 relative z-10"
      >
        <button
          onClick={onBack}
          className="p-2 text-gray-600 hover:text-white transition-colors flex-shrink-0"
          style={{ border: '1px solid #1e3555', background: '#0d1a2e' }}
        >
          <ArrowLeft size={15} />
        </button>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-[3px] h-5 bg-[#0891b2]" />
            <span
              className="font-barlow font-bold text-[10px] tracking-[0.22em] uppercase"
              style={{ color: '#0891b2' }}
            >
              Pratik Modu
            </span>
          </div>
          <h1
            className="font-bebas text-white tracking-widest leading-none"
            style={{ fontSize: 'clamp(24px, 5vw, 48px)', transform: 'skewX(-4deg)', display: 'inline-block' }}
          >
            KARIŞIK SORU <span style={{ color: '#0891b2' }}>MODU</span>
          </h1>
          <p
            className="font-barlow font-bold text-[10px] uppercase tracking-[0.22em] mt-1"
            style={{ color: '#2a3a50' }}
          >
            Konu seç · Soruları karıştır · Quiz'e başla
          </p>
        </div>
      </motion.div>

      {/* Selected banner */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ ease: [0.22, 1, 0.36, 1] }}
            className="mb-4 px-5 py-3.5 flex items-center justify-between relative overflow-hidden"
            style={{
              background: 'rgba(8,145,178,0.07)',
              borderLeft: '4px solid #0891b2',
              border: '1px solid rgba(8,145,178,0.2)',
              borderLeftWidth: 4,
              borderLeftColor: '#0891b2',
            }}
          >
            <div
              className="absolute right-0 top-0 bottom-0 pointer-events-none"
              style={{
                width: '30%',
                background: 'linear-gradient(to left, rgba(8,145,178,0.06), transparent)',
                clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0 100%)',
              }}
            />
            <div className="flex items-center gap-3">
              <span className="font-bebas text-[#0891b2] tracking-widest text-xl leading-none">
                {selectedCount} KONU SEÇİLDİ
              </span>
            </div>
            <span className="font-bebas text-white tracking-wider text-2xl leading-none">
              {totalSelectedQuestions}
              <span
                className="font-barlow font-bold text-[11px] uppercase tracking-wider ml-1"
                style={{ color: '#0891b2', verticalAlign: 'middle' }}
              >
                soru
              </span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Branch sections */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="space-y-[2px] relative z-10"
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
              initial={{ opacity: 0, x: -24, skewX: -2 }}
              animate={{ opacity: 1, x: 0, skewX: 0 }}
              transition={{ delay: bi * 0.04, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Branch header */}
              <div
                className="flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none relative"
                style={{
                  background: '#0a1525',
                  borderLeft: `4px solid ${branch.color}`,
                  transition: 'background 0.15s ease',
                }}
                onClick={() => onToggleBranch(branch.id)}
                onMouseEnter={e => e.currentTarget.style.background = '#0d1a2e'}
                onMouseLeave={e => e.currentTarget.style.background = '#0a1525'}
              >
                <ChevronDown
                  size={12}
                  style={{
                    color: branch.color,
                    transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform 0.2s ease',
                    flexShrink: 0,
                  }}
                />
                <span
                  className="font-bebas text-white tracking-widest flex-1 leading-none"
                  style={{ fontSize: 'clamp(14px, 2.5vw, 18px)' }}
                >
                  {branch.name.toUpperCase()}
                </span>
                <span
                  className="font-barlow font-bold text-[10px] uppercase tracking-wider flex-shrink-0"
                  style={{ color: branch.color, opacity: 0.8 }}
                >
                  {branchSelectedCount}/{branchTopics.length} · {branchQuestionCount} soru
                </span>
                <div
                  className="flex gap-1.5 ml-2 flex-shrink-0"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    className="font-barlow font-bold text-[10px] px-2 py-0.5 uppercase tracking-wider transition-all hover:opacity-100"
                    style={{
                      border: `1px solid ${branch.color}40`,
                      color: branch.color,
                      background: `${branch.color}0e`,
                      opacity: 0.8,
                    }}
                    onClick={() => onSelectBranch(branch.id)}
                  >
                    Tümü
                  </button>
                  <button
                    className="font-barlow font-bold text-[10px] px-2 py-0.5 uppercase tracking-wider transition-all hover:opacity-100"
                    style={{ border: '1px solid #1e3555', color: '#3a5070', background: 'transparent', opacity: 0.8 }}
                    onClick={() => onDeselectBranch(branch.id)}
                  >
                    Kaldır
                  </button>
                </div>
              </div>

              {/* Topics accordion */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ background: '#070e1a', borderLeft: `4px solid ${branch.color}18` }}>
                      {branchTopics.length === 0 ? (
                        <div
                          className="px-6 py-3 font-barlow font-bold text-[10px] uppercase tracking-wider"
                          style={{ color: '#1a2a3a' }}
                        >
                          Konu yok
                        </div>
                      ) : (
                        branchTopics.map(topic => {
                          const count = questionCounts[topic.id] || 0
                          const isSelected = selectedTopics.has(topic.id)
                          const hasQuestions = count > 0

                          return (
                            <motion.div
                              key={topic.id}
                              className="flex items-center gap-3 px-6 py-2.5 transition-all duration-150"
                              style={{
                                borderBottom: '1px solid #0d1525',
                                opacity: hasQuestions ? 1 : 0.3,
                                background: isSelected ? `${branch.color}0a` : 'transparent',
                                cursor: hasQuestions ? 'pointer' : 'not-allowed',
                              }}
                              whileHover={hasQuestions ? { x: 4 } : {}}
                              onClick={() => hasQuestions && onToggleTopic(topic.id)}
                            >
                              {/* Custom checkbox */}
                              <div
                                className="flex-shrink-0 flex items-center justify-center transition-all duration-150"
                                style={{
                                  width: 15,
                                  height: 15,
                                  border: `2px solid ${isSelected ? branch.color : '#1e3555'}`,
                                  background: isSelected ? branch.color : 'transparent',
                                  clipPath: 'polygon(0 0, calc(100% - 3px) 0, 100% 3px, 100% 100%, 3px 100%, 0 calc(100% - 3px))',
                                }}
                              >
                                {isSelected && <Check size={9} strokeWidth={3} style={{ color: '#000' }} />}
                              </div>

                              <span
                                className="flex-1 text-sm leading-snug transition-colors duration-150"
                                style={{ color: isSelected ? '#dde4f0' : '#3a5070' }}
                              >
                                {topic.title}
                              </span>

                              <span
                                className="font-barlow font-bold text-[10px] uppercase tracking-wider flex-shrink-0"
                                style={{ color: hasQuestions ? branch.color : '#1e3555' }}
                              >
                                {count > 0 ? `${count} soru` : 'yok'}
                              </span>
                            </motion.div>
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

      {/* Sticky START button */}
      <div
        className="fixed bottom-0 left-0 right-0 p-5 flex justify-center"
        style={{ background: 'linear-gradient(to top, #06101e 55%, transparent)', zIndex: 50 }}
      >
        <motion.button
          whileHover={totalSelectedQuestions > 0 ? { y: -3, boxShadow: '0 12px 48px rgba(8,145,178,0.45)' } : {}}
          whileTap={totalSelectedQuestions > 0 ? { scale: 0.97 } : {}}
          onClick={onStart}
          disabled={totalSelectedQuestions === 0 || quizLoading}
          className="w-full max-w-md flex items-center justify-center gap-3 py-4 font-bebas tracking-[0.22em] text-xl transition-all duration-200 relative overflow-hidden"
          style={{
            background: totalSelectedQuestions > 0
              ? 'linear-gradient(105deg, #0779a0, #0891b2)'
              : '#0d1a2e',
            color: totalSelectedQuestions > 0 ? '#fff' : '#1e3555',
            clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))',
            border: totalSelectedQuestions > 0 ? 'none' : '1px solid #1e3555',
            cursor: totalSelectedQuestions > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          {totalSelectedQuestions > 0 && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ x: '-100%', skewX: '-20deg' }}
              whileHover={{ x: '200%' }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{ background: 'rgba(255,255,255,0.08)', width: '60%' }}
            />
          )}
          {quizLoading ? (
            <div className="relative w-32 h-[2px] overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <motion.div
                className="absolute inset-y-0 left-0 w-full bg-white"
                animate={{ scaleX: [0, 1, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ transformOrigin: 'left' }}
              />
            </div>
          ) : (
            <>
              <Zap size={16} strokeWidth={2.5} />
              BAŞLA
              {totalSelectedQuestions > 0 && (
                <span
                  className="font-barlow font-bold text-[12px] uppercase tracking-wider ml-1"
                  style={{ opacity: 0.6 }}
                >
                  {totalSelectedQuestions} soru
                </span>
              )}
              <ChevronRight size={18} />
            </>
          )}
        </motion.button>
      </div>
    </div>
  )
}

// ─── QUIZ SCREEN ──────────────────────────────────────────────────────────────

function QuizScreen({
  question, options, correctIndex, currentIndex, totalQuestions,
  showAnswer, selectedOption, eliminatedOptions,
  onSelectOption, onToggleElimination, onReveal, onAssess, onClose,
}) {
  if (!question) return null

  const answerState = showAnswer && selectedOption !== null
    ? (selectedOption === correctIndex ? 'correct' : 'wrong')
    : 'neutral'

  const accentColor = answerState === 'correct'
    ? '#10b981'
    : answerState === 'wrong'
    ? '#ff1744'
    : '#0891b2'

  const progress = currentIndex / totalQuestions

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: '#06101e' }}
    >
      {/* Background diagonal */}
      <div
        className="absolute top-0 right-0 bottom-0 pointer-events-none"
        style={{
          width: '40%',
          background: `linear-gradient(to left, ${accentColor}03, transparent)`,
          clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 60% 100%)',
          transition: 'background 0.5s ease',
        }}
      />
      {/* Scan-lines */}
      <div className="absolute inset-0 pointer-events-none p5-scanlines" style={{ opacity: 0.25 }} />

      <div className="relative z-10 flex flex-col h-full">
        {/* HUD Bar */}
        <div
          className="flex items-center justify-between px-4 sm:px-6 py-3 flex-shrink-0 relative"
          style={{
            borderBottom: `1px solid ${accentColor}20`,
            background: 'rgba(4,8,18,0.9)',
            transition: 'border-color 0.4s ease',
          }}
        >
          <motion.div
            className="absolute left-0 top-0 bottom-0 w-[3px]"
            animate={{ background: accentColor }}
            transition={{ duration: 0.4 }}
          />
          <div className="flex items-center gap-3 pl-2">
            <span
              className="font-bebas text-white tracking-[0.15em] text-lg leading-none"
              style={{ transform: 'skewX(-4deg)', display: 'inline-block' }}
            >
              DAVY'S <span style={{ color: accentColor, transition: 'color 0.4s' }}>DENTAL</span>
            </span>
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1"
              style={{
                background: `${accentColor}12`,
                border: `1px solid ${accentColor}25`,
                transition: 'all 0.4s ease',
              }}
            >
              <Zap size={9} color={accentColor} strokeWidth={2.5} />
              <span
                className="font-barlow font-bold text-[10px] tracking-[0.18em] uppercase"
                style={{ color: accentColor, transition: 'color 0.4s' }}
              >
                KARIŞIK MOD
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="font-bebas text-white tracking-[0.12em] text-base leading-none px-2 py-0.5"
              style={{ background: '#0d1a2e', border: '1px solid #1e3555' }}
            >
              <span style={{ color: accentColor, transition: 'color 0.4s' }}>{currentIndex + 1}</span>
              <span className="text-gray-700 text-sm">/{totalQuestions}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-600 hover:text-white transition-colors"
              style={{ border: '1px solid #1e3555', background: '#0d1a2e' }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-[3px] flex-shrink-0 relative" style={{ background: '#0d1a2e' }}>
          <motion.div
            className="h-full"
            animate={{ width: `${progress * 100}%`, background: accentColor }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2"
            animate={{ left: `calc(${progress * 100}% - 4px)`, background: accentColor }}
            transition={{ duration: 0.5 }}
            style={{
              boxShadow: `0 0 8px ${accentColor}`,
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
            }}
          />
        </div>

        {/* Question area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={question.id + '-' + showAnswer}
              initial={{ opacity: 0, x: 40, skewX: 3 }}
              animate={{ opacity: 1, x: 0, skewX: 0 }}
              exit={{ opacity: 0, x: -40, skewX: -3 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-2xl mx-auto w-full px-5 sm:px-8 pt-6 pb-4 relative"
            >
              {/* Watermark */}
              <div
                className="absolute top-0 right-0 pointer-events-none select-none overflow-hidden"
                style={{
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: 'clamp(80px, 16vw, 140px)',
                  color: `${accentColor}05`,
                  letterSpacing: '0.05em',
                  lineHeight: 1,
                  transition: 'color 0.5s ease',
                  zIndex: 0,
                }}
              >
                SORU
              </div>

              {/* Question */}
              <div className="relative z-10 mb-6">
                <div className="mb-3">
                  <span
                    className="font-barlow font-bold text-[10px] tracking-[0.2em] uppercase px-2 py-0.5"
                    style={{
                      color: accentColor,
                      background: `${accentColor}12`,
                      border: `1px solid ${accentColor}28`,
                      transition: 'all 0.4s ease',
                    }}
                  >
                    SORU {currentIndex + 1}
                  </span>
                </div>

                <motion.div
                  className="relative overflow-hidden"
                  animate={{ borderLeftColor: accentColor }}
                  transition={{ duration: 0.4 }}
                  style={{
                    background: '#080f1e',
                    borderLeft: `4px solid ${accentColor}`,
                    padding: '1.25rem 1.5rem',
                    transition: 'border-left-color 0.4s ease',
                    clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)',
                  }}
                >
                  <motion.div
                    key={question.id}
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `linear-gradient(105deg, transparent 0%, ${accentColor}15 50%, transparent 100%)`,
                      transform: 'translateX(-100%) skewX(-20deg)',
                    }}
                    animate={{ transform: ['translateX(-100%) skewX(-20deg)', 'translateX(300%) skewX(-20deg)'] }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                  <p className="text-gray-100 text-base sm:text-lg leading-relaxed font-medium relative z-10">
                    {question.question_text}
                  </p>
                </motion.div>
              </div>

              {/* Options */}
              {options.length > 0 && (
                <div className="space-y-[3px] mb-5 relative z-10">
                  {options.map((opt, i) => {
                    const isEliminated = !showAnswer && eliminatedOptions.has(i)
                    const isSelected = i === selectedOption
                    const isCorrect = showAnswer && i === correctIndex
                    const isWrong = showAnswer && isSelected && i !== correctIndex

                    let bg = 'rgba(8,14,24,0.6)'
                    let borderLeft = '#1a2d45'
                    let textColor = '#6a7a90'
                    let labelColor = '#3a4a60'

                    if (isCorrect) {
                      bg = 'rgba(16,185,129,0.08)'; borderLeft = '#10b981'; textColor = '#6ee7b7'; labelColor = '#10b981'
                    } else if (isWrong) {
                      bg = 'rgba(255,23,68,0.07)'; borderLeft = '#ff1744'; textColor = '#ff8888'; labelColor = '#ff1744'
                    } else if (!showAnswer && isSelected) {
                      bg = `${accentColor}10`; borderLeft = accentColor; textColor = '#c8e8f4'; labelColor = accentColor
                    } else if (showAnswer) {
                      bg = '#050c18'; borderLeft = '#111e30'; textColor = '#2a3a50'; labelColor = '#1a2a3a'
                    }

                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="flex gap-[3px] items-stretch"
                      >
                        <motion.button
                          whileHover={!showAnswer ? { x: 6, transition: { duration: 0.1 } } : {}}
                          whileTap={!showAnswer ? { scale: 0.99 } : {}}
                          onClick={() => onSelectOption(i)}
                          disabled={showAnswer}
                          className="flex-1 text-left flex items-start gap-3 transition-all duration-200 cursor-pointer disabled:cursor-default relative overflow-hidden"
                          style={{
                            background: bg,
                            borderLeft: `3px solid ${borderLeft}`,
                            padding: '0.75rem 1rem',
                            opacity: isEliminated ? 0.28 : 1,
                            transition: 'background 0.25s ease, border-color 0.25s ease',
                          }}
                        >
                          <span
                            className="font-barlow font-bold text-[11px] mt-0.5 w-5 flex-shrink-0 tracking-wider"
                            style={{ color: labelColor, transition: 'color 0.25s ease' }}
                          >
                            {String.fromCharCode(65 + i)}.
                          </span>
                          <span
                            className="text-sm leading-relaxed flex-1"
                            style={{
                              color: textColor,
                              textDecoration: isEliminated ? 'line-through' : 'none',
                              textDecorationColor: '#0891b2',
                              transition: 'color 0.25s ease',
                            }}
                          >
                            {opt}
                          </span>
                          {isCorrect && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                              className="ml-auto flex-shrink-0 text-[#10b981] font-bold"
                            >
                              ✓
                            </motion.span>
                          )}
                          {isWrong && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                              className="ml-auto flex-shrink-0 text-[#ff1744]"
                            >
                              ✗
                            </motion.span>
                          )}
                        </motion.button>

                        {!showAnswer && (
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onToggleElimination(i)}
                            className="w-8 flex-shrink-0 flex items-center justify-center text-[10px] font-bold transition-all duration-150"
                            style={{
                              background: isEliminated ? 'rgba(8,145,178,0.15)' : 'rgba(255,255,255,0.02)',
                              border: `1px solid ${isEliminated ? 'rgba(8,145,178,0.5)' : '#1a2d45'}`,
                              color: isEliminated ? '#0891b2' : '#2a3a50',
                            }}
                          >
                            ✕
                          </motion.button>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              )}

              {/* Explanation */}
              <AnimatePresence>
                {showAnswer && question.explanation && (
                  <motion.div
                    initial={{ opacity: 0, y: 12, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="relative z-10"
                    style={{
                      background: 'rgba(8,145,178,0.05)',
                      borderLeft: '3px solid rgba(8,145,178,0.35)',
                      padding: '0.9rem 1.1rem',
                      marginBottom: '0.5rem',
                      clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)',
                    }}
                  >
                    <p
                      className="font-barlow font-bold text-[#0891b2] mb-1.5 uppercase tracking-[0.2em]"
                      style={{ fontSize: '10px' }}
                    >
                      Açıklama
                    </p>
                    <p className="text-gray-400 text-sm leading-relaxed">{question.explanation}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom command strip */}
        <div
          className="flex-shrink-0 relative"
          style={{
            borderTop: `1px solid ${accentColor}20`,
            background: '#060d1a',
            transition: 'border-color 0.4s ease',
          }}
        >
          <motion.div
            className="absolute top-0 left-0 h-[2px]"
            animate={{ width: showAnswer ? '100%' : '0%', background: accentColor }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />

          <div className="p-4 sm:p-5">
            <AnimatePresence mode="wait">
              {!showAnswer ? (
                <motion.button
                  key="reveal"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onReveal}
                  className="w-full max-w-lg mx-auto flex items-center justify-center gap-3 py-4 px-8 font-bebas tracking-[0.2em] text-lg text-white block relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(105deg, #0779a0, #0891b2)',
                    clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))',
                    boxShadow: '0 4px 32px rgba(8,145,178,0.35)',
                  }}
                >
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    initial={{ x: '-100%', skewX: '-20deg' }}
                    whileHover={{ x: '200%' }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    style={{ background: 'rgba(255,255,255,0.1)', width: '60%' }}
                  />
                  CEVABI GÖSTER
                  <ChevronRight size={20} strokeWidth={2.5} />
                </motion.button>
              ) : (
                <motion.div
                  key="assess"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="grid grid-cols-2 gap-[3px] max-w-2xl mx-auto"
                >
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => onAssess(true)}
                    className="flex items-center justify-center gap-2 py-4 font-bebas tracking-[0.18em] text-base relative overflow-hidden"
                    style={{
                      background: 'rgba(16,185,129,0.1)',
                      border: '1px solid rgba(16,185,129,0.3)',
                      borderTop: '2px solid #10b981',
                      color: '#6ee7b7',
                      clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
                    }}
                  >
                    <Check size={15} strokeWidth={2.5} />
                    DOĞRU
                  </motion.button>
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => onAssess(false)}
                    className="flex items-center justify-center gap-2 py-4 font-bebas tracking-[0.18em] text-base relative overflow-hidden"
                    style={{
                      background: 'rgba(255,23,68,0.08)',
                      border: '1px solid rgba(255,23,68,0.25)',
                      borderTop: '2px solid #ff1744',
                      color: '#ff8888',
                      clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
                    }}
                  >
                    <X size={15} strokeWidth={2.5} />
                    YANLIŞ
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
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

  const branchStatsMap = {}
  BRANCHES.forEach(b => { branchStatsMap[b.id] = { correct: 0, total: 0, branch: b } })
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
      style={{ background: '#06101e' }}
    >
      {/* Background accents */}
      <div
        className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
        style={{ background: '#0891b2', opacity: 0.04, clipPath: 'polygon(100% 0, 100% 100%, 0 0)' }}
      />
      <div
        className="absolute bottom-0 left-0 w-64 h-64 pointer-events-none"
        style={{ background: '#10b981', opacity: 0.04, clipPath: 'polygon(0 0, 100% 100%, 0 100%)' }}
      />
      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none p5-scanlines" style={{ opacity: 0.2 }} />

      {/* Watermark */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        style={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: 'clamp(100px, 18vw, 200px)',
          color: 'rgba(8,145,178,0.025)',
          letterSpacing: '0.05em',
          lineHeight: 1,
        }}
      >
        SONUÇ
      </div>

      <div className="min-h-full flex flex-col items-center justify-center p-6 py-20 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.05 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <Trophy size={20} style={{ color: '#f0c040' }} />
            <h1
              className="font-bebas text-[#0891b2] tracking-widest leading-none"
              style={{ fontSize: 'clamp(42px, 9vw, 72px)', transform: 'skewX(-4deg)', display: 'inline-block' }}
            >
              TAMAMLANDI!
            </h1>
            <Trophy size={20} style={{ color: '#f0c040' }} />
          </div>
          <p
            className="font-barlow font-bold text-[11px] uppercase tracking-[0.28em]"
            style={{ color: '#2a3a50' }}
          >
            Karışık Soru Modu — Sonuçlar
          </p>
        </motion.div>

        {/* Big three stats */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-3 w-full max-w-lg mb-5"
          style={{ gap: '2px' }}
        >
          {[
            { label: 'DOĞRU', value: correct, color: '#10b981' },
            { label: 'BAŞARI', value: `${percentage}%`, color: '#0891b2' },
            { label: 'YANLIŞ', value: wrong, color: '#ff1744' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="relative px-4 py-6 text-center"
              style={{ background: '#080f1e' }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: s.color }} />
              <div
                className="font-bebas leading-none mb-1.5"
                style={{ fontSize: 'clamp(36px, 7vw, 52px)', color: s.color }}
              >
                {s.value}
              </div>
              <div
                className="font-barlow font-bold uppercase tracking-wider"
                style={{ fontSize: '9px', color: '#2a3a50' }}
              >
                {s.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Branch breakdown */}
        {activeBranches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full max-w-lg mb-8"
          >
            <div
              className="font-barlow font-bold text-[10px] uppercase tracking-[0.22em] mb-2 px-1"
              style={{ color: '#1e3555' }}
            >
              Branş Bazında Sonuçlar
            </div>
            <div className="space-y-[2px]">
              {activeBranches.map(({ branch, correct: c, total: t }, i) => (
                <motion.div
                  key={branch.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-4 px-4 py-2.5"
                  style={{ background: '#0a1525', borderLeft: `3px solid ${branch.color}` }}
                >
                  <span className="flex-1 text-sm leading-snug" style={{ color: '#4a6080' }}>
                    {branch.name}
                  </span>
                  {/* Mini progress */}
                  <div className="hidden sm:block flex-1 max-w-24 h-[2px]" style={{ background: '#1a2d45' }}>
                    <div
                      className="h-full transition-all duration-700"
                      style={{ width: `${t > 0 ? (c / t) * 100 : 0}%`, background: branch.color }}
                    />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className="font-bebas leading-none"
                      style={{ fontSize: '1.3rem', color: branch.color }}
                    >
                      {c}/{t}
                    </span>
                    <span
                      className="font-barlow font-bold text-[10px] uppercase tracking-wider"
                      style={{ color: '#1e3555' }}
                    >
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
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="flex gap-[3px] w-full max-w-lg"
        >
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={onRestart}
            className="flex-1 py-4 font-bebas tracking-[0.18em] text-base transition-all duration-200"
            style={{
              border: '1px solid #1e3555',
              color: '#3a5070',
              clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#0891b2'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e3555'; e.currentTarget.style.color = '#3a5070' }}
          >
            YENİDEN BAŞLA
          </motion.button>
          <motion.button
            whileHover={{ y: -2, boxShadow: '0 8px 32px rgba(8,145,178,0.4)' }}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className="flex-1 py-4 font-bebas tracking-[0.18em] text-base text-white relative overflow-hidden"
            style={{
              background: 'linear-gradient(105deg, #0779a0, #0891b2)',
              clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
            }}
          >
            ANA SAYFAYA DÖN
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  )
}
