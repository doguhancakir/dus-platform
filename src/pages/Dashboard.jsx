import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase, fetchAllRows } from '../lib/supabase'
import { BRANCHES, TEMEL_BILIMLER } from '../lib/data'
import { computeTopicStats } from '../lib/topicStats'
import { Flag } from 'lucide-react'
import { getDailyGoal, loadGoalHistory, AGAIN_EXCLUDED_FROM_DATE } from '../lib/dailyGoal'
import Layout from '../components/Layout'
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
  const [todayNewAnswered, setTodayNewAnswered] = useState(0)
  const [totalGraduated, setTotalGraduated] = useState(0)
  const [loading, setLoading] = useState(!!user)
  const [hoveredId, setHoveredId] = useState(null)
  const [branchImages, setBranchImages] = useState({})
  const [streak, setStreak] = useState(0)
  const [flaggedTotal, setFlaggedTotal] = useState(0)
  const [goalHistory, setGoalHistory] = useState(null) // null = henüz yüklenmedi
  const [goalsAvailable, setGoalsAvailable] = useState(false)

  useEffect(() => {
    loadBranchImages()
    if (user) {
      setLoading(true)
      refreshGoalHistory()
      loadStats()
    } else {
      setLoading(false)
      setBranchStats({})
    }
  }, [user?.id])

  async function refreshGoalHistory() {
    const { history, available } = await loadGoalHistory(supabase, user.id)
    setGoalHistory(history)
    setGoalsAvailable(available)
  }

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

      const questions = await fetchAllRows(q => q
        .from('questions')
        .select('id, topic_id')
      )

      const allCards = await fetchAllRows(q => q
        .from('user_cards')
        .select('question_id, status, due_date, flagged')
        .eq('user_id', user.id)
      )
      const cardsMap = {}
      allCards?.forEach(c => { cardsMap[c.question_id] = c })

      const qIdsByTopic = {}
      questions?.forEach(q => { (qIdsByTopic[q.topic_id] ||= []).push(q.id) })

      // Branş ilerlemesi = tüm soruları öğrenilmiş (yeşil) konu oranı
      const stats = {}
      ;[...BRANCHES, ...TEMEL_BILIMLER].forEach(b => {
        const branchTopics = topics?.filter(t => t.branch_id === b.id) || []
        let masteredCount = 0
        let dueCount = 0
        let newCount = 0
        branchTopics.forEach(t => {
          const ts = computeTopicStats(qIdsByTopic[t.id] || [], cardsMap)
          if (ts.isMastered) masteredCount++
          dueCount += ts.dueCount
          newCount += ts.newCount
        })
        stats[b.id] = {
          topicCount: branchTopics.length,
          masteredCount,
          dueCount,
          newCount,
          progress: branchTopics.length > 0 ? Math.round((masteredCount / branchTopics.length) * 100) : 0,
        }
      })

      setFlaggedTotal(allCards?.filter(c => c.flagged).length || 0)

      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayDateKey = todayStart.toISOString().split('T')[0]
      // 06.10.2026'dan itibaren "bugün çözülen" sadece Zor/İyi/Kolay ile cevaplanan
      // (counted_review_at) sayılır; öncesinde eski davranış (last_review, her
      // değerlendirme) devam eder — bkz. AGAIN_EXCLUDED_FROM_DATE.
      const useCountedField = todayDateKey >= AGAIN_EXCLUDED_FROM_DATE
      let todayCount = 0
      if (useCountedField) {
        const res = await supabase
          .from('user_cards')
          .select('question_id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('counted_review_at', todayStart.toISOString())
        if (res.error) {
          // counted_review_at kolonu henüz eklenmediyse (migration çalıştırılmadan
          // önce) sayı sıfırda donup kalmasın — eski last_review sayımına düş.
          const fallback = await supabase
            .from('user_cards')
            .select('question_id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('last_review', todayStart.toISOString())
          todayCount = fallback.count || 0
        } else {
          todayCount = res.count || 0
        }
      } else {
        const res = await supabase
          .from('user_cards')
          .select('question_id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('last_review', todayStart.toISOString())
        todayCount = res.count || 0
      }

      // created_at sadece bir sorunun hayatında İLK kez cevaplandığı anda set edilir
      // (upsert var olan satırı güncellerken created_at'e dokunmaz), bu yüzden
      // "bugün yeni çözülen" sayısı budur.
      const { count: todayNewCount } = await supabase
        .from('user_cards')
        .select('question_id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', todayStart.toISOString())

      const { count: graduatedCount } = await supabase
        .from('user_cards')
        .select('question_id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'review')

      setBranchStats(stats)
      setTodayAnswered(todayCount || 0)
      setTodayNewAnswered(todayNewCount || 0)
      setTotalGraduated(graduatedCount || 0)

      // ── Streak: consecutive days meeting that day's goal ──────────────
      // Hedef 18.09.2026'da 50'den 100'e, 04.10.2026'da 100'den 200'e (+100'ü yeni
      // soru şartıyla) çıktı; geçmiş günler kendi dönemlerinin hedefiyle değerlendirilir.
      const reviewHistory = await fetchAllRows(q => q
        .from('user_cards')
        .select('last_review')
        .eq('user_id', user.id)
        .not('last_review', 'is', null)
        .gte('last_review', new Date(Date.now() - 90 * 86400000).toISOString())
      )

      // created_at / counted_review_at kolonları henüz eklenmediyse (migration
      // çalıştırılmadan önce) bu sorgular hata verir — geri kalan istatistikleri
      // (streak, bayraklı sorular) bozmasın diye ayrı try/catch içinde, hatada
      // boş diziyle devam ediyoruz.
      let newHistory = []
      try {
        newHistory = await fetchAllRows(q => q
          .from('user_cards')
          .select('created_at')
          .eq('user_id', user.id)
          .not('created_at', 'is', null)
          .gte('created_at', new Date(Date.now() - 90 * 86400000).toISOString())
        )
      } catch {
        // created_at kolonu yoksa sessizce yeni-soru şartını atla
      }

      let countedHistory = []
      let countedHistoryOk = true
      try {
        countedHistory = await fetchAllRows(q => q
          .from('user_cards')
          .select('counted_review_at')
          .eq('user_id', user.id)
          .not('counted_review_at', 'is', null)
          .gte('counted_review_at', new Date(Date.now() - 90 * 86400000).toISOString())
        )
      } catch {
        // counted_review_at kolonu henüz eklenmediyse AGAIN_EXCLUDED_FROM_DATE'ten
        // sonraki günler de (aşağıda totalCountFor) eski last_review sayımına düşer
        countedHistoryOk = false
      }

      const dayCounts = {}
      reviewHistory?.forEach(c => {
        if (!c.last_review) return
        const day = c.last_review.split('T')[0]
        dayCounts[day] = (dayCounts[day] || 0) + 1
      })

      const countedDayCounts = {}
      countedHistory?.forEach(c => {
        if (!c.counted_review_at) return
        const day = c.counted_review_at.split('T')[0]
        countedDayCounts[day] = (countedDayCounts[day] || 0) + 1
      })

      // Bir günün toplam-soru sayısı: AGAIN_EXCLUDED_FROM_DATE'ten önce last_review
      // (her değerlendirme), o tarihten itibaren counted_review_at (sadece Zor/İyi/Kolay)
      // — ama counted_review_at kolonu henüz yoksa (migration çalışmadıysa) sayı
      // sıfırda donup kalmasın, eski last_review sayımına düş.
      const totalCountFor = (dateKey) =>
        (dateKey >= AGAIN_EXCLUDED_FROM_DATE && countedHistoryOk)
          ? (countedDayCounts[dateKey] || 0)
          : (dayCounts[dateKey] || 0)

      const newDayCounts = {}
      newHistory?.forEach(c => {
        if (!c.created_at) return
        const day = c.created_at.split('T')[0]
        newDayCounts[day] = (newDayCounts[day] || 0) + 1
      })

      const { history: goalHist } = await loadGoalHistory(supabase, user.id)
      const meetsGoal = (dateKey) => {
        const goal = getDailyGoal(dateKey, goalHist)
        if (totalCountFor(dateKey) < goal.threshold) return false
        if (goal.newThreshold && (newDayCounts[dateKey] || 0) < goal.newThreshold) return false
        return true
      }

      const todayStr = new Date().toISOString().split('T')[0]
      const yestStr  = new Date(Date.now() - 86400000).toISOString().split('T')[0]

      // Find the most recent qualifying day to start counting from
      let startDateStr = null
      if (meetsGoal(todayStr)) startDateStr = todayStr
      else if (meetsGoal(yestStr)) startDateStr = yestStr

      let computedStreak = 0
      if (startDateStr) {
        let d = new Date(startDateStr)
        while (true) {
          const k = d.toISOString().split('T')[0]
          if (meetsGoal(k)) {
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

              {/* Kütüphane */}
              {user && (
                <button
                  onClick={() => navigate('/library')}
                  className="flex items-center gap-3 font-barlow font-bold text-[11px] tracking-[0.22em] uppercase px-5 py-3 transition-all duration-200 w-fit"
                  style={{
                    color: '#7dd3fc',
                    background: 'rgba(8,145,178,0.07)',
                    border: '1px solid rgba(8,145,178,0.35)',
                    clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(8,145,178,0.16)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(8,145,178,0.07)'}
                >
                  <span style={{ fontSize: '1rem' }}>📚</span>
                  Kütüphane
                  <span style={{ opacity: 0.5 }}>→</span>
                </button>
              )}

              {/* Bayraklı sorular */}
              {user && flaggedTotal > 0 && (
                <button
                  onClick={() => navigate('/flagged')}
                  className="flex items-center gap-3 font-barlow font-bold text-[11px] tracking-[0.22em] uppercase px-5 py-3 transition-all duration-200 w-fit"
                  style={{
                    color: '#ff8888',
                    background: 'rgba(204,0,0,0.07)',
                    border: '1px solid rgba(204,0,0,0.35)',
                    clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(204,0,0,0.16)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(204,0,0,0.07)'}
                >
                  <Flag size={14} fill="#ff8888" />
                  Bayraklı Sorular
                  <span className="font-bebas text-base leading-none px-1.5 py-0.5" style={{ background: 'rgba(204,0,0,0.25)', color: '#fff' }}>
                    {flaggedTotal}
                  </span>
                  <span style={{ opacity: 0.5 }}>→</span>
                </button>
              )}
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
                <DailyCalendar
                  userId={user.id}
                  todayAnswered={todayAnswered}
                  todayNewAnswered={todayNewAnswered}
                  isAdmin={!!user.is_admin}
                  goalHistory={goalHistory}
                  goalsAvailable={goalsAvailable}
                  onGoalChange={refreshGoalHistory}
                />
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
          className="grid grid-cols-2"
          style={{ background: '#080f1e', borderBottom: '1px solid #1a2d45', gap: '1px' }}
        >
          {[
            { label: 'BUGÜN ÇÖZÜLEN SORU', value: todayAnswered, color: '#0891b2' },
            { label: 'TOPLAM ÇÖZÜLEN SORU', value: totalGraduated, color: '#f0c040' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden px-5 sm:px-8 py-6"
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
                style={{ fontSize: 'clamp(36px, 6vw, 56px)', color: stat.color }}
              >
                {stat.value}
              </div>
              <div
                className="font-barlow font-bold uppercase tracking-[0.15em] mt-1.5 relative z-10"
                style={{ fontSize: '11px', color: '#5a7090' }}
              >
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

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
          <span
            className="font-barlow font-bold text-[10px] tracking-[0.15em] uppercase flex-shrink-0"
            style={{ color: '#2a3a50' }}
          >
            {BRANCHES.length} BRANŞ
          </span>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col"
          style={{ gap: '2px' }}
        >
          {BRANCHES.map((branch) => {
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
          })}
        </motion.div>

        {/* ── TEMEL BİLİMLER ── */}
        <div className="mt-8">
          <div className="flex items-center gap-4 mb-4 mt-2">
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-[3px] h-5" style={{ background: '#6366f1' }} />
              <h2
                className="font-bebas text-white tracking-[0.22em]"
                style={{ fontSize: 'clamp(16px, 3vw, 22px)', transform: 'skewX(-3deg)', display: 'inline-block' }}
              >
                TEMEL BİLİMLER
              </h2>
            </div>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, #2a1a5e, transparent)' }} />
            <span
              className="font-barlow font-bold text-[10px] tracking-[0.15em] uppercase flex-shrink-0"
              style={{ color: '#2a3a50' }}
            >
              {TEMEL_BILIMLER.length} BRANŞ
            </span>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col"
            style={{ gap: '2px' }}
          >
            {TEMEL_BILIMLER.map((branch) => {
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
            })}
          </motion.div>
        </div>
      </div>
    </Layout>
  )
}

function BranchCard({ branch, stats, loading, showProgress, isHovered, isDimmed, onHover, imageUrl }) {
  const progress = stats?.progress || 0
  const topicCount = stats?.topicCount ?? '—'
  const masteredCount = stats?.masteredCount || 0
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
                  <span>{masteredCount}/{topicCount} konu bitti</span>
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
