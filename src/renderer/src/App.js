import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime'
import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Wallets = lazy(() => import('./pages/Wallets'))
const Accounts = lazy(() => import('./pages/Accounts'))
const Proxies = lazy(() => import('./pages/Proxies'))
const Tasks = lazy(() => import('./pages/Tasks'))
const Templates = lazy(() => import('./pages/Templates'))
const Airdrops = lazy(() => import('./pages/Airdrops'))
const Stats = lazy(() => import('./pages/Stats'))
const Scheduler = lazy(() => import('./pages/Scheduler'))
const Logs = lazy(() => import('./pages/Logs'))
const Settings = lazy(() => import('./pages/Settings'))
const LoadingSpinner = () =>
  _jsx('div', {
    className: 'flex items-center justify-center h-full',
    children: _jsx('div', {
      className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-primary'
    })
  })
const App = () =>
  _jsx(Layout, {
    children: _jsx(Suspense, {
      fallback: _jsx(LoadingSpinner, {}),
      children: _jsxs(Routes, {
        children: [
          _jsx(Route, { path: '/', element: _jsx(Dashboard, {}) }),
          _jsx(Route, { path: '/wallets', element: _jsx(Wallets, {}) }),
          _jsx(Route, { path: '/accounts', element: _jsx(Accounts, {}) }),
          _jsx(Route, { path: '/proxies', element: _jsx(Proxies, {}) }),
          _jsx(Route, { path: '/tasks', element: _jsx(Tasks, {}) }),
          _jsx(Route, { path: '/templates', element: _jsx(Templates, {}) }),
          _jsx(Route, { path: '/airdrops', element: _jsx(Airdrops, {}) }),
          _jsx(Route, { path: '/stats', element: _jsx(Stats, {}) }),
          _jsx(Route, { path: '/scheduler', element: _jsx(Scheduler, {}) }),
          _jsx(Route, { path: '/logs', element: _jsx(Logs, {}) }),
          _jsx(Route, { path: '/settings', element: _jsx(Settings, {}) }),
          _jsx(Route, { path: '*', element: _jsx(Navigate, { to: '/', replace: true }) })
        ]
      })
    })
  })
export default App
