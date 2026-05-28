import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
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
const LoginPage = lazy(() => import('./pages/LoginPage'))

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
)

function AppContent(): React.ReactElement {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <LoginPage />
      </Suspense>
    )
  }

  return (
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
}

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
)

export default App
