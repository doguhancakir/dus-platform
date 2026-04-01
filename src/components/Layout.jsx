import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { Menu, X, LogOut } from 'lucide-react'

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
    setMenuOpen(false)
  }

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen" style={{ background: '#0a1628' }}>
      {/* ── TOP NAV ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-40 h-16 flex items-center"
        style={{
          background: 'rgba(8, 18, 36, 0.96)',
          borderBottom: '1px solid #1a2d45',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Left teal accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#0891b2]" />

        {/* Diagonal slash watermark in nav */}
        <div
          className="absolute right-0 top-0 bottom-0 pointer-events-none"
          style={{
            width: '30%',
            background: 'linear-gradient(to left, rgba(8,145,178,0.025), transparent)',
            clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0% 100%)',
          }}
        />

        {/* Logo */}
        <Link
          to="/"
          className="flex items-baseline gap-0 pl-5 sm:pl-8 relative z-10"
          onClick={() => setMenuOpen(false)}
        >
          <motion.span
            whileHover={{ skewX: -6 }}
            transition={{ duration: 0.15 }}
            className="font-bebas text-[20px] sm:text-[23px] text-white tracking-[0.18em] leading-none"
            style={{ display: 'inline-block', transform: 'skewX(-5deg)' }}
          >
            DAVY'S
          </motion.span>
          <motion.span
            whileHover={{ skewX: -6 }}
            transition={{ duration: 0.15 }}
            className="font-bebas text-[20px] sm:text-[23px] text-[#0891b2] tracking-[0.18em] leading-none ml-2"
            style={{ display: 'inline-block', transform: 'skewX(-5deg)' }}
          >
            DENTAL
          </motion.span>
        </Link>

        {/* ── Desktop Nav ── */}
        <div className="hidden md:flex items-center gap-1 ml-auto pr-6 relative z-10">
          <NavLink to="/" label="ANA SAYFA" active={isActive('/')} />

          {user ? (
            <>
              {user.is_admin && (
                <NavLink to="/admin" label="ADMİN" active={isActive('/admin')} />
              )}
              <div
                className="flex items-center gap-3 ml-4 pl-4"
                style={{ borderLeft: '1px solid #1e3555' }}
              >
                <div className="flex flex-col items-end">
                  <span
                    className="font-barlow font-bold text-[#0891b2] text-[11px] tracking-[0.18em] uppercase leading-none"
                  >
                    {user.nickname}
                  </span>
                  <span className="text-gray-700 text-[9px] tracking-[0.15em] uppercase mt-0.5">
                    Öğrenci
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-[#0891b2] transition-colors p-1.5"
                  title="Çıkış Yap"
                  style={{ border: '1px solid #1e3555' }}
                >
                  <LogOut size={13} />
                </button>
              </div>
            </>
          ) : (
            <Link
              to="/login"
              className="ml-4 font-barlow font-bold text-sm tracking-[0.15em] uppercase px-5 py-2 text-white transition-all"
              style={{
                background: '#0891b2',
                clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#0779a0'
                e.currentTarget.style.boxShadow = '0 0 20px rgba(8,145,178,0.4)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#0891b2'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              GİRİŞ YAP
            </Link>
          )}
        </div>

        {/* ── Mobile Hamburger ── */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden ml-auto mr-5 p-2 text-gray-500 hover:text-white transition-colors relative z-10"
          aria-label="Menu"
          style={{ border: '1px solid #1e3555' }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {menuOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X size={18} />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Menu size={18} />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </nav>

      {/* ── Mobile Full-Screen Menu ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-30 flex flex-col overflow-hidden"
            style={{ background: '#070f1e', paddingTop: 64 }}
          >
            {/* Diagonal accent — top-left */}
            <div
              className="absolute top-16 left-0 w-1 bottom-0"
              style={{ background: '#0891b2' }}
            />
            {/* Diagonal corner — bottom-right */}
            <div
              className="absolute bottom-0 right-0 pointer-events-none"
              style={{
                width: '55%',
                height: '55%',
                background: '#0891b2',
                opacity: 0.04,
                clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
              }}
            />
            {/* Watermark */}
            <div
              className="absolute bottom-8 right-4 pointer-events-none select-none"
              style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: 'clamp(60px, 18vw, 120px)',
                color: 'rgba(8,145,178,0.04)',
                letterSpacing: '0.1em',
                lineHeight: 1,
              }}
            >
              DENTAL
            </div>

            {/* Menu items */}
            <div className="flex-1 flex flex-col justify-center pl-10 pr-6 relative z-10">
              <div className="space-y-0 mb-12">
                <MobileMenuItem
                  to="/"
                  label="ANA SAYFA"
                  active={isActive('/')}
                  delay={0}
                  onClick={() => setMenuOpen(false)}
                />
                {user ? (
                  <>
                    {user.is_admin && (
                      <MobileMenuItem
                        to="/admin"
                        label="ADMİN PANELİ"
                        active={isActive('/admin')}
                        delay={0.05}
                        onClick={() => setMenuOpen(false)}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <MobileMenuItem
                      to="/login"
                      label="GİRİŞ YAP"
                      active={isActive('/login')}
                      delay={0.05}
                      onClick={() => setMenuOpen(false)}
                    />
                    <MobileMenuItem
                      to="/register"
                      label="KAYIT OL"
                      active={isActive('/register')}
                      delay={0.1}
                      onClick={() => setMenuOpen(false)}
                    />
                  </>
                )}
              </div>

              {user && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18, duration: 0.3 }}
                  className="pt-8 relative"
                  style={{ borderTop: '1px solid #1a2d45' }}
                >
                  <span
                    className="font-barlow font-bold text-[10px] tracking-[0.22em] uppercase text-gray-700 block mb-3"
                  >
                    Giriş yapıldı
                  </span>
                  <div className="flex items-center justify-between">
                    <span
                      className="font-bebas text-white tracking-wider"
                      style={{ fontSize: '2.6rem', transform: 'skewX(-4deg)', display: 'inline-block' }}
                    >
                      {user.nickname.toUpperCase()}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 font-barlow font-bold text-[11px] tracking-[0.15em] uppercase text-gray-600 hover:text-[#0891b2] transition-colors px-3 py-2"
                      style={{ border: '1px solid #1e3555' }}
                    >
                      <LogOut size={14} />
                      ÇIKIŞ
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <main className="pt-16">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, x: -16, skewX: -1 }}
          animate={{ opacity: 1, x: 0, skewX: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}

function NavLink({ to, label, active }) {
  return (
    <Link
      to={to}
      className="font-barlow font-bold text-[11px] tracking-[0.18em] uppercase px-4 py-2.5 transition-all duration-150 relative"
      style={{
        color: active ? '#0891b2' : '#4a6080',
      }}
      onMouseEnter={e => {
        if (!active) e.currentTarget.style.color = '#c0cfe0'
      }}
      onMouseLeave={e => {
        if (!active) e.currentTarget.style.color = '#4a6080'
      }}
    >
      {label}
      {active && (
        <motion.div
          layoutId="nav-active"
          className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0891b2]"
          transition={{ duration: 0.2 }}
        />
      )}
    </Link>
  )
}

function MobileMenuItem({ to, label, active, delay, onClick }) {
  return (
    <Link to={to} onClick={onClick} className="block">
      <motion.div
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        whileTap={{ scale: 0.97, x: 4 }}
        className="py-4 relative group"
        style={{ borderBottom: '1px solid rgba(30,53,85,0.5)' }}
      >
        {active && (
          <motion.div
            layoutId="mobile-active"
            className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#0891b2]"
          />
        )}
        <span
          className="font-bebas tracking-[0.12em] leading-none"
          style={{
            fontSize: 'clamp(2rem, 8vw, 3.2rem)',
            color: active ? '#0891b2' : '#ffffff',
            display: 'inline-block',
            transform: active ? 'skewX(-4deg)' : 'skewX(0deg)',
            transition: 'transform 0.2s ease, color 0.2s ease',
          }}
        >
          {label}
        </span>
      </motion.div>
    </Link>
  )
}
