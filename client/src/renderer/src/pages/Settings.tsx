import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { settingApi, appApi, captchaKeyApi, proxyProviderApi, updateApi, getMarketplaceUrl, setMarketplaceUrl, getMarketplaceApiKey, setMarketplaceApiKey } from '../api'
import { logApi } from '../api'
import type { AppInfo, CaptchaKey, ProxyProvider, ListResponse, UpdateInfo } from '../types'
import { Save, Info, Plus, Trash2, Edit3, Key, Globe, Download, RefreshCw, Server } from 'lucide-react'
import ThemeToggle from '../components/ThemeToggle'
import { Modal, ConfirmDialog } from '../components/common'

const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const

const Settings: React.FC = () => {
  const { t } = useTranslation()
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null)
  const [logLevel, setLogLevel] = useState('info')
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [edited, setEdited] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [logLevelSaving, setLogLevelSaving] = useState(false)
  const [logLevelMsg, setLogLevelMsg] = useState('')

  const [captchaKeys, setCaptchaKeys] = useState<ListResponse<CaptchaKey> | null>(null)
  const [showCaptchaKeyForm, setShowCaptchaKeyForm] = useState(false)
  const [editingCaptchaKey, setEditingCaptchaKey] = useState<CaptchaKey | null>(null)
  const [captchaKeyForm, setCaptchaKeyForm] = useState({ provider: '', apiKey: '' })
  const [deleteCaptchaKeyId, setDeleteCaptchaKeyId] = useState<string | null>(null)

  const [proxyProviders, setProxyProviders] = useState<ListResponse<ProxyProvider> | null>(null)
  const [showProxyProviderForm, setShowProxyProviderForm] = useState(false)
  const [editingProxyProvider, _setEditingProxyProvider] = useState<ProxyProvider | null>(null)
  const [proxyProviderForm, setProxyProviderForm] = useState({
    name: '',
    apiUrl: '',
    apiKey: '',
    protocol: 'http' as 'http' | 'https' | 'socks5',
    refreshInterval: 300
  })
  const [deleteProxyProviderId, setDeleteProxyProviderId] = useState<string | null>(null)

  const [newSettingKey, setNewSettingKey] = useState('')
  const [deleteSettingKey, setDeleteSettingKey] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [marketplaceUrl, setMarketplaceUrlLocal] = useState('')
  const [marketplaceSaving, setMarketplaceSaving] = useState(false)
  const [marketplaceMsg, setMarketplaceMsg] = useState('')
  const [marketplaceApiKey, setMarketplaceApiKeyLocal] = useState('')
  const [marketplaceApiKeySaving, setMarketplaceApiKeySaving] = useState(false)
  const [marketplaceApiKeyMsg, setMarketplaceApiKeyMsg] = useState('')

  // Auto-update state
  const [updateStatus, setUpdateStatus] = useState<
    'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
  >('idle')
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [updateError, setUpdateError] = useState('')
  const [downloadProgress, setDownloadProgress] = useState({ percent: 0, transferred: 0, total: 0 })

  // Listen for update status from main process
  useEffect(() => {
    if (!window.electronAPI) return

    const handleUpdateStatus = (...args: unknown[]): void => {
      const payload = args[0] as { status: string; data?: unknown }
      setUpdateStatus(
        payload.status as
          | 'idle'
          | 'checking'
          | 'available'
          | 'not-available'
          | 'downloading'
          | 'downloaded'
          | 'error'
      )
      if (payload.status === 'available') {
        setUpdateInfo(payload.data as UpdateInfo)
      } else if (payload.status === 'downloading') {
        setDownloadProgress(payload.data as { percent: number; transferred: number; total: number })
      } else if (payload.status === 'error') {
        setUpdateError(payload.data as string)
      }
    }

    // on returns a cleanup function
    return window.electronAPI.on('update:status', handleUpdateStatus)
  }, [])

  const checkForUpdates = async (): Promise<void> => {
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

  const downloadUpdate = async (): Promise<void> => {
    setUpdateError('')
    try {
      await updateApi.download()
    } catch {
      setUpdateStatus('error')
      setUpdateError(t('common.error'))
    }
  }

  const installUpdate = async (): Promise<void> => {
    try {
      await updateApi.install()
    } catch {
      setUpdateStatus('error')
      setUpdateError(t('common.error'))
    }
  }

  const fetchAppInfo = useCallback(async (): Promise<void> => {
    try {
      const info = await appApi.getInfo()
      setAppInfo(info)
    } catch {
      // Ignore fetch errors
    }
  }, [])

  const fetchLogLevel = useCallback(async (): Promise<void> => {
    try {
      const level = await logApi.getLevel()
      setLogLevel(level)
    } catch {
      // Ignore fetch errors
    }
  }, [])

  const fetchSettings = useCallback(async (): Promise<void> => {
    try {
      const all = await settingApi.getAll()
      setSettings(all)
      setEdited(all)
    } catch {
      // Ignore fetch errors
    }
  }, [])

  const fetchCaptchaKeys = useCallback(async (): Promise<void> => {
    try {
      const res = await captchaKeyApi.list()
      setCaptchaKeys(res)
    } catch {
      // Ignore fetch errors
    }
  }, [])

  const fetchProxyProviders = useCallback(async (): Promise<void> => {
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
    loadMarketplaceUrl()
    loadMarketplaceApiKey()
  }, [fetchAppInfo, fetchLogLevel, fetchSettings, fetchCaptchaKeys, fetchProxyProviders])

  const loadMarketplaceUrl = async (): Promise<void> => {
    try {
      const url = await getMarketplaceUrl()
      setMarketplaceUrlLocal(url)
    } catch {
      /* ignore */
    }
  }

  const loadMarketplaceApiKey = async (): Promise<void> => {
    try {
      const key = await getMarketplaceApiKey()
      setMarketplaceApiKeyLocal(key)
    } catch {
      /* ignore */
    }
  }

  const handleSaveMarketplaceApiKey = async (): Promise<void> => {
    setMarketplaceApiKeySaving(true)
    try {
      await setMarketplaceApiKey(marketplaceApiKey)
      setMarketplaceApiKeyMsg(t('common.saveSuccess'))
      setTimeout(() => setMarketplaceApiKeyMsg(''), 3000)
    } catch {
      setErrorMsg(t('common.operationFailed'))
    } finally {
      setMarketplaceApiKeySaving(false)
    }
  }

  const handleSaveMarketplaceUrl = async (): Promise<void> => {
    setMarketplaceSaving(true)
    try {
      await setMarketplaceUrl(marketplaceUrl)
      setMarketplaceMsg(t('common.saveSuccess'))
      setTimeout(() => setMarketplaceMsg(''), 3000)
    } catch {
      setErrorMsg(t('common.operationFailed'))
    } finally {
      setMarketplaceSaving(false)
    }
  }

  const handleSaveLogLevel = async (): Promise<void> => {
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

  

  const handleSaveSettings = async (): Promise<void> => {
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

  const handleAddSetting = async (): Promise<void> => {
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

  const handleDeleteSetting = async (): Promise<void> => {
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

  const openCaptchaKeyAdd = (): void => {
    setEditingCaptchaKey(null)
    setCaptchaKeyForm({ provider: '', apiKey: '' })
    setShowCaptchaKeyForm(true)
  }

  const openCaptchaKeyEdit = (item: CaptchaKey): void => {
    setEditingCaptchaKey(item)
    setCaptchaKeyForm({ provider: item.provider, apiKey: item.apiKey })
    setShowCaptchaKeyForm(true)
  }

  const handleSaveCaptchaKey = async (): Promise<void> => {
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

  const handleDeleteCaptchaKey = async (): Promise<void> => {
    if (!deleteCaptchaKeyId) return
    try {
      await captchaKeyApi.delete(deleteCaptchaKeyId)
      setDeleteCaptchaKeyId(null)
      fetchCaptchaKeys()
    } catch {
      setErrorMsg(t('common.operationFailed'))
    }
  }

  const handleSaveProxyProvider = async (): Promise<void> => {
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

  const handleDeleteProxyProvider = async (): Promise<void> => {
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

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="px-4 py-2 text-sm text-danger bg-danger-light rounded-lg flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-danger/70 hover:text-danger">
            &times;
          </button>
        </div>
      )}

      <h1 className="text-2xl font-bold">{t('settings.title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <section className="bg-bg-card rounded-xl border border-border-light shadow-sm p-5 flex flex-col gap-3 h-full xl:col-span-3 md:col-span-2">
        <h2 className="flex items-center gap-2 text-base font-semibold text-text-primary">
          <Info size={18} />
          {t('settings.about')}
        </h2>
        {appInfo ? (
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div className="text-text-muted">Version</div>
            <div className="font-mono text-text-primary">{appInfo.version}</div>
            <div className="text-text-muted">Data Dir</div>
            <div className="font-mono break-all text-text-primary">{appInfo.dataDir}</div>
            <div className="text-text-muted">Database</div>
            <div>
              {appInfo.dbConnected ? (
                <span className="text-success">Connected</span>
              ) : (
                <span className="text-danger">
                  Disconnected{appInfo.dbError ? `: ${appInfo.dbError}` : ''}
                </span>
              )}
            </div>
            <div className="text-text-muted">{t('dashboard.stats.wallets')}</div>
            <div className="text-text-primary">{appInfo.walletCount}</div>
            <div className="text-text-muted">{t('dashboard.stats.accounts')}</div>
            <div className="text-text-primary">{appInfo.accountCount}</div>
            <div className="text-text-muted">{t('dashboard.stats.proxies')}</div>
            <div className="text-text-primary">{appInfo.proxyCount}</div>
            <div className="text-text-muted">{t('dashboard.stats.tasks')}</div>
            <div className="text-text-primary">
              {appInfo.taskCount} ({appInfo.runningTaskCount} running)
            </div>
          </div>
        ) : (
          <div className="text-sm text-text-muted">{t('common.loading')}</div>
        )}
      </section>

      <section className="bg-bg-card rounded-xl border border-border-light shadow-sm p-5 flex flex-col gap-3 h-full xl:col-span-3 md:col-span-2">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-text-primary">
            <RefreshCw size={18} />
            {t('settings.updates')}
          </h2>
          <button
            onClick={checkForUpdates}
            disabled={updateStatus === 'checking' || updateStatus === 'downloading'}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            {updateStatus === 'checking' ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                {t('updates.checking')}
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                {t('updates.checkNow')}
              </>
            )}
          </button>
        </div>

        {updateError && (
          <div className="px-4 py-2 text-sm text-danger bg-danger-light rounded-lg">
            {updateError}
          </div>
        )}

        {(updateStatus === 'available' || updateStatus === 'downloading') && updateInfo && (
          <div className="px-4 py-3 bg-primary-light border border-primary/30 rounded-lg space-y-2">
            <p className="text-sm text-primary">
              <strong>{t('updates.updateAvailable')}</strong>
            </p>
            <p className="text-sm text-primary">
              {t('updates.version')}: <span className="font-mono">{updateInfo.version}</span>
            </p>
            <p className="text-sm text-primary">
              {t('updates.releaseDate')}:{' '}
              {updateInfo.pub_date ? new Date(updateInfo.pub_date).toLocaleDateString() : '-'}
            </p>
            <button
              onClick={downloadUpdate}
              disabled={(updateStatus as string) === 'downloading'}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors mt-2"
            >
              {(updateStatus as string) === 'downloading' ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  {t('updates.downloading')}
                </>
              ) : (
                <>
                  <Download size={16} />
                  {t('updates.downloadUpdate')}
                </>
              )}
            </button>
            {(updateStatus as string) === 'downloading' && downloadProgress.total > 0 && (
              <div className="w-full bg-bg-tertiary rounded-full h-2.5 mt-2">
                <div
                  className="bg-primary h-2.5 rounded-full transition-width duration-300"
                  style={{ width: `${downloadProgress.percent}%` }}
                />
                <p className="text-xs text-primary mt-1">
                  {Math.round(downloadProgress.percent)}% -{' '}
                  {(downloadProgress.transferred / 1024 / 1024).toFixed(1)}MB /{' '}
                  {(downloadProgress.total / 1024 / 1024).toFixed(1)}MB
                </p>
              </div>
            )}
          </div>
        )}

        {updateStatus === 'downloaded' && (
          <div className="px-4 py-3 bg-success-light border border-success/30 rounded-lg">
            <p className="text-sm text-success mb-2">
              {t('updates.updateReady')}
            </p>
            <button
              onClick={installUpdate}
              className="px-3 py-1.5 text-sm bg-success text-white rounded-lg hover:bg-success-hover transition-colors"
            >
              {t('updates.restartInstall')}
            </button>
          </div>
        )}

        {updateStatus === 'not-available' && (
          <p className="text-sm text-text-muted">{t('updates.noUpdates')}</p>
        )}
      </section>

      {/* 外观 / Theme */}
      <section className="bg-bg-card rounded-xl border border-border-light shadow-sm p-5 flex flex-col gap-3 h-full">
        <h2 className="flex items-center gap-2 text-base font-semibold text-text-primary">
          <RefreshCw size={18} />
          {t('settings.theme')}
        </h2>
        <div className="flex-1 flex items-center">
          <ThemeToggle />
        </div>
      </section>

      {/* 日志级别 / Log Level */}
      <section className="bg-bg-card rounded-xl border border-border-light shadow-sm p-5 flex flex-col gap-3 h-full">
        <h2 className="flex items-center gap-2 text-base font-semibold text-text-primary">
          <Save size={18} />
          {t('logs.level')}
        </h2>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={logLevel}
            onChange={(e) => setLogLevel(e.target.value)}
            className="px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {LOG_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l.toUpperCase()}
              </option>
            ))}
          </select>
          <button
            onClick={handleSaveLogLevel}
            disabled={logLevelSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            <Save size={16} />
            {logLevelSaving ? t('common.loading') : t('common.save')}
          </button>
          {logLevelMsg && <span className="text-sm text-success">{logLevelMsg}</span>}
        </div>
      </section>

      {/* 验证码密钥 / Captcha Keys */}
      <section className="bg-bg-card rounded-xl border border-border-light shadow-sm p-5 flex flex-col gap-3 h-full">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-text-primary">
            <Key size={18} />
            {t('settings.captchaKeys')}
          </h2>
          <button
            onClick={openCaptchaKeyAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            <Plus size={16} />
            {t('settings.addCaptchaKey')}
          </button>
        </div>
        <div className="flex-1 overflow-auto min-h-0">
          {!(captchaKeys?.items || []).length ? (
            <div className="text-sm text-text-muted">{t('settings.noCaptchaKeys')}</div>
          ) : (
            <div className="border border-border-light rounded-lg overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-bg-tertiary">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-text-muted">
                      {t('settings.provider')}
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-text-muted">
                      {t('settings.apiKey')}
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-text-muted">
                      {t('settings.balance')}
                    </th>
                    <th className="px-4 py-2.5 text-right font-medium text-text-muted">
                      {t('common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light/50">
                  {(captchaKeys?.items || []).map((item) => (
                    <tr key={item.id} className="hover:bg-bg-card-hover transition-colors">
                      <td className="px-4 py-2.5">{item.provider}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">{item.apiKey.slice(0, 8)}...</td>
                      <td className="px-4 py-2.5">{item.balance}</td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openCaptchaKeyEdit(item)}
                            className="p-1 text-text-muted hover:text-primary hover:bg-primary-light rounded transition-colors"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteCaptchaKeyId(item.id)}
                            className="p-1 text-danger hover:bg-danger-light rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* 代理提供商 / Proxy Providers */}
      <section className="bg-bg-card rounded-xl border border-border-light shadow-sm p-5 flex flex-col gap-3 h-full">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-text-primary">
            <Globe size={18} />
            {t('settings.proxyProviders')}
          </h2>
        </div>
        <p className="text-xs text-text-muted">
          代理提供商已移至「代理管理」页面统一管理。此处仅作只读展示。
        </p>
        <div className="flex-1 overflow-auto min-h-0">
          {!(proxyProviders?.items || []).length ? (
            <div className="text-sm text-text-muted">{t('settings.noProxyProviders')}</div>
          ) : (
            <div className="border border-border-light rounded-lg overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-bg-tertiary">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-text-muted">
                      {t('settings.providerName')}
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-text-muted">
                      {t('settings.apiUrl')}
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-text-muted">
                      {t('proxies.protocol')}
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-text-muted">
                      {t('settings.refreshInterval')}
                    </th>
                    <th className="px-4 py-2.5 text-right font-medium text-text-muted">
                      {t('common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light/50">
                  {(proxyProviders?.items || []).map((item) => (
                    <tr key={item.id} className="hover:bg-bg-card-hover transition-colors">
                      <td className="px-4 py-2.5">{item.name}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">{item.apiUrl}</td>
                      <td className="px-4 py-2.5 text-xs uppercase">{item.protocol}</td>
                      <td className="px-4 py-2.5">{item.refreshInterval}s</td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="text-xs text-text-muted">只读</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* 脚本/模板市场 / Marketplace */}
      <section className="bg-bg-card rounded-xl border border-border-light shadow-sm p-5 flex flex-col gap-3 h-full xl:col-span-2 md:col-span-2">
        <h2 className="flex items-center gap-2 text-base font-semibold text-text-primary">
          <Server size={18} />
          脚本/模板市场
        </h2>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={marketplaceUrl}
            onChange={(e) => setMarketplaceUrlLocal(e.target.value)}
            placeholder="http://localhost:3400"
            className="flex-1 px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleSaveMarketplaceUrl}
            disabled={marketplaceSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            <Save size={16} />
            {marketplaceSaving ? t('common.loading') : t('common.save')}
          </button>
          {marketplaceMsg && <span className="text-sm text-success">{marketplaceMsg}</span>}
        </div>
        <div className="text-xs text-text-muted">
          设置脚本和模板市场的服务器地址。修改后将在下次打开市场浏览器时生效。
        </div>
        <div className="pt-3 border-t border-border-light space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
            <Key size={16} />
            {t('settings.marketplaceApiKey')}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="password"
              value={marketplaceApiKey}
              onChange={(e) => setMarketplaceApiKeyLocal(e.target.value)}
              placeholder="airdrop-farm-dev-key"
              className="flex-1 px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleSaveMarketplaceApiKey}
              disabled={marketplaceApiKeySaving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
            >
              <Save size={16} />
              {marketplaceApiKeySaving ? t('common.loading') : t('common.save')}
            </button>
            {marketplaceApiKeyMsg && (
              <span className="text-sm text-success">{marketplaceApiKeyMsg}</span>
            )}
          </div>
          <div className="text-xs text-text-muted">{t('settings.marketplaceApiKeyHint')}</div>
        </div>
      </section>

      {/* 通用设置 / General Settings */}
      <section className="bg-bg-card rounded-xl border border-border-light shadow-sm p-5 flex flex-col gap-3 h-full xl:col-span-3 md:col-span-2">
        <h2 className="flex items-center gap-2 text-base font-semibold text-text-primary">
          <Key size={18} />
          {t('settings.general')}
        </h2>
        <div className="flex-1 min-h-0">
          {Object.keys(edited).length === 0 && Object.keys(settings).length === 0 ? (
            <div className="text-sm text-text-muted">{t('common.noData')}</div>
          ) : (
            <div className="space-y-3">
              {Object.entries(edited).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="w-48 text-sm font-mono text-text-muted shrink-0">{key}</label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setEdited((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="flex-1 px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={() => setDeleteSettingKey(key)}
                    className="p-1 text-danger hover:bg-danger-light rounded shrink-0 transition-colors"
                    title={t('common.deleteSetting')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 pt-2 border-t border-border-light mt-3">
            <input
              type="text"
              value={newSettingKey}
              onChange={(e) => setNewSettingKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddSetting()
              }}
              placeholder={t('common.newKey') + '...'}
              className="w-48 px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleAddSetting}
              disabled={!newSettingKey.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-bg-tertiary border border-border-light rounded-lg hover:bg-bg-card-hover disabled:opacity-40 transition-colors"
            >
              <Plus size={16} />
              {t('common.addSetting')}
            </button>
          </div>
        </div>
        {hasChanges && (
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
            >
              <Save size={16} />
              {saving ? t('common.loading') : t('common.save')}
            </button>
          </div>
        )}
      </section>
      </div>

      {/* Sticky save bar */}
      {hasChanges && (
        <div className="sticky bottom-0 -mx-6 px-6 py-3 bg-bg-page/80 backdrop-blur border-t border-border-light flex items-center justify-between gap-3 z-10 mt-4 rounded-b-lg">
          <span className="text-sm text-text-muted">
            <Info size={14} className="inline mr-1" />
            {t('settings.stickyUnsavedChanges')}
          </span>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors shadow-lg"
          >
            <Save size={16} />
            {saving ? t('common.loading') : `${t('common.save')} 设置`}
          </button>
        </div>
      )}

      <Modal
        open={showCaptchaKeyForm}
        onClose={() => setShowCaptchaKeyForm(false)}
        title={editingCaptchaKey ? t('settings.editCaptchaKey') : t('settings.addCaptchaKey')}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t('settings.provider')}
            </label>
            <input
              type="text"
              value={captchaKeyForm.provider}
              onChange={(e) => setCaptchaKeyForm((f) => ({ ...f, provider: e.target.value }))}
              className="w-full px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t('settings.apiKey')}
            </label>
            <input
              type="text"
              value={captchaKeyForm.apiKey}
              onChange={(e) => setCaptchaKeyForm((f) => ({ ...f, apiKey: e.target.value }))}
              className="w-full px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={() => setShowCaptchaKeyForm(false)}
            className="px-4 py-1.5 text-sm border border-border-light rounded-lg hover:bg-bg-card-hover transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSaveCaptchaKey}
            className="px-4 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            {t('common.save')}
          </button>
        </div>
      </Modal>

      <Modal
        open={showProxyProviderForm}
        onClose={() => setShowProxyProviderForm(false)}
        title={editingProxyProvider ? t('settings.editProxyProvider') : t('settings.addProxyProvider')}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t('settings.providerName')}
            </label>
            <input
              type="text"
              value={proxyProviderForm.name}
              onChange={(e) => setProxyProviderForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t('settings.apiUrl')}
            </label>
            <input
              type="text"
              value={proxyProviderForm.apiUrl}
              onChange={(e) => setProxyProviderForm((f) => ({ ...f, apiUrl: e.target.value }))}
              className="w-full px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t('settings.apiKey')}
            </label>
            <input
              type="text"
              value={proxyProviderForm.apiKey}
              onChange={(e) => setProxyProviderForm((f) => ({ ...f, apiKey: e.target.value }))}
              className="w-full px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t('proxies.protocol')}
            </label>
            <select
              value={proxyProviderForm.protocol}
              onChange={(e) =>
                setProxyProviderForm((f) => ({
                  ...f,
                  protocol: e.target.value as 'http' | 'https' | 'socks5'
                }))
              }
              className="w-full px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
              <option value="socks5">SOCKS5</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t('settings.refreshInterval')}
            </label>
            <input
              type="number"
              value={proxyProviderForm.refreshInterval}
              onChange={(e) =>
                setProxyProviderForm((f) => ({ ...f, refreshInterval: Number(e.target.value) }))
              }
              className="w-full px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={() => setShowProxyProviderForm(false)}
            className="px-4 py-1.5 text-sm border border-border-light rounded-lg hover:bg-bg-card-hover transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSaveProxyProvider}
            className="px-4 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            {t('common.save')}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteCaptchaKeyId}
        onClose={() => setDeleteCaptchaKeyId(null)}
        onConfirm={handleDeleteCaptchaKey}
        title={t('common.delete')}
        message={t('settings.confirmDeleteCaptchaKey')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        danger
      />

      <ConfirmDialog
        open={!!deleteProxyProviderId}
        onClose={() => setDeleteProxyProviderId(null)}
        onConfirm={handleDeleteProxyProvider}
        title={t('common.delete')}
        message={t('settings.confirmDeleteProxyProvider')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        danger
      />

      <ConfirmDialog
        open={!!deleteSettingKey}
        onClose={() => setDeleteSettingKey(null)}
        onConfirm={handleDeleteSetting}
        title={t('common.deleteSetting')}
        message={t('common.confirmDeleteSetting')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        danger
      />
    </div>
  )
}

export default Settings
