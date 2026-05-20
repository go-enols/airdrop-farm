import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { settingApi, appApi, captchaKeyApi, proxyProviderApi } from '../api'
import { logApi } from '../api'
import type { AppInfo, CaptchaKey, ProxyProvider, ListResponse } from '../types'
import { Save, Info, Plus, Trash2, Edit3, Key, Globe } from 'lucide-react'

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
  const [editingProxyProvider, setEditingProxyProvider] = useState<ProxyProvider | null>(null)
  const [proxyProviderForm, setProxyProviderForm] = useState({
    name: '',
    apiUrl: '',
    apiKey: '',
    protocol: 'http' as 'http' | 'https' | 'socks5',
    refreshInterval: 300,
  })
  const [deleteProxyProviderId, setDeleteProxyProviderId] = useState<string | null>(null)

  const [newSettingKey, setNewSettingKey] = useState('')
  const [deleteSettingKey, setDeleteSettingKey] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const fetchAppInfo = useCallback(async () => {
    try {
      const info = await appApi.getInfo()
      setAppInfo(info)
    } catch {}
  }, [])

  const fetchLogLevel = useCallback(async () => {
    try {
      const level = await logApi.getLevel()
      setLogLevel(level)
    } catch {}
  }, [])

  const fetchSettings = useCallback(async () => {
    try {
      const all = await settingApi.getAll()
      setSettings(all)
      setEdited(all)
    } catch {}
  }, [])

  const fetchCaptchaKeys = useCallback(async () => {
    try {
      const res = await captchaKeyApi.list()
      setCaptchaKeys(res)
    } catch {}
  }, [])

  const fetchProxyProviders = useCallback(async () => {
    try {
      const res = await proxyProviderApi.list()
      setProxyProviders(res)
    } catch {}
  }, [])

  useEffect(() => {
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

  const openCaptchaKeyEdit = (item: CaptchaKey) => {
    setEditingCaptchaKey(item)
    setCaptchaKeyForm({ provider: item.provider, apiKey: item.apiKey })
    setShowCaptchaKeyForm(true)
  }

  const handleSaveCaptchaKey = async () => {
    try {
      if (editingCaptchaKey) {
        await captchaKeyApi.update(editingCaptchaKey.id, {
          provider: captchaKeyForm.provider,
          apiKey: captchaKeyForm.apiKey,
        })
      } else {
        await captchaKeyApi.create({
          provider: captchaKeyForm.provider,
          apiKey: captchaKeyForm.apiKey,
          balance: 0,
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
    setProxyProviderForm({ name: '', apiUrl: '', apiKey: '', protocol: 'http', refreshInterval: 300 })
    setShowProxyProviderForm(true)
  }

  const openProxyProviderEdit = (item: ProxyProvider) => {
    setEditingProxyProvider(item)
    setProxyProviderForm({
      name: item.name,
      apiUrl: item.apiUrl,
      apiKey: item.apiKey,
      protocol: item.protocol,
      refreshInterval: item.refreshInterval,
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
          refreshInterval: proxyProviderForm.refreshInterval,
        })
      } else {
        await proxyProviderApi.create({
          name: proxyProviderForm.name,
          apiUrl: proxyProviderForm.apiUrl,
          apiKey: proxyProviderForm.apiKey,
          protocol: proxyProviderForm.protocol,
          refreshInterval: proxyProviderForm.refreshInterval,
          lastSync: null,
          labels: [],
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

  const hasChanges = Object.keys(edited).some((key) => edited[key] !== settings[key]) || Object.keys(edited).length !== Object.keys(settings).length

  return (
    <div className="space-y-6 max-w-3xl">
      {errorMsg && (
        <div className="px-4 py-2 text-sm text-danger bg-danger-light rounded-lg flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-danger/70 hover:text-danger">&times;</button>
        </div>
      )}

      <h1 className="text-2xl font-bold">{t('settings.title')}</h1>

      <section className="border border-border-light rounded-lg p-5 space-y-3 bg-bg-card">
        <div className="flex items-center gap-2 text-lg font-semibold text-text-primary">
          <Info size={20} />
          {t('settings.about')}
        </div>
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
                <span className="text-danger">Disconnected{appInfo.dbError ? `: ${appInfo.dbError}` : ''}</span>
              )}
            </div>
            <div className="text-text-muted">{t('dashboard.stats.wallets')}</div>
            <div className="text-text-primary">{appInfo.walletCount}</div>
            <div className="text-text-muted">{t('dashboard.stats.accounts')}</div>
            <div className="text-text-primary">{appInfo.accountCount}</div>
            <div className="text-text-muted">{t('dashboard.stats.proxies')}</div>
            <div className="text-text-primary">{appInfo.proxyCount}</div>
            <div className="text-text-muted">{t('dashboard.stats.tasks')}</div>
            <div className="text-text-primary">{appInfo.taskCount} ({appInfo.runningTaskCount} running)</div>
          </div>
        ) : (
          <div className="text-sm text-text-muted">{t('common.loading')}</div>
        )}
      </section>

      <section className="border border-border-light rounded-lg p-5 space-y-3 bg-bg-card">
        <div className="text-lg font-semibold text-text-primary">{t('logs.level')}</div>
        <div className="flex items-center gap-3">
          <select
            value={logLevel}
            onChange={(e) => setLogLevel(e.target.value)}
            className="px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {LOG_LEVELS.map((l) => (
              <option key={l} value={l}>{l.toUpperCase()}</option>
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
          {logLevelMsg && (
            <span className="text-sm text-success">{logLevelMsg}</span>
          )}
        </div>
      </section>

      <section className="border border-border-light rounded-lg p-5 space-y-3 bg-bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-semibold text-text-primary">
            <Key size={20} />
            {t('settings.captchaKeys')}
          </div>
          <button
            onClick={openCaptchaKeyAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            <Plus size={16} />
            {t('settings.addCaptchaKey')}
          </button>
        </div>
        {!(captchaKeys?.items || []).length ? (
          <div className="text-sm text-text-muted">{t('settings.noCaptchaKeys')}</div>
        ) : (
          <div className="overflow-x-auto border border-border-light rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-bg-tertiary">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-text-muted">{t('settings.provider')}</th>
                  <th className="px-4 py-2.5 text-left font-medium text-text-muted">{t('settings.apiKey')}</th>
                  <th className="px-4 py-2.5 text-left font-medium text-text-muted">{t('settings.balance')}</th>
                  <th className="px-4 py-2.5 text-right font-medium text-text-muted">{t('common.actions')}</th>
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
                        <button onClick={() => openCaptchaKeyEdit(item)} className="p-1 text-text-muted hover:text-primary hover:bg-primary-light rounded transition-colors">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => setDeleteCaptchaKeyId(item.id)} className="p-1 text-danger hover:bg-danger-light rounded transition-colors">
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
      </section>

      <section className="border border-border-light rounded-lg p-5 space-y-3 bg-bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-semibold text-text-primary">
            <Globe size={20} />
            {t('settings.proxyProviders')}
          </div>
          <button
            onClick={openProxyProviderAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            <Plus size={16} />
            {t('settings.addProxyProvider')}
          </button>
        </div>
        {!(proxyProviders?.items || []).length ? (
          <div className="text-sm text-text-muted">{t('settings.noProxyProviders')}</div>
        ) : (
          <div className="overflow-x-auto border border-border-light rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-bg-tertiary">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-text-muted">{t('settings.providerName')}</th>
                  <th className="px-4 py-2.5 text-left font-medium text-text-muted">{t('settings.apiUrl')}</th>
                  <th className="px-4 py-2.5 text-left font-medium text-text-muted">{t('proxies.protocol')}</th>
                  <th className="px-4 py-2.5 text-left font-medium text-text-muted">{t('settings.refreshInterval')}</th>
                  <th className="px-4 py-2.5 text-right font-medium text-text-muted">{t('common.actions')}</th>
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
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openProxyProviderEdit(item)} className="p-1 text-text-muted hover:text-primary hover:bg-primary-light rounded transition-colors">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => setDeleteProxyProviderId(item.id)} className="p-1 text-danger hover:bg-danger-light rounded transition-colors">
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
      </section>

      <section className="border border-border-light rounded-lg p-5 space-y-3 bg-bg-card">
        <div className="text-lg font-semibold text-text-primary">{t('settings.general')}</div>
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
        <div className="flex items-center gap-3 pt-2 border-t border-border-light">
          <input
            type="text"
            value={newSettingKey}
            onChange={(e) => setNewSettingKey(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddSetting() }}
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

      {showCaptchaKeyForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCaptchaKeyForm(false)}>
          <div className="bg-bg-card rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-text-primary mb-4">{editingCaptchaKey ? t('settings.editCaptchaKey') : t('settings.addCaptchaKey')}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">{t('settings.provider')}</label>
                <input
                  type="text"
                  value={captchaKeyForm.provider}
                  onChange={(e) => setCaptchaKeyForm((f) => ({ ...f, provider: e.target.value }))}
                  className="w-full px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">{t('settings.apiKey')}</label>
                <input
                  type="text"
                  value={captchaKeyForm.apiKey}
                  onChange={(e) => setCaptchaKeyForm((f) => ({ ...f, apiKey: e.target.value }))}
                  className="w-full px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowCaptchaKeyForm(false)} className="px-4 py-1.5 text-sm border border-border-light rounded-lg hover:bg-bg-card-hover transition-colors">
                {t('common.cancel')}
              </button>
              <button onClick={handleSaveCaptchaKey} className="px-4 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors">
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showProxyProviderForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowProxyProviderForm(false)}>
          <div className="bg-bg-card rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-text-primary mb-4">{editingProxyProvider ? t('settings.editProxyProvider') : t('settings.addProxyProvider')}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">{t('settings.providerName')}</label>
                <input
                  type="text"
                  value={proxyProviderForm.name}
                  onChange={(e) => setProxyProviderForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">{t('settings.apiUrl')}</label>
                <input
                  type="text"
                  value={proxyProviderForm.apiUrl}
                  onChange={(e) => setProxyProviderForm((f) => ({ ...f, apiUrl: e.target.value }))}
                  className="w-full px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">{t('settings.apiKey')}</label>
                <input
                  type="text"
                  value={proxyProviderForm.apiKey}
                  onChange={(e) => setProxyProviderForm((f) => ({ ...f, apiKey: e.target.value }))}
                  className="w-full px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">{t('proxies.protocol')}</label>
                <select
                  value={proxyProviderForm.protocol}
                  onChange={(e) => setProxyProviderForm((f) => ({ ...f, protocol: e.target.value as 'http' | 'https' | 'socks5' }))}
                  className="w-full px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="http">HTTP</option>
                  <option value="https">HTTPS</option>
                  <option value="socks5">SOCKS5</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">{t('settings.refreshInterval')}</label>
                <input
                  type="number"
                  value={proxyProviderForm.refreshInterval}
                  onChange={(e) => setProxyProviderForm((f) => ({ ...f, refreshInterval: Number(e.target.value) }))}
                  className="w-full px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowProxyProviderForm(false)} className="px-4 py-1.5 text-sm border border-border-light rounded-lg hover:bg-bg-card-hover transition-colors">
                {t('common.cancel')}
              </button>
              <button onClick={handleSaveProxyProvider} className="px-4 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors">
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteCaptchaKeyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteCaptchaKeyId(null)}>
          <div className="bg-bg-card rounded-xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-text-primary mb-2">{t('common.delete')}</h2>
            <p className="text-sm text-text-secondary mb-6">{t('settings.confirmDeleteCaptchaKey')}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteCaptchaKeyId(null)} className="px-4 py-1.5 text-sm border border-border-light rounded-lg hover:bg-bg-card-hover transition-colors">
                {t('common.cancel')}
              </button>
              <button onClick={handleDeleteCaptchaKey} className="px-4 py-1.5 text-sm bg-danger text-white rounded-lg hover:bg-danger-hover transition-colors">
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteProxyProviderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteProxyProviderId(null)}>
          <div className="bg-bg-card rounded-xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-text-primary mb-2">{t('common.delete')}</h2>
            <p className="text-sm text-text-secondary mb-6">{t('settings.confirmDeleteProxyProvider')}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteProxyProviderId(null)} className="px-4 py-1.5 text-sm border border-border-light rounded-lg hover:bg-bg-card-hover transition-colors">
                {t('common.cancel')}
              </button>
              <button onClick={handleDeleteProxyProvider} className="px-4 py-1.5 text-sm bg-danger text-white rounded-lg hover:bg-danger-hover transition-colors">
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteSettingKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteSettingKey(null)}>
          <div className="bg-bg-card rounded-xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-text-primary mb-2">{t('common.deleteSetting')}</h2>
            <p className="text-sm text-text-secondary mb-6">{t('common.confirmDeleteSetting')}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteSettingKey(null)} className="px-4 py-1.5 text-sm border border-border-light rounded-lg hover:bg-bg-card-hover transition-colors">
                {t('common.cancel')}
              </button>
              <button onClick={handleDeleteSetting} className="px-4 py-1.5 text-sm bg-danger text-white rounded-lg hover:bg-danger-hover transition-colors">
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
