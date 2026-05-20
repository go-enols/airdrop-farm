import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { schedulerApi } from '../api'
import type { ScheduledTask } from '../types'
import { Plus, Trash2, Clock, Edit3, ToggleLeft, ToggleRight } from 'lucide-react'
import { useTemplateList } from '../hooks'
import { Modal } from '../components/common'

const Scheduler: React.FC = () => {
  const { t } = useTranslation()
  const [items, setItems] = useState<ScheduledTask[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ templateId: '', cronExpression: '' })
  const [creating, setCreating] = useState(false)
  const [editingItem, setEditingItem] = useState<ScheduledTask | null>(null)
  const [editForm, setEditForm] = useState({ cronExpression: '' })
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const { templates } = useTemplateList()

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await schedulerApi.list()
      setItems(res.items || [])
    } catch {
      setItems([])
      setError(t('common.error'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreate = async () => {
    if (!form.templateId.trim() || !form.cronExpression.trim()) return
    setCreating(true)
    setError(null)
    try {
      await schedulerApi.create({
        templateId: form.templateId.trim(),
        config: {},
        cronExpression: form.cronExpression.trim(),
        enabled: true,
        lastRun: null,
        nextRun: null
      })
      setShowCreate(false)
      setForm({ templateId: '', cronExpression: '' })
      fetchData()
    } catch {
      setError(t('common.error'))
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('scheduler.confirmDelete'))) return
    try {
      await schedulerApi.delete(id)
      fetchData()
    } catch {
      setError(t('common.error'))
    }
  }

  const handleToggle = async (item: ScheduledTask) => {
    setTogglingId(item.id)
    setError(null)
    try {
      await schedulerApi.update(item.id, { enabled: !item.enabled })
      fetchData()
    } catch {
      setError(t('common.error'))
    } finally {
      setTogglingId(null)
    }
  }

  const openEdit = (item: ScheduledTask) => {
    setEditingItem(item)
    setEditForm({ cronExpression: item.cronExpression })
    setEditError(null)
  }

  const handleEdit = async () => {
    if (!editingItem) return
    setSaving(true)
    setEditError(null)
    try {
      await schedulerApi.update(editingItem.id, {
        cronExpression: editForm.cronExpression.trim()
      })
      setEditingItem(null)
      fetchData()
    } catch {
      setEditError(t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const formatTime = (time: string | null) => {
    if (!time) return '—'
    return new Date(time).toLocaleString()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('scheduler.title')}</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          {t('scheduler.createSchedule')}
        </button>
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
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Clock size={48} />
          <p className="mt-4 text-lg">{t('scheduler.noSchedules')}</p>
        </div>
      ) : (
        <div className="dark:bg-bg-card rounded-xl border border-border-light overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-bg-tertiary">
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  {t('scheduler.templateId')}
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  {t('scheduler.cronExpression')}
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  {t('scheduler.enabled')}
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  {t('scheduler.lastRun')}
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  {t('scheduler.nextRun')}
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  {t('scheduler.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-50 hover:bg-bg-tertiary transition-colors"
                >
                  <td className="px-4 py-3 text-xs">
                    {templates.find((t) => t.id === item.templateId)?.name || item.templateId}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{item.cronExpression}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(item)}
                      disabled={togglingId === item.id}
                      className="flex items-center gap-1.5 group"
                    >
                      {item.enabled ? (
                        <>
                          <ToggleRight
                            size={20}
                            className="text-green-500 group-hover:text-green-600 transition-colors"
                          />
                          <span className="text-xs font-medium text-green-600">
                            {t('scheduler.enabled')}
                          </span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft
                            size={20}
                            className="text-gray-400 group-hover:text-text-muted transition-colors"
                          />
                          <span className="text-xs font-medium text-text-muted">
                            {t('scheduler.disabled')}
                          </span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs">{formatTime(item.lastRun)}</td>
                  <td className="px-4 py-3 text-text-muted text-xs">{formatTime(item.nextRun)}</td>
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
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={t('scheduler.createSchedule')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('scheduler.templateId')}
            </label>
            <select
              value={form.templateId}
              onChange={(e) => setForm((f) => ({ ...f, templateId: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{t('scheduler.selectTemplate')}</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.type})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('scheduler.cronExpression')}
            </label>
            <input
              type="text"
              value={form.cronExpression}
              onChange={(e) => setForm((f) => ({ ...f, cronExpression: e.target.value }))}
              placeholder="* * * * *"
              className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setShowCreate(false)}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !form.templateId.trim() || !form.cronExpression.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('common.create')}
          </button>
        </div>
      </Modal>

      <Modal
        open={!!editingItem}
        onClose={() => setEditingItem(null)}
        title={t('scheduler.editSchedule')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('scheduler.templateId')}
            </label>
            <input
              type="text"
              value={
                templates.find((t) => t.id === editingItem?.templateId)?.name ||
                editingItem?.templateId
              }
              disabled
              className="w-full px-3 py-2 text-sm border border-border-light rounded-lg bg-bg-tertiary text-text-muted"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('scheduler.cronExpression')}
            </label>
            <input
              type="text"
              value={editForm.cronExpression}
              onChange={(e) => setEditForm((f) => ({ ...f, cronExpression: e.target.value }))}
              placeholder="* * * * *"
              className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
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
            disabled={saving || !editForm.cronExpression.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('common.save')}
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default Scheduler
