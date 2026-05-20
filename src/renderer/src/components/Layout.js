import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime'
import { useState } from 'react'
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
  X
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
  { path: '/settings', icon: Settings, key: 'nav.settings' }
]
const Layout = ({ children }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  return _jsxs('div', {
    className: 'flex h-screen bg-bg-page',
    children: [
      _jsxs('aside', {
        className: `${collapsed ? 'w-16' : 'w-52'} flex flex-col border-r border-border-light bg-bg-card transition-all duration-200`,
        children: [
          _jsxs('div', {
            className: 'flex items-center justify-between h-12 px-3 border-b border-border-light',
            children: [
              !collapsed &&
                _jsx('span', {
                  className: 'font-bold text-sm text-text-primary',
                  children: 'Airdrop Farm'
                }),
              _jsx('button', {
                onClick: () => setCollapsed(!collapsed),
                className: 'p-1 rounded hover:bg-bg-tertiary',
                children: collapsed ? _jsx(Menu, { size: 16 }) : _jsx(X, { size: 16 })
              })
            ]
          }),
          _jsx('nav', {
            className: 'flex-1 py-2 space-y-0.5 px-2',
            children: NAV_ITEMS.map(({ path, icon: Icon, key }) => {
              const active = location.pathname === path
              return _jsxs(
                'button',
                {
                  onClick: () => navigate(path),
                  className: `flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm transition-colors ${
                    active
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-text-secondary hover:bg-bg-tertiary'
                  }`,
                  title: t(key),
                  children: [
                    _jsx(Icon, { size: 18 }),
                    !collapsed && _jsx('span', { children: t(key) })
                  ]
                },
                path
              )
            })
          })
        ]
      }),
      _jsx('main', { className: 'flex-1 overflow-auto p-6 bg-bg-page', children: children })
    ]
  })
}
export default Layout
