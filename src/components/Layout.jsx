import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { Menu, X, LogOut, Settings } from 'lucide-react'

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
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* ── TOP NAV ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-40 h-16 flex items-center px-5 sm:px-8"
        style={{
          background: 'rgba(10,10,10,0.97)',
          borderBottom: '1px solid #1a1a1a',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Left red accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#ff1744]" />

        {/* Logo */}
        <Link
          to="/"
          className="flex items-baseline gap-0 ml-1"
          onClick={() => setMenuOpen(false)}
        >
          <span
            className="font-bebas text-[20px] sm:text-[22px] text-white tracking-[0.15em] leading-none"
            style={{ transform: 'skewX(-8deg)', display: 'inline-block' }}
          >
            DAVY'S
          </span>
          <span
            className="font-bebas text-[20px] sm:text-[22px] text-[#ff1744] tracking-[0.15em] leading-none ml-2"
            style={{ transform: 'skewX(-8deg)', display: 'inline-block' }}
          >
            DENTAL
          </span>
        </Link>

        {/* ── Desktop Nav ── */}
        <div className="hidden md:flex items-center gap-1 ml-auto">
          <NavLink to="/" label="ANA SAYFA" active={isActive('/')} />

          {user ? (
            <>
              {user.is_admin && (
                <NavLink to="/admin" label="ADMİN" active={isActive('/admin')} />
              )}
              <div
                className="flex items-center gap-3 ml-4 pl-4"
                style={{ borderLeft: '1px solid #2a2a2a' }}
              >
                <span className="text-gray-500 text-[11px] font-medium uppercase tracking-[0.15em]">
                  {user.nickname}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-[#ff1744] transition-colors p-1.5"
                  title="Çıkış Yap"
                >
                  <LogOut size={15} />
                </button>
              </div>
            </>
          ) : (
            <Link
              to="/login"
              className="ml-4 font-bebas text-sm tracking-[0.12em] px-5 py-2 text-white transition-all"
              style={{
                background: '#ff1744',
                clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e8143c'; e.currentTarget.style.boxShadow = '0 0 20px rgba(255,23,68,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#ff1744'; e.currentTarget.style.boxShadow = 'none' }}
            >
              GİRİŞ YAP
            </Link>
          )}
        </div>

        {/* ── Mobile Hamburger ── */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden ml-auto p-2 text-gray-400 hover:text-white transition-colors"
          aria-label="Menu"
        >
          <motion.div animate={{ rotate: menuOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </motion.div>
        </button>
      </nav>

      {/* ── Mobile Full-Screen Menu ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: [0.7, 0, 0.3, 1] }}
            className="fixed inset-0 z-30 flex flex-col"
            style={{ background: '#0a0a0a', paddingTop: 64 }}
          >
            {/* Corner diagonal accent */}
            <div
              className="absolute bottom-0 right-0 w-64 h-64 pointer-events-none"
              style={{
                background: '#ff1744',
                opacity: 0.06,
                clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
              }}
            />
            {/* Left red stripe */}
            <div className="absolute left-0 top-16 bottom-0 w-[3px] bg-[#ff1744]" />

            <div className="flex-1 flex flex-col justify-center px-8 relative z-10">
              <div className="space-y-0">
                <MobileMenuItem
                  to="/"
                  label="ANA SAYFA"
                  active={isActive('/')}
                  onClick={() => setMenuOpen(false)}
                />
                {user ? (
                  <>
                    {user.is_admin && (
                      <MobileMenuItem
                        to="/admin"
                        label="ADMİN"
                        active={isActive('/admin')}
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
                      onClick={() => setMenuOpen(false)}
                    />
                    <MobileMenuItem
                      to="/register"
                      label="KAYIT OL"
                      active={isActive('/register')}
                      onClick={() => setMenuOpen(false)}
                    />
                  </>
                )}
              </div>

              {user && (
                <div
                  className="mt-10 pt-8"
                  style={{ borderTop: '1px solid #1a1a1a' }}
                >
                  <p className="text-gray-700 text-[10px] uppercase tracking-[0.25em] mb-4">Hesap</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bebas text-3xl text-white tracking-wider">
                      {user.nickname.toUpperCase()}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-gray-600 hover:text-[#ff1744] transition-colors"
                    >
                      <LogOut size={18} />
                      <span className="text-sm uppercase tracking-wider">Çıkış</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <main className="pt-16">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
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
      className="font-bebas text-sm tracking-[0.12em] px-4 py-2 transition-all duration-150"
      style={{
        color: active ? '#ff1744' : '#666',
        borderBottom: active ? '2px solid #ff1744' : '2px solid transparent',
      }}
    >
      {label}
    </Link>
  )
}

function MobileMenuItem({ to, label, active, onClick }) {
  return (
    <Link to={to} onClick={onClick}>
      <motion.div
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        whileTap={{ scale: 0.97 }}
        className="py-5 pl-6"
        style={{ borderBottom: '1px solid #111' }}
      >
        <span
          className="font-bebas tracking-widest"
          style={{
            fontSize: '2.8rem',
            color: active ? '#ff1744' : '#ffffff',
            display: 'inline-block',
          }}
        >
          {label}
        </span>
      </motion.div>
    </Link>
  )
}
