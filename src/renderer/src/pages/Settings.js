import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from 'react/jsx-runtime'
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { settingApi, appApi, captchaKeyApi, proxyProviderApi, updateApi } from '../api'
import { logApi } from '../api'
import { Save, Info, Plus, Trash2, Edit3, Key, Globe, Download, RefreshCw } from 'lucide-react'
const LOG_LEVELS = ['debug', 'info', 'warn', 'error']
const Settings = () => {
  const { t } = useTranslation()
  const [appInfo, setAppInfo] = useState(null)
  const [logLevel, setLogLevel] = useState('info')
  const [settings, setSettings] = useState({})
  const [edited, setEdited] = useState({})
  const [saving, setSaving] = useState(false)
  const [logLevelSaving, setLogLevelSaving] = useState(false)
  const [logLevelMsg, setLogLevelMsg] = useState('')
  const [captchaKeys, setCaptchaKeys] = useState(null)
  const [showCaptchaKeyForm, setShowCaptchaKeyForm] = useState(false)
  const [editingCaptchaKey, setEditingCaptchaKey] = useState(null)
  const [captchaKeyForm, setCaptchaKeyForm] = useState({ provider: '', apiKey: '' })
  const [deleteCaptchaKeyId, setDeleteCaptchaKeyId] = useState(null)
  const [proxyProviders, setProxyProviders] = useState(null)
  const [showProxyProviderForm, setShowProxyProviderForm] = useState(false)
  const [editingProxyProvider, setEditingProxyProvider] = useState(null)
  const [proxyProviderForm, setProxyProviderForm] = useState({
    name: '',
    apiUrl: '',
    apiKey: '',
    protocol: 'http',
    refreshInterval: 300
  })
  const [deleteProxyProviderId, setDeleteProxyProviderId] = useState(null)
  const [newSettingKey, setNewSettingKey] = useState('')
  const [deleteSettingKey, setDeleteSettingKey] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  // Auto-update state
  const [updateStatus, setUpdateStatus] = useState('idle')
  const [updateInfo, setUpdateInfo] = useState(null)
  const [updateError, setUpdateError] = useState('')
  const [downloadProgress, setDownloadProgress] = useState({ percent: 0, transferred: 0, total: 0 })
  // Listen for update status from main process
  useEffect(() => {
    if (!window.electronAPI) return
    const handleUpdateStatus = (...args) => {
      const data = args[0]
      setUpdateStatus(data.status)
      if (data.status === 'available') {
        setUpdateInfo(data.data)
      } else if (data.status === 'downloading') {
        setDownloadProgress(data.data)
      } else if (data.status === 'error') {
        setUpdateError(data.data)
      }
    }
    // on returns a cleanup function
    return window.electronAPI.on('update:status', handleUpdateStatus)
  }, [])
  const checkForUpdates = async () => {
    setUpdateStatus('checking')
    setUpdateError('')
    setUpdateInfo(null)
    try {
      await updateApi.check()
    } catch {
      setUpdateStatus('error')
      setUpdateError(t('common.error'))
    }
  }
  const downloadUpdate = async () => {
    setUpdateError('')
    try {
      await updateApi.download()
    } catch {
      setUpdateStatus('error')
      setUpdateError(t('common.error'))
    }
  }
  const installUpdate = async () => {
    try {
      await updateApi.install()
    } catch {
      setUpdateStatus('error')
      setUpdateError(t('common.error'))
    }
  }
  const fetchAppInfo = useCallback(async () => {
    try {
      const info = await appApi.getInfo()
      setAppInfo(info)
    } catch {
      // Ignore fetch errors
    }
  }, [])
  const fetchLogLevel = useCallback(async () => {
    try {
      const level = await logApi.getLevel()
      setLogLevel(level)
    } catch {
      // Ignore fetch errors
    }
  }, [])
  const fetchSettings = useCallback(async () => {
    try {
      const all = await settingApi.getAll()
      setSettings(all)
      setEdited(all)
    } catch {
      // Ignore fetch errors
    }
  }, [])
  const fetchCaptchaKeys = useCallback(async () => {
    try {
      const res = await captchaKeyApi.list()
      setCaptchaKeys(res)
    } catch {
      // Ignore fetch errors
    }
  }, [])
  const fetchProxyProviders = useCallback(async () => {
    try {
      const res = await proxyProviderApi.list()
      setProxyProviders(res)
    } catch {
      // Ignore fetch errors
    }
  }, [])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAppInfo()
    fetchLogLevel()
    fetchSettings()
    fetchCaptchaKeys()
    fetchProxyProviders()
  }, [fetchAppInfo, fetchLogLevel, fetchSettings, fetchCaptchaKeys, fetchProxyProviders])
  const handleSaveLogLevel = async () => {
    setLogLevelSaving(true)
    try {
      await logApi.setLevel(logLevel)
      setLogLevelMsg(t('settings.logLevelSaved'))
      setTimeout(() => setLogLevelMsg(''), 3000)
    } catch {
      setErrorMsg(t('common.operationFailed'))
    } finally {
      setLogLevelSaving(false)
    }
  }
  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const entries = Object.entries(edited)
      await Promise.all(entries.map(([key, value]) => settingApi.set(key, value)))
      setSettings({ ...edited })
    } catch {
      setErrorMsg(t('common.operationFailed'))
    } finally {
      setSaving(false)
    }
  }
  const handleAddSetting = async () => {
    const key = newSettingKey.trim()
    if (!key) return
    try {
      await settingApi.set(key, '')
      setEdited((prev) => ({ ...prev, [key]: '' }))
      setSettings((prev) => ({ ...prev, [key]: '' }))
      setNewSettingKey('')
    } catch {
      setErrorMsg(t('common.operationFailed'))
    }
  }
  const handleDeleteSetting = async () => {
    if (!deleteSettingKey) return
    try {
      await settingApi.delete(deleteSettingKey)
      setEdited((prev) => {
        const next = { ...prev }
        delete next[deleteSettingKey]
        return next
      })
      setSettings((prev) => {
        const next = { ...prev }
        delete next[deleteSettingKey]
        return next
      })
      setDeleteSettingKey(null)
    } catch {
      setErrorMsg(t('common.operationFailed'))
    }
  }
  const openCaptchaKeyAdd = () => {
    setEditingCaptchaKey(null)
    setCaptchaKeyForm({ provider: '', apiKey: '' })
    setShowCaptchaKeyForm(true)
  }
  const openCaptchaKeyEdit = (item) => {
    setEditingCaptchaKey(item)
    setCaptchaKeyForm({ provider: item.provider, apiKey: item.apiKey })
    setShowCaptchaKeyForm(true)
  }
  const handleSaveCaptchaKey = async () => {
    try {
      if (editingCaptchaKey) {
        await captchaKeyApi.update(editingCaptchaKey.id, {
          provider: captchaKeyForm.provider,
          apiKey: captchaKeyForm.apiKey
        })
      } else {
        await captchaKeyApi.create({
          provider: captchaKeyForm.provider,
          apiKey: captchaKeyForm.apiKey,
          balance: 0
        })
      }
      setShowCaptchaKeyForm(false)
      fetchCaptchaKeys()
    } catch {
      setErrorMsg(t('common.operationFailed'))
    }
  }
  const handleDeleteCaptchaKey = async () => {
    if (!deleteCaptchaKeyId) return
    try {
      await captchaKeyApi.delete(deleteCaptchaKeyId)
      setDeleteCaptchaKeyId(null)
      fetchCaptchaKeys()
    } catch {
      setErrorMsg(t('common.operationFailed'))
    }
  }
  const openProxyProviderAdd = () => {
    setEditingProxyProvider(null)
    setProxyProviderForm({
      name: '',
      apiUrl: '',
      apiKey: '',
      protocol: 'http',
      refreshInterval: 300
    })
    setShowProxyProviderForm(true)
  }
  const openProxyProviderEdit = (item) => {
    setEditingProxyProvider(item)
    setProxyProviderForm({
      name: item.name,
      apiUrl: item.apiUrl,
      apiKey: item.apiKey,
      protocol: item.protocol,
      refreshInterval: item.refreshInterval
    })
    setShowProxyProviderForm(true)
  }
  const handleSaveProxyProvider = async () => {
    try {
      if (editingProxyProvider) {
        await proxyProviderApi.update(editingProxyProvider.id, {
          name: proxyProviderForm.name,
          apiUrl: proxyProviderForm.apiUrl,
          apiKey: proxyProviderForm.apiKey,
          protocol: proxyProviderForm.protocol,
          refreshInterval: proxyProviderForm.refreshInterval
        })
      } else {
        await proxyProviderApi.create({
          name: proxyProviderForm.name,
          apiUrl: proxyProviderForm.apiUrl,
          apiKey: proxyProviderForm.apiKey,
          protocol: proxyProviderForm.protocol,
          refreshInterval: proxyProviderForm.refreshInterval,
          lastSync: null,
          labels: []
        })
      }
      setShowProxyProviderForm(false)
      fetchProxyProviders()
    } catch {
      setErrorMsg(t('common.operationFailed'))
    }
  }
  const handleDeleteProxyProvider = async () => {
    if (!deleteProxyProviderId) return
    try {
      await proxyProviderApi.delete(deleteProxyProviderId)
      setDeleteProxyProviderId(null)
      fetchProxyProviders()
    } catch {
      setErrorMsg(t('common.operationFailed'))
    }
  }
  const hasChanges =
    Object.keys(edited).some((key) => edited[key] !== settings[key]) ||
    Object.keys(edited).length !== Object.keys(settings).length
  return _jsxs('div', {
    className: 'space-y-6 max-w-3xl',
    children: [
      errorMsg &&
        _jsxs('div', {
          className:
            'px-4 py-2 text-sm text-danger bg-danger-light rounded-lg flex items-center justify-between',
          children: [
            _jsx('span', { children: errorMsg }),
            _jsx('button', {
              onClick: () => setErrorMsg(''),
              className: 'text-danger/70 hover:text-danger',
              children: '\u00D7'
            })
          ]
        }),
      _jsx('h1', { className: 'text-2xl font-bold', children: t('settings.title') }),
      _jsxs('section', {
        className: 'border border-border-light rounded-lg p-5 space-y-3 bg-bg-card',
        children: [
          _jsxs('div', {
            className: 'flex items-center gap-2 text-lg font-semibold text-text-primary',
            children: [_jsx(Info, { size: 20 }), t('settings.about')]
          }),
          appInfo
            ? _jsxs('div', {
                className: 'grid grid-cols-2 gap-x-8 gap-y-2 text-sm',
                children: [
                  _jsx('div', { className: 'text-text-muted', children: 'Version' }),
                  _jsx('div', {
                    className: 'font-mono text-text-primary',
                    children: appInfo.version
                  }),
                  _jsx('div', { className: 'text-text-muted', children: 'Data Dir' }),
                  _jsx('div', {
                    className: 'font-mono break-all text-text-primary',
                    children: appInfo.dataDir
                  }),
                  _jsx('div', { className: 'text-text-muted', children: 'Database' }),
                  _jsx('div', {
                    children: appInfo.dbConnected
                      ? _jsx('span', { className: 'text-success', children: 'Connected' })
                      : _jsxs('span', {
                          className: 'text-danger',
                          children: ['Disconnected', appInfo.dbError ? `: ${appInfo.dbError}` : '']
                        })
                  }),
                  _jsx('div', {
                    className: 'text-text-muted',
                    children: t('dashboard.stats.wallets')
                  }),
                  _jsx('div', { className: 'text-text-primary', children: appInfo.walletCount }),
                  _jsx('div', {
                    className: 'text-text-muted',
                    children: t('dashboard.stats.accounts')
                  }),
                  _jsx('div', { className: 'text-text-primary', children: appInfo.accountCount }),
                  _jsx('div', {
                    className: 'text-text-muted',
                    children: t('dashboard.stats.proxies')
                  }),
                  _jsx('div', { className: 'text-text-primary', children: appInfo.proxyCount }),
                  _jsx('div', {
                    className: 'text-text-muted',
                    children: t('dashboard.stats.tasks')
                  }),
                  _jsxs('div', {
                    className: 'text-text-primary',
                    children: [appInfo.taskCount, ' (', appInfo.runningTaskCount, ' running)']
                  })
                ]
              })
            : _jsx('div', { className: 'text-sm text-text-muted', children: t('common.loading') })
        ]
      }),
      _jsxs('section', {
        className: 'border border-border-light rounded-lg p-5 space-y-3 bg-bg-card',
        children: [
          _jsxs('div', {
            className: 'flex items-center justify-between',
            children: [
              _jsxs('div', {
                className: 'flex items-center gap-2 text-lg font-semibold text-text-primary',
                children: [_jsx(RefreshCw, { size: 20 }), t('settings.updates')]
              }),
              _jsx('button', {
                onClick: checkForUpdates,
                disabled: updateStatus === 'checking' || updateStatus === 'downloading',
                className:
                  'flex items-center gap-1.5 px-4 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors',
                children:
                  updateStatus === 'checking'
                    ? _jsxs(_Fragment, {
                        children: [
                          _jsx(RefreshCw, { size: 16, className: 'animate-spin' }),
                          t('updates.checking')
                        ]
                      })
                    : _jsxs(_Fragment, {
                        children: [_jsx(RefreshCw, { size: 16 }), t('updates.checkNow')]
                      })
              })
            ]
          }),
          updateError &&
            _jsx('div', {
              className: 'px-4 py-2 text-sm text-danger bg-danger-light rounded-lg',
              children: updateError
            }),
          (updateStatus === 'available' || updateStatus === 'downloading') &&
            updateInfo &&
            _jsxs('div', {
              className:
                'px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-2',
              children: [
                _jsx('p', {
                  className: 'text-sm text-blue-800 dark:text-blue-300',
                  children: _jsx('strong', { children: t('updates.updateAvailable') })
                }),
                _jsxs('p', {
                  className: 'text-sm text-blue-700 dark:text-blue-400',
                  children: [
                    t('updates.version'),
                    ': ',
                    _jsx('span', { className: 'font-mono', children: updateInfo.version })
                  ]
                }),
                _jsxs('p', {
                  className: 'text-sm text-blue-700 dark:text-blue-400',
                  children: [
                    t('updates.releaseDate'),
                    ':',
                    ' ',
                    updateInfo.pub_date ? new Date(updateInfo.pub_date).toLocaleDateString() : '-'
                  ]
                }),
                _jsx('button', {
                  onClick: downloadUpdate,
                  disabled: updateStatus === 'downloading',
                  className:
                    'flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors mt-2',
                  children:
                    updateStatus === 'downloading'
                      ? _jsxs(_Fragment, {
                          children: [
                            _jsx(RefreshCw, { size: 16, className: 'animate-spin' }),
                            t('updates.downloading')
                          ]
                        })
                      : _jsxs(_Fragment, {
                          children: [_jsx(Download, { size: 16 }), t('updates.downloadUpdate')]
                        })
                }),
                updateStatus === 'downloading' &&
                  downloadProgress.total > 0 &&
                  _jsxs('div', {
                    className: 'w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-2',
                    children: [
                      _jsx('div', {
                        className: 'bg-blue-600 h-2.5 rounded-full transition-width duration-300',
                        style: { width: `${downloadProgress.percent}%` }
                      }),
                      _jsxs('p', {
                        className: 'text-xs text-blue-600 dark:text-blue-400 mt-1',
                        children: [
                          Math.round(downloadProgress.percent),
                          '% -',
                          ' ',
                          (downloadProgress.transferred / 1024 / 1024).toFixed(1),
                          'MB /',
                          ' ',
                          (downloadProgress.total / 1024 / 1024).toFixed(1),
                          'MB'
                        ]
                      })
                    ]
                  })
              ]
            }),
          updateStatus === 'downloaded' &&
            _jsxs('div', {
              className:
                'px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg',
              children: [
                _jsx('p', {
                  className: 'text-sm text-green-800 dark:text-green-300 mb-2',
                  children: t('updates.updateReady')
                }),
                _jsx('button', {
                  onClick: installUpdate,
                  className:
                    'px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors',
                  children: t('updates.restartInstall')
                })
              ]
            }),
          updateStatus === 'not-available' &&
            _jsx('p', { className: 'text-sm text-text-muted', children: t('updates.noUpdates') })
        ]
      }),
      _jsxs('section', {
        className: 'border border-border-light rounded-lg p-5 space-y-3 bg-bg-card',
        children: [
          _jsx('div', {
            className: 'text-lg font-semibold text-text-primary',
            children: t('logs.level')
          }),
          _jsxs('div', {
            className: 'flex items-center gap-3',
            children: [
              _jsx('select', {
                value: logLevel,
                onChange: (e) => setLogLevel(e.target.value),
                className:
                  'px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary',
                children: LOG_LEVELS.map((l) =>
                  _jsx('option', { value: l, children: l.toUpperCase() }, l)
                )
              }),
              _jsxs('button', {
                onClick: handleSaveLogLevel,
                disabled: logLevelSaving,
                className:
                  'flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors',
                children: [
                  _jsx(Save, { size: 16 }),
                  logLevelSaving ? t('common.loading') : t('common.save')
                ]
              }),
              logLevelMsg &&
                _jsx('span', { className: 'text-sm text-success', children: logLevelMsg })
            ]
          })
        ]
      }),
      _jsxs('section', {
        className: 'border border-border-light rounded-lg p-5 space-y-3 bg-bg-card',
        children: [
          _jsxs('div', {
            className: 'flex items-center justify-between',
            children: [
              _jsxs('div', {
                className: 'flex items-center gap-2 text-lg font-semibold text-text-primary',
                children: [_jsx(Key, { size: 20 }), t('settings.captchaKeys')]
              }),
              _jsxs('button', {
                onClick: openCaptchaKeyAdd,
                className:
                  'flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors',
                children: [_jsx(Plus, { size: 16 }), t('settings.addCaptchaKey')]
              })
            ]
          }),
          !(captchaKeys?.items || []).length
            ? _jsx('div', {
                className: 'text-sm text-text-muted',
                children: t('settings.noCaptchaKeys')
              })
            : _jsx('div', {
                className: 'overflow-x-auto border border-border-light rounded-lg',
                children: _jsxs('table', {
                  className: 'w-full text-sm',
                  children: [
                    _jsx('thead', {
                      className: 'bg-bg-tertiary',
                      children: _jsxs('tr', {
                        children: [
                          _jsx('th', {
                            className: 'px-4 py-2.5 text-left font-medium text-text-muted',
                            children: t('settings.provider')
                          }),
                          _jsx('th', {
                            className: 'px-4 py-2.5 text-left font-medium text-text-muted',
                            children: t('settings.apiKey')
                          }),
                          _jsx('th', {
                            className: 'px-4 py-2.5 text-left font-medium text-text-muted',
                            children: t('settings.balance')
                          }),
                          _jsx('th', {
                            className: 'px-4 py-2.5 text-right font-medium text-text-muted',
                            children: t('common.actions')
                          })
                        ]
                      })
                    }),
                    _jsx('tbody', {
                      className: 'divide-y divide-border-light/50',
                      children: (captchaKeys?.items || []).map((item) =>
                        _jsxs(
                          'tr',
                          {
                            className: 'hover:bg-bg-card-hover transition-colors',
                            children: [
                              _jsx('td', { className: 'px-4 py-2.5', children: item.provider }),
                              _jsxs('td', {
                                className: 'px-4 py-2.5 font-mono text-xs',
                                children: [item.apiKey.slice(0, 8), '...']
                              }),
                              _jsx('td', { className: 'px-4 py-2.5', children: item.balance }),
                              _jsx('td', {
                                className: 'px-4 py-2.5 text-right',
                                children: _jsxs('div', {
                                  className: 'flex items-center justify-end gap-1',
                                  children: [
                                    _jsx('button', {
                                      onClick: () => openCaptchaKeyEdit(item),
                                      className:
                                        'p-1 text-text-muted hover:text-primary hover:bg-primary-light rounded transition-colors',
                                      children: _jsx(Edit3, { size: 16 })
                                    }),
                                    _jsx('button', {
                                      onClick: () => setDeleteCaptchaKeyId(item.id),
                                      className:
                                        'p-1 text-danger hover:bg-danger-light rounded transition-colors',
                                      children: _jsx(Trash2, { size: 16 })
                                    })
                                  ]
                                })
                              })
                            ]
                          },
                          item.id
                        )
                      )
                    })
                  ]
                })
              })
        ]
      }),
      _jsxs('section', {
        className: 'border border-border-light rounded-lg p-5 space-y-3 bg-bg-card',
        children: [
          _jsxs('div', {
            className: 'flex items-center justify-between',
            children: [
              _jsxs('div', {
                className: 'flex items-center gap-2 text-lg font-semibold text-text-primary',
                children: [_jsx(Globe, { size: 20 }), t('settings.proxyProviders')]
              }),
              _jsxs('button', {
                onClick: openProxyProviderAdd,
                className:
                  'flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors',
                children: [_jsx(Plus, { size: 16 }), t('settings.addProxyProvider')]
              })
            ]
          }),
          !(proxyProviders?.items || []).length
            ? _jsx('div', {
                className: 'text-sm text-text-muted',
                children: t('settings.noProxyProviders')
              })
            : _jsx('div', {
                className: 'overflow-x-auto border border-border-light rounded-lg',
                children: _jsxs('table', {
                  className: 'w-full text-sm',
                  children: [
                    _jsx('thead', {
                      className: 'bg-bg-tertiary',
                      children: _jsxs('tr', {
                        children: [
                          _jsx('th', {
                            className: 'px-4 py-2.5 text-left font-medium text-text-muted',
                            children: t('settings.providerName')
                          }),
                          _jsx('th', {
                            className: 'px-4 py-2.5 text-left font-medium text-text-muted',
                            children: t('settings.apiUrl')
                          }),
                          _jsx('th', {
                            className: 'px-4 py-2.5 text-left font-medium text-text-muted',
                            children: t('proxies.protocol')
                          }),
                          _jsx('th', {
                            className: 'px-4 py-2.5 text-left font-medium text-text-muted',
                            children: t('settings.refreshInterval')
                          }),
                          _jsx('th', {
                            className: 'px-4 py-2.5 text-right font-medium text-text-muted',
                            children: t('common.actions')
                          })
                        ]
                      })
                    }),
                    _jsx('tbody', {
                      className: 'divide-y divide-border-light/50',
                      children: (proxyProviders?.items || []).map((item) =>
                        _jsxs(
                          'tr',
                          {
                            className: 'hover:bg-bg-card-hover transition-colors',
                            children: [
                              _jsx('td', { className: 'px-4 py-2.5', children: item.name }),
                              _jsx('td', {
                                className: 'px-4 py-2.5 font-mono text-xs',
                                children: item.apiUrl
                              }),
                              _jsx('td', {
                                className: 'px-4 py-2.5 text-xs uppercase',
                                children: item.protocol
                              }),
                              _jsxs('td', {
                                className: 'px-4 py-2.5',
                                children: [item.refreshInterval, 's']
                              }),
                              _jsx('td', {
                                className: 'px-4 py-2.5 text-right',
                                children: _jsxs('div', {
                                  className: 'flex items-center justify-end gap-1',
                                  children: [
                                    _jsx('button', {
                                      onClick: () => openProxyProviderEdit(item),
                                      className:
                                        'p-1 text-text-muted hover:text-primary hover:bg-primary-light rounded transition-colors',
                                      children: _jsx(Edit3, { size: 16 })
                                    }),
                                    _jsx('button', {
                                      onClick: () => setDeleteProxyProviderId(item.id),
                                      className:
                                        'p-1 text-danger hover:bg-danger-light rounded transition-colors',
                                      children: _jsx(Trash2, { size: 16 })
                                    })
                                  ]
                                })
                              })
                            ]
                          },
                          item.id
                        )
                      )
                    })
                  ]
                })
              })
        ]
      }),
      _jsxs('section', {
        className: 'border border-border-light rounded-lg p-5 space-y-3 bg-bg-card',
        children: [
          _jsx('div', {
            className: 'text-lg font-semibold text-text-primary',
            children: t('settings.general')
          }),
          Object.keys(edited).length === 0 && Object.keys(settings).length === 0
            ? _jsx('div', { className: 'text-sm text-text-muted', children: t('common.noData') })
            : _jsx('div', {
                className: 'space-y-3',
                children: Object.entries(edited).map(([key, value]) =>
                  _jsxs(
                    'div',
                    {
                      className: 'flex items-center gap-3',
                      children: [
                        _jsx('label', {
                          className: 'w-48 text-sm font-mono text-text-muted shrink-0',
                          children: key
                        }),
                        _jsx('input', {
                          type: 'text',
                          value: value,
                          onChange: (e) =>
                            setEdited((prev) => ({ ...prev, [key]: e.target.value })),
                          className:
                            'flex-1 px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary'
                        }),
                        _jsx('button', {
                          onClick: () => setDeleteSettingKey(key),
                          className:
                            'p-1 text-danger hover:bg-danger-light rounded shrink-0 transition-colors',
                          title: t('common.deleteSetting'),
                          children: _jsx(Trash2, { size: 16 })
                        })
                      ]
                    },
                    key
                  )
                )
              }),
          _jsxs('div', {
            className: 'flex items-center gap-3 pt-2 border-t border-border-light',
            children: [
              _jsx('input', {
                type: 'text',
                value: newSettingKey,
                onChange: (e) => setNewSettingKey(e.target.value),
                onKeyDown: (e) => {
                  if (e.key === 'Enter') handleAddSetting()
                },
                placeholder: t('common.newKey') + '...',
                className:
                  'w-48 px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary'
              }),
              _jsxs('button', {
                onClick: handleAddSetting,
                disabled: !newSettingKey.trim(),
                className:
                  'flex items-center gap-1.5 px-3 py-1.5 text-sm bg-bg-tertiary border border-border-light rounded-lg hover:bg-bg-card-hover disabled:opacity-40 transition-colors',
                children: [_jsx(Plus, { size: 16 }), t('common.addSetting')]
              })
            ]
          }),
          hasChanges &&
            _jsx('div', {
              className: 'flex justify-end pt-2',
              children: _jsxs('button', {
                onClick: handleSaveSettings,
                disabled: saving,
                className:
                  'flex items-center gap-1.5 px-4 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors',
                children: [
                  _jsx(Save, { size: 16 }),
                  saving ? t('common.loading') : t('common.save')
                ]
              })
            })
        ]
      }),
      showCaptchaKeyForm &&
        _jsx('div', {
          className: 'fixed inset-0 z-50 flex items-center justify-center bg-black/40',
          onClick: () => setShowCaptchaKeyForm(false),
          children: _jsxs('div', {
            className: 'bg-bg-card rounded-xl shadow-xl w-full max-w-md p-6',
            onClick: (e) => e.stopPropagation(),
            children: [
              _jsx('h2', {
                className: 'text-lg font-semibold text-text-primary mb-4',
                children: editingCaptchaKey
                  ? t('settings.editCaptchaKey')
                  : t('settings.addCaptchaKey')
              }),
              _jsxs('div', {
                className: 'space-y-3',
                children: [
                  _jsxs('div', {
                    children: [
                      _jsx('label', {
                        className: 'block text-sm font-medium text-text-secondary mb-1',
                        children: t('settings.provider')
                      }),
                      _jsx('input', {
                        type: 'text',
                        value: captchaKeyForm.provider,
                        onChange: (e) =>
                          setCaptchaKeyForm((f) => ({ ...f, provider: e.target.value })),
                        className:
                          'w-full px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary'
                      })
                    ]
                  }),
                  _jsxs('div', {
                    children: [
                      _jsx('label', {
                        className: 'block text-sm font-medium text-text-secondary mb-1',
                        children: t('settings.apiKey')
                      }),
                      _jsx('input', {
                        type: 'text',
                        value: captchaKeyForm.apiKey,
                        onChange: (e) =>
                          setCaptchaKeyForm((f) => ({ ...f, apiKey: e.target.value })),
                        className:
                          'w-full px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary'
                      })
                    ]
                  })
                ]
              }),
              _jsxs('div', {
                className: 'flex justify-end gap-2 mt-6',
                children: [
                  _jsx('button', {
                    onClick: () => setShowCaptchaKeyForm(false),
                    className:
                      'px-4 py-1.5 text-sm border border-border-light rounded-lg hover:bg-bg-card-hover transition-colors',
                    children: t('common.cancel')
                  }),
                  _jsx('button', {
                    onClick: handleSaveCaptchaKey,
                    className:
                      'px-4 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors',
                    children: t('common.save')
                  })
                ]
              })
            ]
          })
        }),
      showProxyProviderForm &&
        _jsx('div', {
          className: 'fixed inset-0 z-50 flex items-center justify-center bg-black/40',
          onClick: () => setShowProxyProviderForm(false),
          children: _jsxs('div', {
            className: 'bg-bg-card rounded-xl shadow-xl w-full max-w-md p-6',
            onClick: (e) => e.stopPropagation(),
            children: [
              _jsx('h2', {
                className: 'text-lg font-semibold text-text-primary mb-4',
                children: editingProxyProvider
                  ? t('settings.editProxyProvider')
                  : t('settings.addProxyProvider')
              }),
              _jsxs('div', {
                className: 'space-y-3',
                children: [
                  _jsxs('div', {
                    children: [
                      _jsx('label', {
                        className: 'block text-sm font-medium text-text-secondary mb-1',
                        children: t('settings.providerName')
                      }),
                      _jsx('input', {
                        type: 'text',
                        value: proxyProviderForm.name,
                        onChange: (e) =>
                          setProxyProviderForm((f) => ({ ...f, name: e.target.value })),
                        className:
                          'w-full px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary'
                      })
                    ]
                  }),
                  _jsxs('div', {
                    children: [
                      _jsx('label', {
                        className: 'block text-sm font-medium text-text-secondary mb-1',
                        children: t('settings.apiUrl')
                      }),
                      _jsx('input', {
                        type: 'text',
                        value: proxyProviderForm.apiUrl,
                        onChange: (e) =>
                          setProxyProviderForm((f) => ({ ...f, apiUrl: e.target.value })),
                        className:
                          'w-full px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary'
                      })
                    ]
                  }),
                  _jsxs('div', {
                    children: [
                      _jsx('label', {
                        className: 'block text-sm font-medium text-text-secondary mb-1',
                        children: t('settings.apiKey')
                      }),
                      _jsx('input', {
                        type: 'text',
                        value: proxyProviderForm.apiKey,
                        onChange: (e) =>
                          setProxyProviderForm((f) => ({ ...f, apiKey: e.target.value })),
                        className:
                          'w-full px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary'
                      })
                    ]
                  }),
                  _jsxs('div', {
                    children: [
                      _jsx('label', {
                        className: 'block text-sm font-medium text-text-secondary mb-1',
                        children: t('proxies.protocol')
                      }),
                      _jsxs('select', {
                        value: proxyProviderForm.protocol,
                        onChange: (e) =>
                          setProxyProviderForm((f) => ({
                            ...f,
                            protocol: e.target.value
                          })),
                        className:
                          'w-full px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary',
                        children: [
                          _jsx('option', { value: 'http', children: 'HTTP' }),
                          _jsx('option', { value: 'https', children: 'HTTPS' }),
                          _jsx('option', { value: 'socks5', children: 'SOCKS5' })
                        ]
                      })
                    ]
                  }),
                  _jsxs('div', {
                    children: [
                      _jsx('label', {
                        className: 'block text-sm font-medium text-text-secondary mb-1',
                        children: t('settings.refreshInterval')
                      }),
                      _jsx('input', {
                        type: 'number',
                        value: proxyProviderForm.refreshInterval,
                        onChange: (e) =>
                          setProxyProviderForm((f) => ({
                            ...f,
                            refreshInterval: Number(e.target.value)
                          })),
                        className:
                          'w-full px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary'
                      })
                    ]
                  })
                ]
              }),
              _jsxs('div', {
                className: 'flex justify-end gap-2 mt-6',
                children: [
                  _jsx('button', {
                    onClick: () => setShowProxyProviderForm(false),
                    className:
                      'px-4 py-1.5 text-sm border border-border-light rounded-lg hover:bg-bg-card-hover transition-colors',
                    children: t('common.cancel')
                  }),
                  _jsx('button', {
                    onClick: handleSaveProxyProvider,
                    className:
                      'px-4 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors',
                    children: t('common.save')
                  })
                ]
              })
            ]
          })
        }),
      deleteCaptchaKeyId &&
        _jsx('div', {
          className: 'fixed inset-0 z-50 flex items-center justify-center bg-black/40',
          onClick: () => setDeleteCaptchaKeyId(null),
          children: _jsxs('div', {
            className: 'bg-bg-card rounded-xl shadow-xl w-full max-w-sm p-6',
            onClick: (e) => e.stopPropagation(),
            children: [
              _jsx('h2', {
                className: 'text-lg font-semibold text-text-primary mb-2',
                children: t('common.delete')
              }),
              _jsx('p', {
                className: 'text-sm text-text-secondary mb-6',
                children: t('settings.confirmDeleteCaptchaKey')
              }),
              _jsxs('div', {
                className: 'flex justify-end gap-2',
                children: [
                  _jsx('button', {
                    onClick: () => setDeleteCaptchaKeyId(null),
                    className:
                      'px-4 py-1.5 text-sm border border-border-light rounded-lg hover:bg-bg-card-hover transition-colors',
                    children: t('common.cancel')
                  }),
                  _jsx('button', {
                    onClick: handleDeleteCaptchaKey,
                    className:
                      'px-4 py-1.5 text-sm bg-danger text-white rounded-lg hover:bg-danger-hover transition-colors',
                    children: t('common.delete')
                  })
                ]
              })
            ]
          })
        }),
      deleteProxyProviderId &&
        _jsx('div', {
          className: 'fixed inset-0 z-50 flex items-center justify-center bg-black/40',
          onClick: () => setDeleteProxyProviderId(null),
          children: _jsxs('div', {
            className: 'bg-bg-card rounded-xl shadow-xl w-full max-w-sm p-6',
            onClick: (e) => e.stopPropagation(),
            children: [
              _jsx('h2', {
                className: 'text-lg font-semibold text-text-primary mb-2',
                children: t('common.delete')
              }),
              _jsx('p', {
                className: 'text-sm text-text-secondary mb-6',
                children: t('settings.confirmDeleteProxyProvider')
              }),
              _jsxs('div', {
                className: 'flex justify-end gap-2',
                children: [
                  _jsx('button', {
                    onClick: () => setDeleteProxyProviderId(null),
                    className:
                      'px-4 py-1.5 text-sm border border-border-light rounded-lg hover:bg-bg-card-hover transition-colors',
                    children: t('common.cancel')
                  }),
                  _jsx('button', {
                    onClick: handleDeleteProxyProvider,
                    className:
                      'px-4 py-1.5 text-sm bg-danger text-white rounded-lg hover:bg-danger-hover transition-colors',
                    children: t('common.delete')
                  })
                ]
              })
            ]
          })
        }),
      deleteSettingKey &&
        _jsx('div', {
          className: 'fixed inset-0 z-50 flex items-center justify-center bg-black/40',
          onClick: () => setDeleteSettingKey(null),
          children: _jsxs('div', {
            className: 'bg-bg-card rounded-xl shadow-xl w-full max-w-sm p-6',
            onClick: (e) => e.stopPropagation(),
            children: [
              _jsx('h2', {
                className: 'text-lg font-semibold text-text-primary mb-2',
                children: t('common.deleteSetting')
              }),
              _jsx('p', {
                className: 'text-sm text-text-secondary mb-6',
                children: t('common.confirmDeleteSetting')
              }),
              _jsxs('div', {
                className: 'flex justify-end gap-2',
                children: [
                  _jsx('button', {
                    onClick: () => setDeleteSettingKey(null),
                    className:
                      'px-4 py-1.5 text-sm border border-border-light rounded-lg hover:bg-bg-card-hover transition-colors',
                    children: t('common.cancel')
                  }),
                  _jsx('button', {
                    onClick: handleDeleteSetting,
                    className:
                      'px-4 py-1.5 text-sm bg-danger text-white rounded-lg hover:bg-danger-hover transition-colors',
                    children: t('common.delete')
                  })
                ]
              })
            ]
          })
        })
    ]
  })
}
export default Settings
