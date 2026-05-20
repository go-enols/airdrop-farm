import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { airdropApi } from '../api'
import type {
  AirdropProject,
  AirdropStatus,
  AirdropProjectType,
  AirdropLink,
  AirdropTaskItem,
  Earning
} from '../types'
import {
  Plus,
  Trash2,
  ExternalLink,
  Edit3,
  ChevronDown,
  ChevronUp,
  Link,
  DollarSign,
  ListChecks
} from 'lucide-react'
import { usePaginatedList } from '../hooks'
import { SearchInput, Pagination, Modal } from '../components/common'

const PAGE_SIZE = 12

const STATUS_COLORS: Record<AirdropStatus, string> = {
  ongoing: 'bg-blue-50 text-blue-600',
  completed: 'bg-green-50 text-green-600',
  cancelled: 'bg-red-50 text-red-600',
  claimed: 'bg-purple-50 text-purple-600'
}

const TYPE_COLORS: Record<AirdropProjectType, string> = {
  testnet: 'bg-cyan-50 text-cyan-600',
  mainnet: 'bg-blue-50 text-blue-600',
  galxe: 'bg-orange-50 text-orange-600',
  quest: 'bg-purple-50 text-purple-600',
  social: 'bg-pink-50 text-pink-600',
  other: 'bg-gray-100 text-gray-600'
}

const STATUS_KEYS: Record<AirdropStatus, string> = {
  ongoing: 'airdrops.statusOngoing',
  completed: 'airdrops.statusCompleted',
  cancelled: 'airdrops.statusCancelled',
  claimed: 'airdrops.statusClaimed'
}

const TYPE_KEYS: Record<AirdropProjectType, string> = {
  testnet: 'airdrops.typeTestnet',
  mainnet: 'airdrops.typeMainnet',
  galxe: 'airdrops.typeGalxe',
  quest: 'airdrops.typeQuest',
  social: 'airdrops.typeSocial',
  other: 'airdrops.typeOther'
}

const AIRDROP_STATUSES: AirdropStatus[] = ['ongoing', 'completed', 'cancelled', 'claimed']
const AIRDROP_TYPES: AirdropProjectType[] = [
  'testnet',
  'mainnet',
  'galxe',
  'quest',
  'social',
  'other'
]

interface EditFormData {
  name: string
  chain: string
  status: AirdropStatus
  projectType: AirdropProjectType
  description: string
  links: AirdropLink[]
  tasks: AirdropTaskItem[]
  earnings: Earning[]
  tags: string
  labels: string
}

