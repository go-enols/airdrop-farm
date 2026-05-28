import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Wallet,
  User,
  Globe,
  Zap,
  FileText,
  Gift,
  BarChart3,
  Clock,
  ScrollText,
  Settings,
  Menu,
  X,
  LogOut,
  Shield
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import type { UserRole } from '../contexts/AuthContext'
import TitleBar from './TitleBar'

interface NavItem {
  path: string
  icon: React.ElementType
  key: string
  roles: UserRole[]
}

const ALL_NAV_ITEMS: NavItem[] = [
  { path: '/', icon: LayoutDashboard, key: 'nav.dashboard', roles: ['admin', 'developer', 'user'] },
  { path: '/wallets', icon: Wallet, key: 'nav.wallets', roles: ['admin', 'developer', 'user'] },
  { path: '/accounts', icon: User, key: 'nav.accounts', roles: ['admin', 'developer', 'user'] },
  { path: '/proxies', icon: Globe, key: 'nav.proxies', roles: ['admin', 'developer', 'user'] },
  { path: '/tasks', icon: Zap, key: 'nav.tasks', roles: ['admin', 'developer'] },
  { path: '/templates', icon: FileText, key: 'nav.templates', roles: ['admin', 'developer'] },
  { path: '/airdrops', icon: Gift, key: 'nav.airdrops', roles: ['admin', 'developer', 'user'] },
  { path: '/stats', icon: BarChart3, key: 'nav.stats', roles: ['admin'] },
  { path: '/scheduler', icon: Clock, key: 'nav.scheduler', roles: ['admin', 'developer'] },
  { path: '/logs', icon: ScrollText, key: 'nav.logs', roles: ['admin'] },
  { path: '/settings', icon: Settings, key: 'nav.settings', roles: ['admin'] }
]

const roleLabels: Record<UserRole, string> = {
  admin: '管理员',
  developer: '开发者',
  user: '用户'
}

const roleColors: Record<UserRole, string> = {
  admin: 'bg-danger text-white',
  developer: 'bg-primary text-white',
  user: 'bg-success text-white'
}

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sidebar-collapsed') === 'true'
  )

  const userRole: UserRole = user?.role ?? 'user'
  const NAV_ITEMS = ALL_NAV_ITEMS.filter((item) => item.roles.includes(userRole))

  return (
    <div className="flex flex-col h-screen bg-bg-page">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`${collapsed ? 'w-16' : 'w-52'} flex flex-col border-r border-border-light bg-bg-card transition-all duration-200`}
        >
          <div className="flex items-center justify-end h-12 px-3 border-b border-border-light">
            <button
              onClick={() => {
                const next = !collapsed
                setCollapsed(next)
                localStorage.setItem('sidebar-collapsed', String(next))
              }}
              className="p-1 rounded hover:bg-bg-tertiary"
              aria-label={collapsed ? t('common.refresh') : t('common.close')}
            >
              {collapsed ? <Menu size={16} /> : <X size={16} />}
            </button>
          </div>
          <nav className="flex-1 py-2 space-y-0.5 px-2 overflow-y-auto">
            {NAV_ITEMS.map(({ path, icon: Icon, key }) => {
              const active =
                location.pathname.startsWith(path) &&
                (path === '/' ? location.pathname === '/' : true)
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm transition-colors ${
                    active
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-text-secondary hover:bg-bg-tertiary'
                  }`}
                  title={t(key)}
                >
                  <Icon size={18} />
                  {!collapsed && <span>{t(key)}</span>}
                </button>
              )
            })}
          </nav>

          <div className="border-t border-border-light p-3">
            {!collapsed && (
              <div className="mb-2">
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-text-muted" />
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[userRole]}`}
                  >
                    {roleLabels[userRole]}
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-1 truncate">{user?.displayName}</p>
              </div>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
              title="退出登录"
            >
              <LogOut size={14} />
              {!collapsed && <span>退出登录</span>}
            </button>
          </div>
        </aside>
        <main
          key={location.pathname}
          className="flex-1 overflow-auto p-6 bg-bg-page animate-fade-in"
        >
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
