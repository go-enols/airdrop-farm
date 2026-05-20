import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard, Wallet, User, Globe, Zap, FileText,
  Gift, BarChart3, Clock, ScrollText, Settings, Menu, X
} from 'lucide-react'

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, key: 'nav.dashboard' },
  { path: '/wallets', icon: Wallet, key: 'nav.wallets' },
  { path: '/accounts', icon: User, key: 'nav.accounts' },
  { path: '/proxies', icon: Globe, key: 'nav.proxies' },
  { path: '/tasks', icon: Zap, key: 'nav.tasks' },
  { path: '/templates', icon: FileText, key: 'nav.templates' },
  { path: '/airdrops', icon: Gift, key: 'nav.airdrops' },
  { path: '/stats', icon: BarChart3, key: 'nav.stats' },
  { path: '/scheduler', icon: Clock, key: 'nav.scheduler' },
  { path: '/logs', icon: ScrollText, key: 'nav.logs' },
  { path: '/settings', icon: Settings, key: 'nav.settings' },
]

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-bg-page">
      <aside className={`${collapsed ? 'w-16' : 'w-52'} flex flex-col border-r border-border-light bg-bg-card transition-all duration-200`}>
        <div className="flex items-center justify-between h-12 px-3 border-b border-border-light">
          {!collapsed && <span className="font-bold text-sm text-text-primary">Airdrop Farm</span>}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1 rounded hover:bg-bg-tertiary">
            {collapsed ? <Menu size={16} /> : <X size={16} />}
          </button>
        </div>
        <nav className="flex-1 py-2 space-y-0.5 px-2">
          {NAV_ITEMS.map(({ path, icon: Icon, key }) => {
            const active = location.pathname === path
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
      </aside>
      <main className="flex-1 overflow-auto p-6 bg-bg-page">{children}</main>
    </div>
  )
}

export default Layout