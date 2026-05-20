import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { templateApi } from '../api'
import type { Template } from '../types'
import { Plus, Search, Trash2, ChevronLeft, ChevronRight, Edit3 } from 'lucide-react'
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
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', type: '', version: '', schema: '{}' })
  const [creating, setCreating] = useState(false)
  const [editingItem, setEditingItem] = useState<Template | null>(null)
  const [editForm, setEditForm] = useState({ name: '', type: '', version: '', schema: '{}' })
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (page > totalPages) setPage(totalPages)
  }, [totalPages, page])

  const handleCreate = async (): Promise<void> => {
    if (!form.name.trim() || !form.type.trim() || !form.version.trim()) return
    let parsedSchema: Record<string, unknown> = {}
    try {
      parsedSchema = JSON.parse(form.schema || '{}')
    } catch {
      setError(t('common.invalidJson'))
      return
    }
    setCreating(true)
    setError(null)
    try {
      await templateApi.create({
        name: form.name.trim(),
        type: form.type.trim(),
        version: form.version.trim(),
        schema: parsedSchema,
        isLocal: true
      })
      setShowCreate(false)
      setForm({ name: '', type: '', version: '', schema: '{}' })
      fetchData()
    } catch {
      setError(t('common.error'))
    } finally {
      setCreating(false)
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

  const openEdit = (item: Template): void => {
    setEditingItem(item)
    setEditForm({
      name: item.name,
      type: item.type,
      version: item.version,
      schema: JSON.stringify(item.schema, null, 2)
    })
    setEditError(null)
  }

  const handleEdit = async (): Promise<void> => {
    if (!editingItem) return
    let parsedSchema: Record<string, unknown> = {}
    try {
      parsedSchema = JSON.parse(editForm.schema || '{}')
    } catch {
      setEditError(t('common.invalidJson'))
      return
    }
    setSaving(true)
    setEditError(null)
    try {
      await templateApi.update(editingItem.id, {
        name: editForm.name.trim(),
        type: editForm.type.trim(),
        version: editForm.version.trim(),
        schema: parsedSchema
      })
      setEditingItem(null)
      fetchData()
    } catch {
      setEditError(t('common.error'))
    } finally {
      setSaving(false)
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
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            {t('templates.createTemplate')}
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
                    {t('templates.isLocal')}
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
                    <td className="px-4 py-3">
                      {item.isLocal ? (
                        <span className="inline-block px-2 py-0.5 text-xs bg-green-50 text-green-600 rounded-full">
                          {t('templates.isLocal')}
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-text-muted rounded-full">
                          Remote
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs">
                      {new Date(item.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={t('templates.createTemplate')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('templates.name')}
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('templates.type')}
            </label>
            <input
              type="text"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('templates.version')}
            </label>
            <input
              type="text"
              value={form.version}
              onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('templates.schema')} (JSON)
            </label>
            <textarea
              value={form.schema}
              onChange={(e) => setForm((f) => ({ ...f, schema: e.target.value }))}
              rows={6}
              className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono resize-none"
            />
          </div>
        </div>
        {error && <div className="text-red-600 text-sm mt-3">{error}</div>}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setShowCreate(false)}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !form.name.trim() || !form.type.trim() || !form.version.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('common.create')}
          </button>
        </div>
      </Modal>

      <Modal
        open={!!editingItem}
        onClose={() => setEditingItem(null)}
        title={t('templates.editTemplate')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('templates.name')}
            </label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('templates.type')}
            </label>
            <input
              type="text"
              value={editForm.type}
              onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('templates.version')}
            </label>
            <input
              type="text"
              value={editForm.version}
              onChange={(e) => setEditForm((f) => ({ ...f, version: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('templates.schema')} (JSON)
            </label>
            <textarea
              value={editForm.schema}
              onChange={(e) => setEditForm((f) => ({ ...f, schema: e.target.value }))}
              rows={8}
              className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono resize-none"
            />
          </div>
        </div>
        {editError && <div className="text-red-600 text-sm mt-3">{editError}</div>}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setEditingItem(null)}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleEdit}
            disabled={
              saving || !editForm.name.trim() || !editForm.type.trim() || !editForm.version.trim()
            }
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('common.save')}
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default Templates
