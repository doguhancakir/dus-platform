import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { BRANCHES } from '../lib/data'
import {
  LayoutDashboard,
  LogOut,
  LogIn,
  Settings,
  ChevronRight,
  BookOpen,
  Stethoscope,
} from 'lucide-react'

function NavItem({ to, icon: Icon, label, active }) {
  return (
    <Link to={to}>
      <motion.div
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer
          ${active
            ? 'bg-accent/10 text-accent border border-accent/20'
            : 'text-gray-500 hover:text-gray-300 hover:bg-[#242424]'
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
    <div className="flex min-h-screen bg-[#0a0a0a]">
      {/* Sidebar — Desktop */}
      <aside className="hidden lg:flex flex-col w-60 bg-[#111111] border-r border-[#1e1e1e] fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#1e1e1e]">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Stethoscope size={16} className="text-accent" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-100">DUS Platform</div>
            <div className="text-xs text-gray-600">v1.0</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <NavItem
            to="/"
            icon={LayoutDashboard}
            label="Genel Bakış"
            active={isActive('/')}
          />

          <div className="pt-4 pb-1 px-3">
            <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Branşlar</span>
          </div>

          {BRANCHES.map((branch) => (
            <Link key={branch.id} to={`/branch/${branch.id}`}>
              <motion.div
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer
                  ${location.pathname === `/branch/${branch.id}`
                    ? 'bg-[#1e1e1e] text-gray-200 border border-[#2a2a2a]'
                    : 'text-gray-600 hover:text-gray-300 hover:bg-[#1a1a1a]'
                  }`}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-base leading-none">{branch.icon}</span>
                <span className="font-medium truncate text-xs">{branch.name}</span>
              </motion.div>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-[#1e1e1e] p-3 space-y-1">
          {user ? (
            <>
              {user.is_admin && (
                <NavItem to="/admin" icon={Settings} label="Admin Panel" active={isActive('/admin')} />
              )}
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-xs font-semibold text-accent">
                  {user.nickname?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-300 truncate">{user.nickname}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-300 transition-colors p-1 rounded"
                  title="Çıkış"
                >
                  <LogOut size={14} />
                </button>
              </div>
            </>
          ) : (
            <Link to="/login">
              <motion.div
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-300 hover:bg-[#242424] transition-colors cursor-pointer"
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
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-[#111111]/90 backdrop-blur-md border-b border-[#1e1e1e] flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <Stethoscope size={18} className="text-accent" />
          <span className="text-sm font-semibold text-gray-100">DUS Platform</span>
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
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#111111]/90 backdrop-blur-md border-t border-[#1e1e1e] flex items-center justify-around px-4 h-16">
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
