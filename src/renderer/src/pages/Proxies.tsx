import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { proxyApi } from '../api'
import type { Proxy, ListResponse } from '../types'
import { Plus, Search, Trash2, ChevronLeft, ChevronRight, Edit3, Copy, CheckSquare, Square } from 'lucide-react'

const PAGE_SIZE = 20

const statusColor: Record<string, string> = {
  active: 'bg-status-active-bg text-status-active-text',
  inactive: 'bg-status-inactive-bg text-status-inactive-text',
  expired: 'bg-status-expired-bg text-status-expired-text',
}

const emptyForm = {
  protocol: 'http' as 'http' | 'https' | 'socks5',
  host: '',
  port: 0,
  username: '' as string | null,
  password: '' as string | null,
  status: 'active' as 'active' | 'inactive' | 'expired',
  labels: [] as string[],
}

const Proxies: React.FC = () => {
  const { t } = useTranslation()
  const [data, setData] = useState<ListResponse<Proxy> | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editingProxy, setEditingProxy] = useState<Proxy | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBatchDelete, setShowBatchDelete] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [labelInput, setLabelInput] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    try {
      const res = await proxyApi.list(page, PAGE_SIZE, debouncedSearch)
      setData(res)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAdd = async () => {
    try {
      setErrorMsg('')
      await proxyApi.create({
        protocol: form.protocol,
        host: form.host,
        port: form.port,
        username: form.username || null,
        password: form.password || null,
        status: form.status,
        labels: form.labels,
      })
      setShowAdd(false)
      setForm({ ...emptyForm })
      setLabelInput('')
      fetchData()
    } catch {
      setErrorMsg(t('common.operationFailed'))
    }
  }

  const handleEdit = async () => {
    if (!editingProxy) return
    try {
      setErrorMsg('')
      await proxyApi.update(editingProxy.id, {
        protocol: form.protocol,
        host: form.host,
        port: form.port,
        username: form.username || null,
        password: form.password || null,
        status: form.status,
        labels: form.labels,
      })
      setEditingProxy(null)
      setForm({ ...emptyForm })
      setLabelInput('')
      fetchData()
    } catch {
      setErrorMsg(t('common.operationFailed'))
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await proxyApi.delete(deleteId)
      setDeleteId(null)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(deleteId)
        return next
      })
      fetchData()
    } catch {
      setErrorMsg(t('common.operationFailed'))
    }
  }

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return
    try {
      await proxyApi.batchDelete(Array.from(selectedIds))
      setSelectedIds(new Set())
      setShowBatchDelete(false)
      fetchData()
    } catch {
      setErrorMsg(t('common.operationFailed'))
    }
  }

  const copyProxyAddress = async (proxy: Proxy) => {
    const auth = proxy.username ? `${proxy.username}:${proxy.password}@` : ''
    const address = `${proxy.protocol}://${auth}${proxy.host}:${proxy.port}`
    try {
      await navigator.clipboard.writeText(address)
      setCopiedId(proxy.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {}
  }

  const openEditModal = (proxy: Proxy) => {
    setEditingProxy(proxy)
    setForm({
      protocol: proxy.protocol,
      host: proxy.host,
      port: proxy.port,
      username: proxy.username || '',
      password: proxy.password || '',
      status: proxy.status,
      labels: [...proxy.labels],
    })
    setLabelInput('')
    setErrorMsg('')
  }

  const openAddModal = () => {
    setShowAdd(true)
    setForm({ ...emptyForm })
    setLabelInput('')
    setErrorMsg('')
  }

  const addLabel = () => {
    const trimmed = labelInput.trim()
    if (trimmed && !form.labels.includes(trimmed)) {
      setForm((f) => ({ ...f, labels: [...f.labels, trimmed] }))
      setLabelInput('')
    }
  }

  const removeLabel = (label: string) => {
    setForm((f) => ({ ...f, labels: f.labels.filter((l) => l !== label) }))
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (!data) return
    if (selectedIds.size === data.items.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(data.items.map((p) => p.id)))
    }
  }

  const allSelected = data ? data.items.length > 0 && selectedIds.size === data.items.length : false

  const renderForm = () => (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">{t('proxies.protocol')}</label>
        <select
          value={form.protocol}
          onChange={(e) => setForm((f) => ({ ...f, protocol: e.target.value as 'http' | 'https' | 'socks5' }))}
          className="w-full px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="http">HTTP</option>
          <option value="https">HTTPS</option>
          <option value="socks5">SOCKS5</option>
        </select>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">{t('proxies.host')}</label>
          <input
            type="text"
            value={form.host}
            onChange={(e) => setForm((f) => ({ ...f, host: e.target.value }))}
            className="w-full px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('proxies.port')}</label>
          <input
            type="number"
            value={form.port || ''}
            onChange={(e) => setForm((f) => ({ ...f, port: Number(e.target.value) }))}
            className="w-full px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t('proxies.username')}</label>
        <input
            type="text"
            value={form.username || ''}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            className="w-full px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary"
          />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t('proxies.password')}</label>
        <input
            type="password"
            value={form.password || ''}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="w-full px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary"
          />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t('proxies.status')}</label>
        <select
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as 'active' | 'inactive' | 'expired' }))}
          className="w-full px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t('proxies.labels')}</label>
        <div className="flex flex-wrap gap-1 mb-2">
          {form.labels.map((l) => (
            <span key={l} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">
              {l}
              <button onClick={() => removeLabel(l)} className="hover:text-danger">&times;</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLabel() } }}
            placeholder={t('common.addLabel') + '...'}
            className="flex-1 px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button onClick={addLabel} className="px-3 py-1.5 text-sm border border-border-light rounded-lg hover:bg-bg-card-hover transition-colors">
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="px-4 py-2 text-sm text-danger bg-danger-light rounded-lg flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-danger/70 hover:text-danger">&times;</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('proxies.title')}</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder={t('proxies.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary w-60"
            />
          </div>
          {selectedIds.size > 0 && (
            <button
            onClick={() => setShowBatchDelete(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-danger text-white rounded-lg hover:bg-danger-hover transition-colors"
          >
            <Trash2 size={16} />
            {t('common.batchDelete')} ({selectedIds.size})
          </button>
          )}
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            <Plus size={16} />
            {t('proxies.createProxy')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-text-muted">{t('common.loading')}</div>
      ) : !data?.items.length ? (
        <div className="text-center py-12 text-text-muted">{t('proxies.noProxies')}</div>
      ) : (
        <>
          <div className="overflow-x-auto border border-border-light rounded-lg bg-bg-card">
            <table className="w-full text-sm">
              <thead className="bg-bg-tertiary">
                <tr>
                  <th className="px-4 py-2.5 text-left w-10">
                    <button onClick={toggleSelectAll} className="text-text-muted hover:text-text-primary transition-colors">
                      {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-text-muted">{t('proxies.protocol')}</th>
                  <th className="px-4 py-2.5 text-left font-medium text-text-muted">{t('proxies.host')}:{t('proxies.port')}</th>
                  <th className="px-4 py-2.5 text-left font-medium text-text-muted">{t('proxies.username')}</th>
                  <th className="px-4 py-2.5 text-left font-medium text-text-muted">{t('proxies.status')}</th>
                  <th className="px-4 py-2.5 text-left font-medium text-text-muted">{t('proxies.labels')}</th>
                  <th className="px-4 py-2.5 text-right font-medium text-text-muted">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light/50">
                {data.items.map((proxy) => (
                  <tr key={proxy.id} className="hover:bg-bg-card-hover transition-colors">
                    <td className="px-4 py-2.5">
                      <button onClick={() => toggleSelect(proxy.id)} className="text-text-muted hover:text-text-primary transition-colors">
                        {selectedIds.has(proxy.id) ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} />}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs uppercase">{proxy.protocol}</td>
                    <td className="px-4 py-2.5 font-mono">{proxy.host}:{proxy.port}</td>
                    <td className="px-4 py-2.5">{proxy.username || '-'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[proxy.status] || statusColor.inactive}`}>
                        {proxy.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {proxy.labels.map((l) => (
                          <span key={l} className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded">{l}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => copyProxyAddress(proxy)} className="p-1 text-text-muted hover:text-primary hover:bg-primary-light rounded transition-colors" title={t('proxies.copyAddress')}>
                          {copiedId === proxy.id ? <CheckSquare size={16} className="text-success" /> : <Copy size={16} />}
                        </button>
                        <button onClick={() => openEditModal(proxy)} className="p-1 text-text-muted hover:text-primary hover:bg-primary-light rounded transition-colors" title={t('common.edit')}>
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => setDeleteId(proxy.id)} className="p-1 text-danger hover:bg-danger-light rounded transition-colors" title={t('common.delete')}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded border border-border-light disabled:opacity-40 hover:bg-bg-card-hover transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-text-muted">
                {page} / {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className="p-1.5 rounded border border-border-light disabled:opacity-40 hover:bg-bg-card-hover transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAdd(false)}>
          <div className="bg-bg-card rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">{t('proxies.createProxy')}</h2>
            {renderForm()}
            {errorMsg && <p className="mt-2 text-sm text-danger">{errorMsg}</p>}
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => { setShowAdd(false); setErrorMsg('') }} className="px-4 py-1.5 text-sm border border-border-light rounded-lg hover:bg-bg-card-hover transition-colors">
                {t('common.cancel')}
              </button>
              <button onClick={handleAdd} className="px-4 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors">
                {t('common.create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingProxy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setEditingProxy(null); setErrorMsg('') }}>
          <div className="bg-bg-card rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-text-primary mb-4">{t('proxies.editProxy')}</h2>
            {renderForm()}
            {errorMsg && <p className="mt-2 text-sm text-danger">{errorMsg}</p>}
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => { setEditingProxy(null); setErrorMsg('') }} className="px-4 py-1.5 text-sm border border-border-light rounded-lg hover:bg-bg-card-hover transition-colors">
                {t('common.cancel')}
              </button>
              <button onClick={handleEdit} className="px-4 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors">
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteId(null)}>
          <div className="bg-bg-card rounded-xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-text-primary mb-2">{t('common.delete')}</h2>
            <p className="text-sm text-text-secondary mb-6">{t('proxies.confirmDelete')}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteId(null)} className="px-4 py-1.5 text-sm border border-border-light rounded-lg hover:bg-bg-card-hover transition-colors">
                {t('common.cancel')}
              </button>
              <button onClick={handleDelete} className="px-4 py-1.5 text-sm bg-danger text-white rounded-lg hover:bg-danger-hover transition-colors">
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBatchDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowBatchDelete(false)}>
          <div className="bg-bg-card rounded-xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-text-primary mb-2">{t('common.batchDelete')}</h2>
            <p className="text-sm text-text-secondary mb-6">{t('proxies.confirmBatchDelete', { count: selectedIds.size })}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowBatchDelete(false)} className="px-4 py-1.5 text-sm border border-border-light rounded-lg hover:bg-bg-card-hover transition-colors">
                {t('common.cancel')}
              </button>
              <button onClick={handleBatchDelete} className="px-4 py-1.5 text-sm bg-danger text-white rounded-lg hover:bg-danger-hover transition-colors">
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Proxies
