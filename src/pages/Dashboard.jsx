import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { BRANCHES } from '../lib/data'
import Layout from '../components/Layout'
import { SkeletonBranchCard } from '../components/SkeletonCard'
import ToothViewer from '../components/ToothViewer'
import DailyCalendar from '../components/DailyCalendar'

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}

const cardVariants = {
  hidden: { opacity: 0, x: -60, skewX: -4 },
  show: {
    opacity: 1,
    x: 0,
    skewX: 0,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
  },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [branchStats, setBranchStats] = useState({})
  const [todayAnswered, setTodayAnswered] = useState(0)
  const [totalGraduated, setTotalGraduated] = useState(0)
  const [loading, setLoading] = useState(!!user)
  const [hoveredId, setHoveredId] = useState(null)
  const [branchImages, setBranchImages] = useState({})
  const [showModel, setShowModel] = useState(false)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    loadBranchImages()
    if (user) {
      setLoading(true)
      loadStats()
    } else {
      setLoading(false)
      setBranchStats({})
    }
  }, [user?.id])

  async function loadBranchImages() {
    try {
      const { data } = await supabase.from('branch_images').select('branch_id, image_url')
      if (data) {
        const map = {}
        data.forEach(r => { map[r.branch_id] = r.image_url })
        setBranchImages(map)
      }
    } catch {
      // Table may not exist yet
    }
  }

  async function loadStats() {
    try {
      const { data: topics } = await supabase.from('topics').select('id, branch_id')
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
      questions?.forEach(q => { questionBranchMap[q.id] = q.topics?.branch_id })

      const branchDue = {}
      dueCards?.forEach(c => {
        const branchId = questionBranchMap[c.question_id]
        if (branchId) branchDue[branchId] = (branchDue[branchId] || 0) + 1
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

      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const { data: todayCards } = await supabase
        .from('user_cards')
        .select('question_id')
        .eq('user_id', user.id)
        .gte('last_review', todayStart.toISOString())

      const { data: graduatedCards } = await supabase
        .from('user_cards')
        .select('question_id')
        .eq('user_id', user.id)
        .eq('status', 'review')

      setBranchStats(stats)
      setTodayAnswered(todayCards?.length || 0)
      setTotalGraduated(graduatedCards?.length || 0)

      // ── Streak: consecutive days with ≥50 reviewed cards ──────────────
      const { data: reviewHistory } = await supabase
        .from('user_cards')
        .select('last_review')
        .eq('user_id', user.id)
        .not('last_review', 'is', null)
        .gte('last_review', new Date(Date.now() - 90 * 86400000).toISOString())

      const dayCounts = {}
      reviewHistory?.forEach(c => {
        if (!c.last_review) return
        const day = c.last_review.split('T')[0]
        dayCounts[day] = (dayCounts[day] || 0) + 1
      })

      const todayStr = new Date().toISOString().split('T')[0]
      const yestStr  = new Date(Date.now() - 86400000).toISOString().split('T')[0]

      // Find the most recent qualifying day to start counting from
      let startDateStr = null
      if ((dayCounts[todayStr] || 0) >= 50) startDateStr = todayStr
      else if ((dayCounts[yestStr] || 0) >= 50) startDateStr = yestStr

      let computedStreak = 0
      if (startDateStr) {
        let d = new Date(startDateStr)
        while (true) {
          const k = d.toISOString().split('T')[0]
          if ((dayCounts[k] || 0) >= 50) {
            computedStreak++
            d = new Date(d.getTime() - 86400000)
          } else break
        }
      }
      // Need ≥2 consecutive days to "restart" after a break
      setStreak(computedStreak >= 2 ? computedStreak : 0)
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
      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden"
        style={{ borderBottom: '1px solid #1a2d45' }}
      >
        {/* Left teal stripe */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#0891b2] z-10" />
        {/* Faint grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(8,145,178,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(8,145,178,0.02) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* ── Two-column layout ── */}
        <div className="flex flex-col lg:flex-row">

          {/* LEFT — title block (55%) */}
          <div
            className="relative flex flex-col justify-end px-6 sm:px-10 pt-16 pb-10 lg:pb-12"
            style={{ flexBasis: '55%', minHeight: '52vh' }}
          >
            {/* Watermark */}
            <div
              className="absolute bottom-0 right-0 pointer-events-none select-none leading-none"
              style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: 'clamp(80px, 14vw, 180px)',
                color: 'rgba(8,145,178,0.04)',
                letterSpacing: '0.05em',
                lineHeight: 0.85,
              }}
            >
              DUS
            </div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10"
            >
              {/* Eyebrow */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                className="mb-3"
              >
                <span
                  className="font-barlow font-bold text-[10px] tracking-[0.3em] uppercase px-2.5 py-1"
                  style={{
                    color: '#0891b2',
                    background: 'rgba(8,145,178,0.1)',
                    border: '1px solid rgba(8,145,178,0.2)',
                  }}
                >
                  DUS Hazırlık Platformu
                </span>
              </motion.div>

              <h1
                className="font-bebas text-white leading-[0.86] tracking-wider"
                style={{
                  fontSize: 'clamp(52px, 9vw, 128px)',
                  transform: 'skewX(-4deg)',
                  display: 'inline-block',
                }}
              >
                DAVY'S{' '}
                <span style={{ color: '#0891b2' }}>DENTAL</span>
              </h1>

              {user ? (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.28 }}
                  className="mt-4 flex items-baseline gap-2 flex-wrap"
                >
                  <span className="font-barlow font-bold text-[11px] tracking-[0.2em] uppercase text-gray-600">
                    HOŞ GELDİN,
                  </span>
                  <span
                    className="font-bebas text-[#0891b2] tracking-widest"
                    style={{ fontSize: '1.5rem', transform: 'skewX(-3deg)', display: 'inline-block' }}
                  >
                    {user.nickname.toUpperCase()}
                  </span>
                  {streak > 0 && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.45, type: 'spring', stiffness: 300 }}
                      className="flex items-center gap-1 font-barlow font-bold text-[11px] tracking-[0.12em] uppercase px-2 py-0.5"
                      style={{
                        background: 'rgba(240,192,64,0.1)',
                        border: '1px solid rgba(240,192,64,0.3)',
                        color: '#f0c040',
                        clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)',
                      }}
                    >
                      <span style={{ fontSize: '0.85rem' }}>🦷</span>
                      {streak} GÜN
                    </motion.span>
                  )}
                </motion.div>
              ) : (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.28 }}
                  className="font-barlow font-bold text-gray-600 text-[11px] uppercase tracking-[0.3em] mt-4"
                >
                  Diş Hekimliği Uzmanlık Sınavı Hazırlık Platformu
                </motion.p>
              )}
            </motion.div>

            {/* Buttons row */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 relative z-10 flex flex-col gap-2"
            >
              {/* Notlarım */}
              {user && (
                <button
                  onClick={() => navigate('/notes')}
                  className="flex items-center gap-3 font-barlow font-bold text-[11px] tracking-[0.22em] uppercase px-5 py-3 transition-all duration-200 w-fit"
                  style={{
                    color: '#f0c040',
                    background: 'rgba(240,192,64,0.06)',
                    border: '1px solid rgba(240,192,64,0.25)',
                    clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(240,192,64,0.14)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(240,192,64,0.06)'}
                >
                  <span style={{ fontSize: '1rem' }}>📓</span>
                  Notlarım
                  <span style={{ opacity: 0.5 }}>→</span>
                </button>
              )}

              {/* 3D Model Button */}
              <button
                onClick={() => setShowModel(true)}
                className="group flex items-center gap-3 font-barlow font-bold text-[11px] tracking-[0.22em] uppercase px-5 py-3 transition-all duration-200 w-fit"
                style={{
                  color: '#0891b2',
                  background: 'rgba(8,145,178,0.08)',
                  border: '1px solid rgba(8,145,178,0.3)',
                  clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(8,145,178,0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(8,145,178,0.08)'}
              >
                <span style={{ fontSize: '1rem' }}>◈</span>
                3D Dişlenme Modeli
                <span style={{ opacity: 0.5 }}>→</span>
              </button>
            </motion.div>
          </div>

          {/* ── RIGHT — daily calendar (45%) ── */}
          {user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="relative hidden lg:flex flex-col"
              style={{
                flexBasis: '45%',
                borderLeft: '1px solid #1a2d45',
                minHeight: '52vh',
              }}
            >
              {/* Subtle grid overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(8,145,178,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(8,145,178,0.012) 1px, transparent 1px)',
                  backgroundSize: '28px 28px',
                }}
              />
              {/* Corner label */}
              <div className="absolute top-3 right-4 z-10">
                <span
                  className="font-barlow font-bold text-[7px] tracking-[0.35em] uppercase"
                  style={{ color: '#1a2d45' }}
                >
                  PLANLAYICI
                </span>
              </div>
              {/* Calendar widget */}
              <div className="relative z-10 flex-1 flex flex-col">
                <DailyCalendar userId={user.id} todayAnswered={todayAnswered} isAdmin={!!user.is_admin} />
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── STATS HUD BAND ── */}
      {user && !loading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-2 md:grid-cols-4"
          style={{ background: '#080f1e', borderBottom: '1px solid #1a2d45', gap: '1px' }}
        >
          {[
            { label: 'BUGÜN ÇÖZÜLEN SORU', value: todayAnswered, color: '#0891b2' },
            { label: 'TOPLAM ÇÖZÜLEN SORU', value: totalGraduated, color: '#f0c040' },
            { label: 'TAMAMLANAN KONU', value: completedTopics, color: '#10b981' },
            { label: 'GENEL İLERLEME', value: `${overallProgress}%`, color: '#0891b2' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden px-5 sm:px-7 py-5"
              style={{ background: '#0a1628' }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: stat.color }} />
              {/* Diagonal accent bg */}
              <div
                className="absolute right-0 top-0 bottom-0 w-12 pointer-events-none"
                style={{
                  background: `${stat.color}06`,
                  clipPath: 'polygon(40% 0, 100% 0, 100% 100%, 0 100%)',
                }}
              />
              <div
                className="font-bebas leading-none tracking-wider relative z-10"
                style={{ fontSize: 'clamp(28px, 5vw, 42px)', color: stat.color }}
              >
                {stat.value}
              </div>
              <div
                className="font-barlow font-bold text-gray-600 uppercase tracking-[0.15em] mt-1 relative z-10"
                style={{ fontSize: '9px' }}
              >
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── CTA BANNER (not logged in) ── */}
      {!user && (
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="mx-6 sm:mx-10 mt-8 mb-2 relative overflow-hidden"
          style={{
            background: '#080f1e',
            borderLeft: '4px solid #0891b2',
            border: '1px solid #1a2d45',
            borderLeftWidth: 4,
            borderLeftColor: '#0891b2',
          }}
        >
          <div
            className="absolute right-0 top-0 bottom-0 pointer-events-none"
            style={{
              width: '30%',
              background: 'linear-gradient(to left, rgba(8,145,178,0.05), transparent)',
              clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0 100%)',
            }}
          />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4 relative z-10">
            <div>
              <p className="font-bebas text-lg sm:text-xl text-white tracking-widest">
                HESAP OLUŞTUR, İLERLEMENİ TAKİP ET
              </p>
              <p className="font-barlow font-bold text-gray-600 text-[11px] mt-1 uppercase tracking-wider">
                Konuları işaretle, tekrar kartlarını yönet
              </p>
            </div>
            <Link
              to="/register"
              className="flex-shrink-0 font-barlow font-bold tracking-[0.15em] text-xs text-white uppercase px-6 py-3 transition-all"
              style={{
                background: '#0891b2',
                clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#0779a0'; e.currentTarget.style.boxShadow = '0 0 24px rgba(8,145,178,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#0891b2'; e.currentTarget.style.boxShadow = 'none' }}
            >
              KAYIT OL
            </Link>
          </div>
        </motion.div>
      )}

      {/* ── MIXED QUIZ CTA ── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="px-6 sm:px-10 mt-6 mb-4"
      >
        <Link to="/mixed-quiz" className="block group">
          <motion.div
            whileHover={{ scale: 1.006 }}
            transition={{ duration: 0.2 }}
            className="relative overflow-hidden"
            style={{
              background: 'linear-gradient(105deg, #080f1e 0%, #0a1628 60%, #06101a 100%)',
              borderLeft: '4px solid #0891b2',
              border: '1px solid #1a2d45',
              borderLeftWidth: 4,
              borderLeftColor: '#0891b2',
            }}
          >
            {/* Diagonal background */}
            <div
              className="absolute right-0 top-0 bottom-0 pointer-events-none"
              style={{
                width: '35%',
                background: 'linear-gradient(to left, rgba(8,145,178,0.07), transparent)',
                clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0 100%)',
              }}
            />

            {/* Arrow tab — right edge */}
            <motion.div
              className="absolute right-0 top-0 bottom-0 w-14 flex items-center justify-center"
              style={{
                background: '#0891b2',
                clipPath: 'polygon(18px 0, 100% 0, 100% 100%, 0 100%)',
              }}
              whileHover={{ width: 80 }}
              transition={{ duration: 0.2 }}
            >
              <span
                className="font-bebas text-white text-xl pl-3 select-none"
                style={{ letterSpacing: '0.05em' }}
              >
                →
              </span>
            </motion.div>

            <div className="flex items-center gap-5 px-5 sm:px-7 py-5 pr-20 relative z-10">
              {/* Icon */}
              <div
                className="flex-shrink-0 w-11 h-11 flex items-center justify-center font-bebas text-xl"
                style={{
                  background: 'rgba(8,145,178,0.12)',
                  border: '1px solid rgba(8,145,178,0.3)',
                  color: '#0891b2',
                  clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
                }}
              >
                ✦
              </div>

              <div className="flex-1 min-w-0">
                <div
                  className="font-bebas text-white tracking-widest leading-none"
                  style={{ fontSize: 'clamp(18px, 3.5vw, 26px)', transform: 'skewX(-3deg)', display: 'inline-block' }}
                >
                  KARIŞIK SORU <span style={{ color: '#0891b2' }}>MODU</span>
                </div>
                <div
                  className="font-barlow font-bold text-gray-600 uppercase tracking-[0.2em] mt-1"
                  style={{ fontSize: '10px' }}
                >
                  Tüm branşlardan karışık · SM-2 yok · Sadece pratik
                </div>
              </div>
            </div>
          </motion.div>
        </Link>
      </motion.div>

      {/* ── BRANCH CARDS ── */}
      <div className="px-6 sm:px-10 pb-20">
        {/* Section header */}
        <div className="flex items-center gap-4 mb-4 mt-2">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-[3px] h-5 bg-[#0891b2]" />
            <h2
              className="font-bebas text-white tracking-[0.22em]"
              style={{ fontSize: 'clamp(16px, 3vw, 22px)', transform: 'skewX(-3deg)', display: 'inline-block' }}
            >
              KLİNİK BİLİMLER
            </h2>
          </div>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, #1e3555, transparent)' }} />
          {!loading && (
            <span
              className="font-barlow font-bold text-[10px] tracking-[0.15em] uppercase flex-shrink-0"
              style={{ color: '#2a3a50' }}
            >
              {BRANCHES.length} BRANŞ
            </span>
          )}
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col"
          style={{ gap: '2px' }}
        >
          {loading
            ? BRANCHES.map((_, i) => <SkeletonBranchCard key={i} />)
            : BRANCHES.map((branch) => {
                const stats = branchStats[branch.id]
                return (
                  <motion.div key={branch.id} variants={cardVariants}>
                    <BranchCard
                      branch={branch}
                      stats={stats}
                      loading={false}
                      showProgress={!!user}
                      isHovered={hoveredId === branch.id}
                      isDimmed={hoveredId !== null && hoveredId !== branch.id}
                      onHover={setHoveredId}
                      imageUrl={branchImages[branch.id]}
                    />
                  </motion.div>
                )
              })
          }
        </motion.div>
      </div>
      {/* ── 3D TOOTH MODEL MODAL ── */}
      <AnimatePresence>
        {showModel && (
          <motion.div
            key="tooth-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8"
            style={{ background: 'rgba(4,8,18,0.96)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowModel(false) }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full"
              style={{
                maxWidth: 1100,
                height: 'min(82vh, 700px)',
                background: '#0a1628',
                border: '1px solid rgba(8,145,178,0.25)',
                borderLeft: '3px solid #0891b2',
                clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)',
              }}
            >
              {/* Header bar */}
              <div
                className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-3 z-20"
                style={{ borderBottom: '1px solid rgba(8,145,178,0.15)', background: 'rgba(8,145,178,0.06)' }}
              >
                <div className="flex items-center gap-3">
                  <span className="font-barlow font-bold text-[10px] tracking-[0.28em] uppercase" style={{ color: '#0891b2' }}>
                    ◈ Daimi Dişlenme · 3D İnteraktif Model
                  </span>
                </div>
                <button
                  onClick={() => setShowModel(false)}
                  className="font-barlow font-bold text-[10px] tracking-[0.2em] uppercase flex items-center gap-2 px-3 py-1.5 transition-colors"
                  style={{ color: '#0891b2', border: '1px solid rgba(8,145,178,0.2)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(8,145,178,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  Kapat ✕
                </button>
              </div>
              {/* Viewer */}
              <div className="absolute inset-0 top-11">
                <ToothViewer />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}

function BranchCard({ branch, stats, loading, showProgress, isHovered, isDimmed, onHover, imageUrl }) {
  const progress = stats?.progress || 0
  const topicCount = stats?.topicCount ?? '—'
  const completedCount = stats?.completedCount || 0
  const dueCount = stats?.dueCount || 0

  return (
    <Link
      to={`/branch/${branch.id}`}
      onMouseEnter={() => onHover(branch.id)}
      onMouseLeave={() => onHover(null)}
    >
      <motion.div
        animate={{
          opacity: isDimmed ? 0.38 : 1,
          height: isHovered ? 148 : 112,
        }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden cursor-pointer"
        style={{
          background: imageUrl
            ? `url(${imageUrl}) center/cover`
            : branch.p5gradient,
          borderLeft: isHovered ? `4px solid ${branch.color}` : '4px solid transparent',
          boxShadow: isHovered
            ? `0 8px 48px rgba(0,0,0,0.9), 0 0 32px ${branch.color}20`
            : '0 1px 4px rgba(0,0,0,0.5)',
          transition: 'border-left-color 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        {/* Image overlay */}
        {imageUrl && <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.65)' }} />}

        {/* Branch color accent on hover */}
        {isHovered && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ boxShadow: `inset 0 0 60px ${branch.color}08` }}
          />
        )}

        {/* Content */}
        <div className="relative z-10 h-full flex items-center pl-5 sm:pl-7 pr-3 gap-4">
          <div className="flex-1 min-w-0 pr-4">
            <motion.div
              animate={{ scale: isHovered ? 1.06 : 1 }}
              transition={{ duration: 0.2 }}
              style={{ transformOrigin: 'left center' }}
            >
              <span
                className="font-bebas text-white tracking-wider leading-none block truncate"
                style={{
                  fontSize: isHovered ? '1.7rem' : '1.35rem',
                  transition: 'font-size 0.2s ease',
                  transform: isHovered ? 'skewX(-3deg)' : 'none',
                  display: 'inline-block',
                }}
              >
                {branch.name.toUpperCase()}
              </span>
            </motion.div>

            {showProgress && (
              <div className="mt-2.5">
                <div className="h-[2px] w-44 max-w-full" style={{ background: '#1a2a3a' }}>
                  <motion.div
                    className="h-full"
                    style={{ background: isHovered ? branch.color : '#0891b2' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                  />
                </div>
                <div
                  className="flex items-center gap-3 mt-1.5 font-barlow font-bold text-[10px] uppercase tracking-wider"
                  style={{ color: '#3a4a60' }}
                >
                  <span>{completedCount}/{topicCount} konu</span>
                  {dueCount > 0 && (
                    <span style={{ color: branch.color }}>{dueCount} bekliyor</span>
                  )}
                </div>
              </div>
            )}

            {!showProgress && typeof topicCount === 'number' && topicCount > 0 && (
              <div className="mt-2">
                <span
                  className="font-barlow font-bold text-[10px] uppercase tracking-wider"
                  style={{ color: '#3a4a60' }}
                >
                  {topicCount} konu
                </span>
              </div>
            )}
          </div>

          {/* Progress % on hover */}
          <motion.div
            animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 16 }}
            transition={{ duration: 0.18 }}
            className="text-right flex-shrink-0 mr-20"
          >
            {showProgress ? (
              <>
                <div
                  className="font-bebas leading-none"
                  style={{ fontSize: '2.8rem', color: branch.color }}
                >
                  {progress}%
                </div>
                <div
                  className="font-barlow font-bold text-[9px] uppercase tracking-widest mt-0.5"
                  style={{ color: '#3a4a60' }}
                >
                  tamamlandı
                </div>
              </>
            ) : (
              <>
                <div className="font-bebas text-white" style={{ fontSize: '2.8rem' }}>
                  {typeof topicCount === 'number' ? topicCount : '—'}
                </div>
                <div
                  className="font-barlow font-bold text-[9px] uppercase tracking-widest mt-0.5"
                  style={{ color: '#3a4a60' }}
                >
                  konu
                </div>
              </>
            )}
          </motion.div>
        </div>

        {/* Right slash tab */}
        <motion.div
          animate={{ width: isHovered ? 72 : 36 }}
          transition={{ duration: 0.2 }}
          className="absolute right-0 top-0 bottom-0 flex items-center justify-center"
          style={{
            background: isHovered ? branch.color : '#1a2d45',
            clipPath: 'polygon(18px 0, 100% 0, 100% 100%, 0 100%)',
            transition: 'background 0.2s ease',
          }}
        >
          {isHovered && (
            <span
              className="font-bebas text-white text-xl pl-4 select-none"
              style={{ letterSpacing: '0.05em' }}
            >
              →
            </span>
          )}
        </motion.div>
      </motion.div>
    </Link>
  )
}
