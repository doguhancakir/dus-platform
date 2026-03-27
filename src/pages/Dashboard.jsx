import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { BRANCHES } from '../lib/data'
import Layout from '../components/Layout'

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
}

const cardVariants = {
  hidden: { opacity: 0, x: -50 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.7, 0, 0.3, 1] },
  },
}

export default function Dashboard() {
  const { user } = useAuth()
  const [branchStats, setBranchStats] = useState({})
  const [totalDue, setTotalDue] = useState(0)
  const [loading, setLoading] = useState(!!user)
  const [hoveredId, setHoveredId] = useState(null)
  const [branchImages, setBranchImages] = useState({})

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
      // Table may not exist yet — use gradients
    }
  }

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
      {/* ── HERO ── */}
      <section className="relative pt-14 pb-10 overflow-hidden" style={{ minHeight: '46vh', display: 'flex', alignItems: 'flex-end' }}>
        {/* Background red slash */}
        <div
          className="absolute right-0 top-0 bottom-0 pointer-events-none"
          style={{
            width: '35%',
            background: 'linear-gradient(to left, rgba(8,145,178,0.04), transparent)',
            transform: 'skewX(-8deg)',
            transformOrigin: 'top right',
          }}
        />
        {/* Left red stripe */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#0891b2]" />

        <div className="relative z-10 px-6 sm:px-10 pb-2 w-full">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.7, 0, 0.3, 1] }}
          >
            <h1
              className="font-bebas text-white leading-[0.88] tracking-wider"
              style={{
                fontSize: 'clamp(60px, 11vw, 136px)',
                transform: 'skewX(-4deg)',
                display: 'inline-block',
              }}
            >
              DAVY'S{' '}
              <span style={{ color: '#0891b2'}}>DENTAL</span>
            </h1>

            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="text-gray-600 text-[10px] sm:text-xs uppercase tracking-[0.35em] mt-4"
            >
              DİŞ HEKİMLİĞİ UZMANLIK SINAVI HAZIRLIK PLATFORMU
            </motion.p>

            {user && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="text-gray-600 text-sm mt-2"
              >
                HOŞ GELDİN,{' '}
                <span className="font-bebas text-[#0891b2] text-xl tracking-widest" style={{ verticalAlign: 'baseline' }}>
                  {user.nickname.toUpperCase()}
                </span>
              </motion.p>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── STATS ROW (logged in) ── */}
      {user && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 mb-8"
          style={{ background: '#0d1e35', borderTop: '1px solid #1a2d45', borderBottom: '1px solid #1a2d45', gap: '1px' }}
        >
          {[
            { label: 'BEKLEYEN KART', value: totalDue },
            { label: 'TAMAMLANAN KONU', value: completedTopics },
            { label: 'GENEL İLERLEME', value: `${overallProgress}%` },
            { label: 'KLİNİK ALAN', value: 8 },
          ].map((stat, i) => (
            <div key={i} className="bg-[#0a1628] px-5 sm:px-7 py-5 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#0891b2]" />
              <div className="font-bebas text-3xl sm:text-4xl text-white tracking-wider">{stat.value}</div>
              <div className="text-[9px] sm:text-[10px] text-gray-600 uppercase tracking-[0.18em] mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── CTA BANNER (not logged in) ── */}
      {!user && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mx-6 sm:mx-10 mb-8 relative overflow-hidden"
          style={{
            background: '#0d1e35',
            borderLeft: '4px solid #0891b2',
            border: '1px solid #1a2d45',
            borderLeftWidth: 4,
            borderLeftColor: '#0891b2',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4">
            <div>
              <p className="font-bebas text-lg sm:text-xl text-white tracking-widest">
                HESAP OLUŞTUR, İLERLEMENİ TAKİP ET
              </p>
              <p className="text-gray-600 text-[11px] mt-0.5 uppercase tracking-wider">
                Öğrendiğin konuları işaretle, tekrar kartlarını yönet
              </p>
            </div>
            <Link
              to="/register"
              className="flex-shrink-0 font-bebas tracking-[0.12em] text-sm text-white px-6 py-2.5 transition-all"
              style={{
                background: '#0891b2',
                clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
              }}
            >
              KAYIT OL
            </Link>
          </div>
        </motion.div>
      )}

      {/* ── MIXED QUIZ CTA ── */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.28, duration: 0.38, ease: [0.7, 0, 0.3, 1] }}
        className="px-6 sm:px-10 mb-4"
      >
        <Link to="/mixed-quiz" className="block group relative overflow-hidden">
          <motion.div
            whileHover={{ scale: 1.008 }}
            transition={{ duration: 0.2 }}
            className="relative overflow-hidden"
            style={{
              background: 'linear-gradient(120deg, #0d1e35 0%, #0a1628 60%, #091520 100%)',
              borderLeft: '4px solid #0891b2',
              border: '1px solid #1a2d45',
              borderLeftWidth: 4,
              borderLeftColor: '#0891b2',
              boxShadow: '0 4px 32px rgba(0,0,0,0.5)',
            }}
          >
            {/* Teal slash diagonal accent */}
            <div
              className="absolute right-0 top-0 bottom-0 pointer-events-none"
              style={{
                width: '28%',
                background: 'linear-gradient(to left, rgba(8,145,178,0.06), transparent)',
                transform: 'skewX(-8deg)',
                transformOrigin: 'top right',
              }}
            />
            {/* Animated right stripe */}
            <motion.div
              className="absolute right-0 top-0 bottom-0 w-14 flex items-center justify-center"
              style={{
                background: '#0891b2',
                clipPath: 'polygon(18px 0, 100% 0, 100% 100%, 0 100%)',
              }}
              animate={{ width: 56 }}
              whileHover={{ width: 80 }}
              transition={{ duration: 0.2 }}
            >
              <span className="font-bebas text-white text-xl pl-4 select-none" style={{ letterSpacing: '0.05em' }}>→</span>
            </motion.div>

            <div className="flex items-center gap-5 px-5 sm:px-7 py-4 sm:py-5 pr-20">
              {/* Icon badge */}
              <div
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center font-bebas text-xl"
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
                <div className="text-[10px] text-gray-600 uppercase tracking-[0.22em] mt-1">
                  Tüm branşlardan karışık soru · SM-2 yok · Sadece pratik
                </div>
              </div>
            </div>
          </motion.div>
        </Link>
      </motion.div>

      {/* ── BRANCH CARDS ── */}
      <div className="px-6 sm:px-10 pb-16">
        {/* Section header */}
        <div className="flex items-center gap-4 mb-5">
          <h2 className="font-bebas text-xl sm:text-2xl text-white tracking-[0.22em] flex-shrink-0">
            KLİNİK BİLİMLER
          </h2>
          <div className="relative flex-1 h-px" style={{ background: '#1a2d45' }}>
            <div className="absolute left-0 top-0 h-full w-16 bg-[#0891b2]" />
          </div>
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
                  loading={loading}
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
    </Layout>
  )
}

function BranchCard({ branch, stats, loading, showProgress, isHovered, isDimmed, onHover, imageUrl }) {
  if (loading) {
    return (
      <div className="relative overflow-hidden" style={{ height: 112 }}>
        <div className="shimmer absolute inset-0" />
        <div
          className="absolute right-0 top-0 bottom-0 w-8"
          style={{ background: '#1a2d45', clipPath: 'polygon(16px 0, 100% 0, 100% 100%, 0 100%)' }}
        />
      </div>
    )
  }

  const progress = stats?.progress || 0
  const topicCount = stats?.topicCount ?? '—'
  const completedCount = stats?.completedCount || 0
  const dueCount = stats?.dueCount || 0

  return (
    <Link
      to={`/branch/${branch.id}`}
      onMouseEnter={() => onHover(branch.id)}
      onMouseLeave={() => onHover(null)}
      onTouchStart={() => onHover(branch.id)}
      onTouchEnd={() => setTimeout(() => onHover(null), 300)}
    >
      <motion.div
        animate={{
          opacity: isDimmed ? 0.42 : 1,
          scale: isDimmed ? 0.992 : isHovered ? 1.012 : 1,
          height: isHovered ? 144 : 112,
        }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className="relative overflow-hidden cursor-pointer"
        style={{
          background: imageUrl ? `url(${imageUrl}) center/cover` : branch.p5gradient,
          borderLeft: isHovered ? '4px solid #0891b2' : '4px solid transparent',
          boxShadow: isHovered
            ? '0 8px 48px rgba(0,0,0,0.9), 0 0 32px rgba(8,145,178,0.18)'
            : '0 2px 6px rgba(0,0,0,0.5)',
        }}
      >
        {/* Image overlay */}
        {imageUrl && (
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.62)' }} />
        )}

        {/* Red glow on hover */}
        {isHovered && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ boxShadow: 'inset 0 0 50px rgba(8,145,178,0.08)' }}
          />
        )}

        {/* Content */}
        <div className="relative z-10 h-full flex items-center pl-5 sm:pl-7 pr-3 gap-4">
          {/* Left: Name + progress */}
          <div className="flex-1 min-w-0 pr-4">
            <motion.div
              animate={{ scale: isHovered ? 1.08 : 1 }}
              transition={{ duration: 0.2 }}
              style={{ transformOrigin: 'left center' }}
            >
              <span
                className="font-bebas text-white tracking-wider leading-none block truncate"
                style={{ fontSize: isHovered ? '1.75rem' : '1.35rem', transition: 'font-size 0.2s ease' }}
              >
                {branch.name.toUpperCase()}
              </span>
            </motion.div>

            {showProgress && (
              <div className="mt-2.5">
                <div className="h-[2px] w-44 max-w-full" style={{ background: '#2a2a2a' }}>
                  <motion.div
                    className="h-full"
                    style={{ background: '#0891b2' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                  />
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] text-gray-600 uppercase tracking-wider">
                    {completedCount}/{topicCount} konu
                  </span>
                  {dueCount > 0 && (
                    <span className="text-[10px] text-[#0891b2] uppercase tracking-wider">
                      {dueCount} bekliyor
                    </span>
                  )}
                </div>
              </div>
            )}

            {!showProgress && typeof topicCount === 'number' && topicCount > 0 && (
              <div className="mt-2">
                <span className="text-[10px] text-gray-600 uppercase tracking-wider">
                  {topicCount} konu
                </span>
              </div>
            )}
          </div>

          {/* Right: Stats (hover reveal) */}
          <motion.div
            animate={{
              opacity: isHovered ? 1 : 0,
              x: isHovered ? 0 : 16,
            }}
            transition={{ duration: 0.18 }}
            className="text-right flex-shrink-0 mr-20"
          >
            {showProgress ? (
              <>
                <div className="font-bebas text-[#0891b2] text-3xl leading-none">{progress}%</div>
                <div className="text-[9px] text-gray-600 uppercase tracking-widest mt-0.5">tamamlandı</div>
              </>
            ) : (
              <>
                <div className="font-bebas text-white text-3xl leading-none">
                  {typeof topicCount === 'number' ? topicCount : '—'}
                </div>
                <div className="text-[9px] text-gray-600 uppercase tracking-widest mt-0.5">konu</div>
              </>
            )}
          </motion.div>
        </div>

        {/* Right diagonal slash accent */}
        <motion.div
          animate={{ width: isHovered ? 72 : 36 }}
          transition={{ duration: 0.2 }}
          className="absolute right-0 top-0 bottom-0 flex items-center justify-center"
          style={{
            background: isHovered ? '#0891b2' : '#162544',
            clipPath: 'polygon(18px 0, 100% 0, 100% 100%, 0 100%)',
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
