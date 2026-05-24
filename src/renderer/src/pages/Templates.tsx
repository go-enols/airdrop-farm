import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { templateApi, marketplaceApi, getMarketplaceUrl } from '../api'
import type { Template, RemoteTemplate, ListResponse } from '../types'
import { Search, ChevronLeft, ChevronRight, Download, Globe } from 'lucide-react'
import { Modal } from '../components/common'

const PAGE_SIZE = 10

const Templates: React.FC = () => {
  const { t } = useTranslation()
  const [allItems, setAllItems] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [showMarketplace, setShowMarketplace] = useState(false)
  const [marketItems, setMarketItems] = useState<RemoteTemplate[]>([])
  const [marketLoading, setMarketLoading] = useState(false)
  const [marketError, setMarketError] = useState<string | null>(null)
  const [marketplaceUrl, setMarketplaceUrl] = useState('')
  const [installingId, setInstallingId] = useState<string | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await templateApi.list()
      setAllItems(res.items || [])
    } catch {
      setAllItems([])
      setError(t('common.error'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    getMarketplaceUrl().then(setMarketplaceUrl)
  }, [])

  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return allItems
    const q = debouncedSearch.toLowerCase()
    return allItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        item.version.toLowerCase().includes(q)
    )
  }, [allItems, debouncedSearch])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [totalPages, page])

  const loadMarketplace = async (): Promise<void> => {
    setMarketLoading(true)
    setMarketError(null)
    try {
      const res = await marketplaceApi.listTemplates(marketplaceUrl)
      setMarketItems((res as ListResponse<RemoteTemplate>).items || [])
    } catch (e: unknown) {
      setMarketError(e instanceof Error ? e.message : t('common.error'))
      setMarketItems([])
    } finally {
      setMarketLoading(false)
    }
  }

  const handleInstall = async (template: RemoteTemplate): Promise<void> => {
    setInstallingId(template.id)
    try {
      await marketplaceApi.installTemplate(marketplaceUrl, template)
      await fetchData()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('common.error'))
    } finally {
      setInstallingId(null)
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!window.confirm(t('templates.confirmDelete'))) return
    try {
      await templateApi.delete(id)
      fetchData()
    } catch {
      setError(t('common.error'))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('templates.title')}</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('templates.searchPlaceholder')}
              className="pl-9 pr-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-64"
            />
          </div>
          <button
            onClick={() => setShowMarketplace(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Globe size={16} />
            浏览模板市场
          </button>
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <span>{t('common.loading')}</span>
        </div>
      ) : paged.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Search size={48} />
          <p className="mt-4 text-lg">{t('templates.noTemplates')}</p>
        </div>
      ) : (
        <>
          <div className="dark:bg-bg-card rounded-xl border border-border-light overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-bg-tertiary">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    {t('templates.name')}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    {t('templates.type')}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    {t('templates.version')}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    {t('templates.updatedAt')}
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">
                    {t('templates.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paged.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-50 hover:bg-bg-tertiary transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-gray-600">{item.type}</td>
                    <td className="px-4 py-3 font-mono text-xs">{item.version}</td>
                    <td className="px-4 py-3 text-text-muted text-xs">
                      {new Date(item.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title={t('common.delete')}
                      >
                        <Download size={16} className="rotate-180" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">
              {t('common.total', { count: filtered.length })}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="p-2 rounded-lg border border-border-light hover:bg-bg-tertiary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-600 min-w-[80px] text-center">
                {t('common.page', { current: safePage, total: totalPages })}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="p-2 rounded-lg border border-border-light hover:bg-bg-tertiary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      <Modal
        open={showMarketplace}
        onClose={() => setShowMarketplace(false)}
        title="模板市场"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={marketplaceUrl}
              onChange={(e) => setMarketplaceUrl(e.target.value)}
              placeholder="市场服务器地址"
              className="flex-1 px-3 py-2 rounded-lg border border-border-light bg-bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={loadMarketplace}
              disabled={marketLoading || !marketplaceUrl.trim()}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
            >
              {marketLoading ? '加载中...' : '获取列表'}
            </button>
          </div>

          {marketError && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              {marketError}
            </div>
          )}

          {marketItems.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-sm">
              {marketplaceUrl ? '点击获取列表查看可用模板' : '请输入市场服务器地址'}
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {marketItems.map((tmpl) => {
                const isInstalled = allItems.some(
                  (i) => i.id === tmpl.id
                )
                const needsUpdate = allItems.some(
                  (i) => i.id === tmpl.id && i.version !== tmpl.version
                )
                return (
                  <div
                    key={tmpl.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border-light hover:bg-bg-card-hover transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text-primary">{tmpl.name}</span>
                        <span className="text-xs font-mono text-text-muted">v{tmpl.version}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-bg-tertiary text-text-muted">
                          {tmpl.type}
                        </span>
                        {isInstalled && !needsUpdate && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-success-light text-success">
                            已安装
                          </span>
                        )}
                        {needsUpdate && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-warning-light text-warning">
                            可更新
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted mt-0.5 truncate">{tmpl.description}</p>
                    </div>
                    <button
                      onClick={() => handleInstall(tmpl)}
                      disabled={installingId === tmpl.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 disabled:opacity-50 transition-colors shrink-0"
                    >
                      <Download size={13} />
                      {installingId === tmpl.id
                        ? '安装中...'
                        : needsUpdate
                          ? '更新'
                          : isInstalled
                            ? '重装'
                            : '安装'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default Templates
