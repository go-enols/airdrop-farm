import React, { Suspense, lazy } from 'react'
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

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
)

const App: React.FC = () => (
  <Layout>
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/wallets" element={<Wallets />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/proxies" element={<Proxies />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/airdrops" element={<Airdrops />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/scheduler" element={<Scheduler />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  </Layout>
)

export default App
