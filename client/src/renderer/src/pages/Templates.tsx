import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { templateApi, marketplaceApi, getMarketplaceUrl, scriptApi } from '../api'
import type { Template, RemoteTemplate, RemoteScript, InstalledScript } from '../types'
import { Search, Download, RefreshCw, Globe, FileText, Users, Zap, ChevronDown } from 'lucide-react'

const Templates: React.FC = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'templates' | 'scripts'>('templates')
  const [marketplaceUrl, setMarketplaceUrl] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [accountTemplates, setAccountTemplates] = useState<RemoteTemplate[]>([])
  const [installedTemplates, setInstalledTemplates] = useState<Template[]>([])
  const [taskScripts, setTaskScripts] = useState<RemoteScript[]>([])
  const [installedScripts, setInstalledScripts] = useState<InstalledScript[]>([])
  const [installingId, setInstallingId] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  useEffect(() => {
    getMarketplaceUrl().then((url) => {
      setMarketplaceUrl(url)
      setUrlInput(url)
    })
  }, [])

  const loadInstalled = useCallback(async () => {
    try {
      const [tplRes, scriptRes] = await Promise.all([
        templateApi.list(1, 999),
        scriptApi.listInstalled()
      ])
      setInstalledTemplates(tplRes.items || [])
      setInstalledScripts(scriptRes || [])
    } catch { /* non-critical */ }
  }, [])

  useEffect(() => { loadInstalled() }, [loadInstalled])

  const fetchMarketplace = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [tplRes, scriptRes] = await Promise.all([
        marketplaceApi.listTemplates(marketplaceUrl),
        marketplaceApi.listScripts(marketplaceUrl)
      ])
      setAccountTemplates((tplRes as any).items || [])
      setTaskScripts((scriptRes as any).items || [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('common.error'))
    } finally {
      setLoading(false)
    }
  }, [marketplaceUrl, t])

  useEffect(() => {
    if (marketplaceUrl) fetchMarketplace()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleInstallTemplate = async (tmpl: RemoteTemplate): Promise<void> => {
    setInstallingId(tmpl.id)
    try {
      await marketplaceApi.installTemplate(marketplaceUrl, tmpl)
      await loadInstalled()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('common.error'))
    } finally {
      setInstallingId(null)
    }
  }

  const handleInstallScript = async (id: string): Promise<void> => {
    setInstallingId(id)
    try {
      await scriptApi.download(id)
      await loadInstalled()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('common.error'))
    } finally {
      setInstallingId(null)
    }
  }

  const filteredTemplates = useMemo(() => {
    if (!debouncedSearch.trim()) return accountTemplates
    const q = debouncedSearch.toLowerCase()
    return accountTemplates.filter((t) =>
      t.name.toLowerCase().includes(q) || t.type.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    )
  }, [accountTemplates, debouncedSearch])

  const filteredScripts = useMemo(() => {
    if (!debouncedSearch.trim()) return taskScripts
    const q = debouncedSearch.toLowerCase()
    return taskScripts.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      (s.description && s.description.toLowerCase().includes(q))
    )
  }, [taskScripts, debouncedSearch])

  const getTemplateStatus = (id: string, version: string) => {
    const installed = installedTemplates.find((i) => i.id === id)
    if (!installed) return 'none' as const
    if (installed.version !== version) return 'update' as const
    return 'installed' as const
  }

  const getScriptStatus = (id: string, version: string) => {
    const installed = installedScripts.find((i) => i.id === id)
    if (!installed) return 'none' as const
    if (installed.version !== version) return 'update' as const
    return 'installed' as const
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('templates.title')}</h1>
        <div className="flex items-center gap-2">
          <Globe size={16} className="text-text-muted" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onBlur={() => { if (urlInput.trim()) setMarketplaceUrl(urlInput.trim()) }}
            onKeyDown={(e) => { if (e.key === 'Enter' && urlInput.trim()) { setMarketplaceUrl(urlInput.trim()); fetchMarketplace() } }}
            placeholder="http://localhost:3400"
            className="px-3 py-1.5 text-xs border border-border-light rounded-lg bg-bg-card w-52 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={fetchMarketplace}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            {t('common.refresh')}
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border-light pb-0">
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors -mb-[1px] border-b-2 ${
            activeTab === 'templates'
              ? 'text-primary border-primary bg-primary/5'
              : 'text-text-muted border-transparent hover:text-text-secondary'
          }`}
        >
          <Users size={16} />
          {t('templates.accountTemplates')} ({accountTemplates.length})
        </button>
        <button
          onClick={() => setActiveTab('scripts')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors -mb-[1px] border-b-2 ${
            activeTab === 'scripts'
              ? 'text-primary border-primary bg-primary/5'
              : 'text-text-muted border-transparent hover:text-text-secondary'
          }`}
        >
          <Zap size={16} />
          {t('templates.taskScripts')} ({taskScripts.length})
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('common.search')}
            className="pl-9 pr-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-full"
          />
        </div>
      </div>

      {error && (
        <div className="text-danger text-sm bg-danger-light border border-danger/30 rounded-lg px-4 py-2 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-danger font-bold ml-2">×</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-text-muted">
          <RefreshCw size={24} className="animate-spin mr-2" />
          <span>{t('common.loading')}</span>
        </div>
      ) : (
        <>
          {activeTab === 'templates' && (
            filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                <FileText size={48} />
                <p className="mt-4 text-lg">{t('templates.noTemplates')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredTemplates.map((tmpl) => {
                  const status = getTemplateStatus(tmpl.id, tmpl.version)
                  return (
                    <div
                      key={tmpl.id}
                      className="flex flex-col p-4 rounded-xl border border-border-light bg-bg-card hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-1.5 rounded-lg bg-primary/10">
                            <FileText size={18} className="text-primary" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-medium text-text-primary truncate">{tmpl.name}</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs px-1.5 py-0.5 rounded bg-bg-tertiary text-text-muted">
                                {tmpl.type}
                              </span>
                              <span className="text-xs font-mono text-text-muted">v{tmpl.version}</span>
                            </div>
                          </div>
                        </div>
                        {status === 'installed' && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-success-light text-success shrink-0">
                            {t('templates.installed')}
                          </span>
                        )}
                        {status === 'update' && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-warning-light text-warning shrink-0">
                            {t('templates.updatable')}
                          </span>
                        )}
                      </div>
                      {tmpl.description && (
                        <p className="text-xs text-text-muted mb-3 line-clamp-2">{tmpl.description}</p>
                      )}
                      <div className="mt-auto flex items-center justify-between">
                        <span className="text-xs text-text-muted">
                          {t('templates.downloadCount')}: {tmpl.downloadCount ?? 0}
                        </span>
                        <button
                          onClick={() => handleInstallTemplate(tmpl)}
                          disabled={installingId === tmpl.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
                        >
                          <Download size={12} />
                          {installingId === tmpl.id
                            ? t('templates.installing')
                            : status === 'update'
                              ? t('templates.update')
                              : status === 'installed'
                                ? t('templates.reinstall')
                                : t('templates.install')}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          )}

          {activeTab === 'scripts' && (
            filteredScripts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                <Zap size={48} />
                <p className="mt-4 text-lg">{t('templates.noScripts')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredScripts.map((script) => {
                  const status = getScriptStatus(script.id, script.version)
                  return (
                    <div
                      key={script.id}
                      className="flex flex-col p-4 rounded-xl border border-border-light bg-bg-card hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-1.5 rounded-lg bg-warning/10">
                            <Zap size={18} className="text-warning" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-medium text-text-primary truncate">{script.name}</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs font-mono text-text-muted">v{script.version}</span>
                              {script.tags?.slice(0, 2).map((tag) => (
                                <span key={tag} className="text-xs px-1 py-0 rounded bg-bg-tertiary text-text-muted">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        {status === 'installed' && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-success-light text-success shrink-0">
                            {t('templates.installed')}
                          </span>
                        )}
                        {status === 'update' && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-warning-light text-warning shrink-0">
                            {t('templates.updatable')}
                          </span>
                        )}
                      </div>
                      {script.description && (
                        <p className="text-xs text-text-muted mb-3 line-clamp-2">{script.description}</p>
                      )}
                      {script.changelog && (
                        <details className="mb-2">
                          <summary className="text-xs text-text-muted cursor-pointer hover:text-text-secondary flex items-center gap-1">
                            <ChevronDown size={10} />
                            {t('templates.changelog')}
                          </summary>
                          <p className="text-xs text-text-muted mt-1 whitespace-pre-wrap">
                            {script.changelog}
                          </p>
                        </details>
                      )}
                      <div className="mt-auto flex items-center justify-between">
                        <span className="text-xs text-text-muted">
                          {new Date(script.updatedAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleInstallScript(script.id)}
                          disabled={installingId === script.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
                        >
                          <Download size={12} />
                          {installingId === script.id
                            ? t('templates.installing')
                            : status === 'update'
                              ? t('templates.update')
                              : status === 'installed'
                                ? t('templates.reinstall')
                                : t('templates.install')}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}

export default Templates