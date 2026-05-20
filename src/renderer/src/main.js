import { jsx as _jsx } from 'react/jsx-runtime'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './i18n'
import './assets/main.css'
createRoot(document.getElementById('root')).render(
  _jsx(React.StrictMode, { children: _jsx(HashRouter, { children: _jsx(App, {}) }) })
)
