import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { BRANCHES } from '../lib/data'
import {
  LayoutDashboard,
  LogOut,
  LogIn,
  Settings,
  BookOpen,
} from 'lucide-react'

function NavItem({ to, icon: Icon, label, active }) {
  return (
    <Link to={to}>
      <motion.div
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer
          ${active
            ? 'bg-accent/10 text-accent border border-accent/20 shadow-glow-sm'
            : 'text-gray-500 hover:text-gray-200 hover:bg-[#1e1e30]'
          }`}
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
      >
        <Icon size={16} />
        <span className="font-medium">{label}</span>
      </motion.div>
    </Link>
  )
}

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      {/* Sidebar — Desktop */}
      <aside className="hidden lg:flex flex-col w-60 fixed inset-y-0 left-0 z-30"
        style={{ background: 'rgba(10,10,20,0.95)', borderRight: '1px solid rgba(37,37,64,0.6)', backdropFilter: 'blur(20px)' }}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid rgba(37,37,64,0.5)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.25)' }}>
            🦷
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight leading-none">Davy's Dental</div>
            <div className="text-[10px] text-gray-600 mt-0.5 font-light">DUS Hazırlık</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <NavItem
            to="/"
            icon={LayoutDashboard}
            label="Ana Sayfa"
            active={isActive('/')}
          />

          <div className="pt-4 pb-1 px-3">
            <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Klinik Bilimler</span>
          </div>

          {BRANCHES.map((branch) => (
            <Link key={branch.id} to={`/branch/${branch.id}`}>
              <motion.div
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer
                  ${location.pathname === `/branch/${branch.id}`
                    ? 'text-gray-200 border'
                    : 'text-gray-600 hover:text-gray-300 hover:bg-[#16162a]'
                  }`}
                style={location.pathname === `/branch/${branch.id}` ? {
                  background: `${branch.color}12`,
                  borderColor: `${branch.color}30`,
                  borderLeftWidth: '2px',
                } : {}}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-base leading-none flex-shrink-0">{branch.icon}</span>
                <span className="font-medium truncate text-xs">{branch.name}</span>
              </motion.div>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 space-y-1" style={{ borderTop: '1px solid rgba(37,37,64,0.5)' }}>
          {user ? (
            <>
              {user.is_admin && (
                <NavItem to="/admin" icon={Settings} label="Admin Panel" active={isActive('/admin')} />
              )}
              <div className="flex items-center gap-2.5 px-3 py-2 mt-1">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-accent flex-shrink-0"
                  style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.25)' }}>
                  {user.nickname?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-300 truncate">{user.nickname}</div>
                  <div className="text-[10px] text-gray-600">Öğrenci</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-300 transition-colors p-1.5 rounded-lg hover:bg-[#1e1e30]"
                  title="Çıkış"
                >
                  <LogOut size={14} />
                </button>
              </div>
            </>
          ) : (
            <Link to="/login">
              <motion.div
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-200 hover:bg-[#1e1e30] transition-all cursor-pointer"
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                <LogIn size={16} />
                <span className="font-medium">Giriş Yap</span>
              </motion.div>
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 h-14"
        style={{ background: 'rgba(10,10,20,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(37,37,64,0.5)' }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">🦷</span>
          <span className="text-sm font-bold text-white tracking-tight">Davy's Dental</span>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {user.is_admin && (
                <Link to="/admin" className="text-gray-500 hover:text-gray-300 p-1.5">
                  <Settings size={18} />
                </Link>
              )}
              <button onClick={handleLogout} className="text-gray-500 hover:text-gray-300 p-1.5">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link to="/login" className="text-gray-500 hover:text-gray-300 p-1.5">
              <LogIn size={18} />
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 lg:ml-60">
        <div className="pt-14 lg:pt-0 min-h-screen">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around px-4 h-16"
        style={{ background: 'rgba(10,10,20,0.94)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(37,37,64,0.5)' }}>
        {user ? (
          <MobileNavItem to="/" icon={LayoutDashboard} label="Ana Sayfa" active={isActive('/')} />
        ) : (
          <MobileNavItem to="/login" icon={LogIn} label="Giriş Yap" active={isActive('/login')} />
        )}
        <MobileNavItem to="/branch/7" icon={BookOpen} label="Çalış" active={location.pathname.startsWith('/branch')} />
        {user?.is_admin && (
          <MobileNavItem to="/admin" icon={Settings} label="Admin" active={isActive('/admin')} />
        )}
      </nav>
    </div>
  )
}

function MobileNavItem({ to, icon: Icon, label, active }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-0.5 py-2 px-4">
      <Icon size={20} className={active ? 'text-accent' : 'text-gray-600'} />
      <span className={`text-[10px] font-medium ${active ? 'text-accent' : 'text-gray-600'}`}>{label}</span>
    </Link>
  )
}