const Airdrops: React.FC = () => {
  const { t } = useTranslation()
  const { items, total, page, totalPages, loading, error, setPage, setSearch, search, refresh } =
    usePaginatedList<AirdropProject>((p, ps, s) => airdropApi.list(p, ps, s), PAGE_SIZE)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<{
    name: string
    chain: string
    status: AirdropStatus
    projectType: AirdropProjectType
    description: string
  }>({ name: '', chain: '', status: 'ongoing', projectType: 'testnet', description: '' })
  const [creating, setCreating] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<AirdropProject | null>(null)
  const [editForm, setEditForm] = useState<EditFormData>({
    name: '',
    chain: '',
    status: 'ongoing',
    projectType: 'testnet',
    description: '',
    links: [],
    tasks: [],
    earnings: [],
    tags: '',
    labels: ''
  })
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)

  const handleCreate = useCallback(async () => {
    if (!form.name.trim() || !form.chain.trim()) return
    setCreating(true)
    setCreateError(null)
    try {
      await airdropApi.create({
        name: form.name.trim(),
        chain: form.chain.trim(),
        status: form.status,
        projectType: form.projectType,
        description: form.description.trim(),
        links: [],
        eligibilityCriteria: [],
        tasks: [],
        earnings: [],
        tags: [],
        labels: []
      })
      setShowCreate(false)
      setForm({ name: '', chain: '', status: 'ongoing', projectType: 'testnet', description: '' })
      refresh()
    } catch {
      setCreateError(t('common.error'))
    } finally {
      setCreating(false)
    }
  }, [form, t, refresh])

  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm(t('airdrops.confirmDelete'))) return
      try {
        await airdropApi.delete(id)
        refresh()
      } catch {}
    },
    [t, refresh]
  )

  const openEdit = (item: AirdropProject) => {
    setEditingItem(item)
    setEditForm({
      name: item.name,
      chain: item.chain,
      status: item.status,
      projectType: item.projectType,
      description: item.description,
      links: [...item.links],
      tasks: item.tasks.map((t) => ({ ...t })),
      earnings: item.earnings.map((e) => ({ ...e })),
      tags: item.tags.join(', '),
      labels: item.labels.join(', ')
    })
    setEditError(null)
  }

  const handleEdit = useCallback(async () => {
    if (!editingItem) return
    setSaving(true)
    setEditError(null)
    try {
      await airdropApi.update(editingItem.id, {
        name: editForm.name.trim(),
        chain: editForm.chain.trim(),
        status: editForm.status,
        projectType: editForm.projectType,
        description: editForm.description.trim(),
        links: editForm.links,
        tasks: editForm.tasks,
        earnings: editForm.earnings,
        tags: editForm.tags
          ? editForm.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        labels: editForm.labels
          ? editForm.labels
              .split(',')
              .map((l) => l.trim())
              .filter(Boolean)
          : []
      })
      setEditingItem(null)
      refresh()
    } catch {
      setEditError(t('common.error'))
    } finally {
      setSaving(false)
    }
  }, [editingItem, editForm, t, refresh])

  const addLink = () => {
    setEditForm((f) => ({ ...f, links: [...f.links, { label: '', url: '' }] }))
  }

  const removeLink = (index: number) => {
    setEditForm((f) => ({ ...f, links: f.links.filter((_, i) => i !== index) }))
  }

  const updateLink = (index: number, field: keyof AirdropLink, value: string) => {
    setEditForm((f) => ({
      ...f,
      links: f.links.map((l, i) => (i === index ? { ...l, [field]: value } : l))
    }))
  }

  const addTask = () => {
    setEditForm((f) => ({
      ...f,
      tasks: [
        ...f.tasks,
        {
          id: crypto.randomUUID(),
          title: '',
          description: '',
          status: 'pending' as const,
          notes: ''
        }
      ]
    }))
  }

  const removeTask = (index: number) => {
    setEditForm((f) => ({ ...f, tasks: f.tasks.filter((_, i) => i !== index) }))
  }

  const updateTask = (index: number, field: keyof AirdropTaskItem, value: string) => {
    setEditForm((f) => ({
      ...f,
      tasks: f.tasks.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    }))
  }

  const addEarning = () => {
    setEditForm((f) => ({
      ...f,
      earnings: [
        ...f.earnings,
        {
          id: crypto.randomUUID(),
          token: '',
          amount: 0,
          date: new Date().toISOString().slice(0, 10),
          notes: ''
        }
      ]
    }))
  }

  const removeEarning = (index: number) => {
    setEditForm((f) => ({ ...f, earnings: f.earnings.filter((_, i) => i !== index) }))
  }

  const updateEarning = (index: number, field: keyof Earning, value: string | number) => {
    setEditForm((f) => ({
      ...f,
      earnings: f.earnings.map((e, i) => (i === index ? { ...e, [field]: value } : e))
    }))
  }

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('airdrops.title')}</h1>
        <div className="flex items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('airdrops.searchPlaceholder')}
          />
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            {t('airdrops.createAirdrop')}
          </button>
        </div>
      </div>

      {(error || createError) && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {createError || t('common.error')}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <span>{t('common.loading')}</span>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <ExternalLink size={48} />
          <p className="mt-4 text-lg">{t('airdrops.noAirdrops')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="dark:bg-bg-card rounded-xl border border-border-light p-4 hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-base truncate flex-1 mr-2">{item.name}</h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(item)}
                      className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${STATUS_COLORS[item.status]}`}
                  >
                    {t(STATUS_KEYS[item.status])}
                  </span>
                  <span
                    className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${TYPE_COLORS[item.projectType]}`}
                  >
                    {t(TYPE_KEYS[item.projectType])}
                  </span>
                </div>
                <div className="text-sm text-text-muted mb-2">{item.chain}</div>
                {item.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                )}
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-text-muted rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => toggleExpand(item.id)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mt-2 transition-colors"
                >
                  {expandedId === item.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {expandedId === item.id ? t('common.close') : t('common.edit')}
                </button>

                {expandedId === item.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                    <div>
                      <div className="flex items-center gap-1 text-xs font-medium text-text-muted mb-1">
                        <Link size={12} />
                        {t('airdrops.links')}
                      </div>
                      {item.links.length === 0 ? (
                        <p className="text-xs text-gray-300">{t('airdrops.noLinks')}</p>
                      ) : (
                        <div className="space-y-1">
                          {item.links.map((link, i) => (
                            <a
                              key={i}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700"
                            >
                              <ExternalLink size={10} />
                              {link.label || link.url}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-xs font-medium text-text-muted mb-1">
                        <ListChecks size={12} />
                        {t('airdrops.tasks')}
                      </div>
                      {item.tasks.length === 0 ? (
                        <p className="text-xs text-gray-300">{t('airdrops.noTasks')}</p>
                      ) : (
                        <div className="space-y-1">
                          {item.tasks.map((task, i) => (
                            <div key={i} className="text-xs text-gray-600">
                              <span className="font-medium">{task.title}</span>
                              {task.description && (
                                <span className="text-gray-400 ml-1">— {task.description}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-xs font-medium text-text-muted mb-1">
                        <DollarSign size={12} />
                        {t('airdrops.earnings')}
                      </div>
                      {item.earnings.length === 0 ? (
                        <p className="text-xs text-gray-300">{t('airdrops.noEarnings')}</p>
                      ) : (
                        <div className="space-y-1">
                          {item.earnings.map((earning, i) => (
                            <div key={i} className="text-xs text-gray-600">
                              {earning.amount} {earning.token}
                              {earning.valueUsd != null && (
                                <span className="text-gray-400 ml-1">(${earning.valueUsd})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            totalCountText={t('common.total', { count: total })}
            pageText={t('common.page', { current: page, total: totalPages })}
          />
        </>
      )}

      <Modal
        open={showCreate}
        onClose={() => {
          setShowCreate(false)
          setCreateError(null)
        }}
        title={t('airdrops.createAirdrop')}
        scrollable
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('airdrops.name')}
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
              {t('airdrops.chain')}
            </label>
            <input
              type="text"
              value={form.chain}
              onChange={(e) => setForm((f) => ({ ...f, chain: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('airdrops.status')}
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as AirdropStatus }))}
              className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {AIRDROP_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(STATUS_KEYS[s])}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('airdrops.projectType')}
            </label>
            <select
              value={form.projectType}
              onChange={(e) =>
                setForm((f) => ({ ...f, projectType: e.target.value as AirdropProjectType }))
              }
              className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {AIRDROP_TYPES.map((tp) => (
                <option key={tp} value={tp}>
                  {t(TYPE_KEYS[tp])}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('airdrops.description')}
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
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
            disabled={creating || !form.name.trim() || !form.chain.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('common.create')}
          </button>
        </div>
      </Modal>

      <Modal
        open={!!editingItem}
        onClose={() => setEditingItem(null)}
        title={t('airdrops.editAirdrop')}
        maxWidth="max-w-lg"
        scrollable
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('airdrops.name')}
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
              {t('airdrops.chain')}
            </label>
            <input
              type="text"
              value={editForm.chain}
              onChange={(e) => setEditForm((f) => ({ ...f, chain: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('airdrops.status')}
            </label>
            <select
              value={editForm.status}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, status: e.target.value as AirdropStatus }))
              }
              className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {AIRDROP_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(STATUS_KEYS[s])}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('airdrops.projectType')}
            </label>
            <select
              value={editForm.projectType}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, projectType: e.target.value as AirdropProjectType }))
              }
              className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {AIRDROP_TYPES.map((tp) => (
                <option key={tp} value={tp}>
                  {t(TYPE_KEYS[tp])}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('airdrops.description')}
            </label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('airdrops.tags')}
            </label>
            <input
              type="text"
              value={editForm.tags}
              onChange={(e) => setEditForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="tag1, tag2"
              className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('airdrops.labels')}
            </label>
            <input
              type="text"
              value={editForm.labels}
              onChange={(e) => setEditForm((f) => ({ ...f, labels: e.target.value }))}
              placeholder="label1, label2"
              className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Link size={14} />
                {t('airdrops.links')}
              </label>
              <button
                onClick={addLink}
                className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-0.5"
              >
                <Plus size={12} />
                {t('airdrops.addLink')}
              </button>
            </div>
            {editForm.links.length === 0 ? (
              <p className="text-xs text-gray-300">{t('airdrops.noLinks')}</p>
            ) : (
              <div className="space-y-2">
                {editForm.links.map((link, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => updateLink(i, 'label', e.target.value)}
                      placeholder={t('airdrops.linkLabel')}
                      className="flex-1 px-2 py-1.5 text-xs border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      value={link.url}
                      onChange={(e) => updateLink(i, 'url', e.target.value)}
                      placeholder={t('airdrops.linkUrl')}
                      className="flex-1 px-2 py-1.5 text-xs border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={() => removeLink(i)}
                      className="p-1 text-gray-400 hover:text-red-500 shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <ListChecks size={14} />
                {t('airdrops.tasks')}
              </label>
              <button
                onClick={addTask}
                className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-0.5"
              >
                <Plus size={12} />
                {t('airdrops.addTask')}
              </button>
            </div>
            {editForm.tasks.length === 0 ? (
              <p className="text-xs text-gray-300">{t('airdrops.noTasks')}</p>
            ) : (
              <div className="space-y-2">
                {editForm.tasks.map((task, i) => (
                  <div key={task.id} className="flex items-start gap-2">
                    <div className="flex-1 space-y-1">
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => updateTask(i, 'title', e.target.value)}
                        placeholder={t('airdrops.taskTitle')}
                        className="w-full px-2 py-1.5 text-xs border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <input
                        type="text"
                        value={task.description}
                        onChange={(e) => updateTask(i, 'description', e.target.value)}
                        placeholder={t('airdrops.taskDescription')}
                        className="w-full px-2 py-1.5 text-xs border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <button
                      onClick={() => removeTask(i)}
                      className="p-1 text-gray-400 hover:text-red-500 shrink-0 mt-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <DollarSign size={14} />
                {t('airdrops.earnings')}
              </label>
              <button
                onClick={addEarning}
                className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-0.5"
              >
                <Plus size={12} />
                {t('airdrops.addEarning')}
              </button>
            </div>
            {editForm.earnings.length === 0 ? (
              <p className="text-xs text-gray-300">{t('airdrops.noEarnings')}</p>
            ) : (
              <div className="space-y-2">
                {editForm.earnings.map((earning, i) => (
                  <div key={earning.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={earning.token}
                      onChange={(e) => updateEarning(i, 'token', e.target.value)}
                      placeholder={t('airdrops.earningToken')}
                      className="w-20 px-2 py-1.5 text-xs border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="number"
                      value={earning.amount}
                      onChange={(e) => updateEarning(i, 'amount', parseFloat(e.target.value) || 0)}
                      placeholder={t('airdrops.earningAmount')}
                      className="w-24 px-2 py-1.5 text-xs border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      value={earning.notes}
                      onChange={(e) => updateEarning(i, 'notes', e.target.value)}
                      placeholder={t('airdrops.earningNotes')}
                      className="flex-1 px-2 py-1.5 text-xs border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={() => removeEarning(i)}
                      className="p-1 text-gray-400 hover:text-red-500 shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
            disabled={saving || !editForm.name.trim() || !editForm.chain.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('common.save')}
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default Airdrops
