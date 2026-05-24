import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { initTheme } from './hooks/useTheme'
import './i18n'
import './assets/main.css'

requestAnimationFrame(() => {
  initTheme()
  ;(window as unknown as Record<string, unknown>).__themeResolved = true
})

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)
