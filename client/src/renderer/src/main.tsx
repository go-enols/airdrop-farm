import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import App from './App'
import { queryClient } from './hooks/queries/queryClient'
import { initTheme } from './hooks/useTheme'
import './i18n'
import './assets/main.css'

requestAnimationFrame(() => {
  initTheme()
  ;(window as unknown as Record<string, unknown>).__themeResolved = true
})

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Toaster position="top-right" richColors closeButton />
        <App />
      </HashRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
