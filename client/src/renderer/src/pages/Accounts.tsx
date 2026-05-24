import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { accountApi } from '../api'
import type { Account } from '../types'
import { Plus, Trash2, Edit3, Search, Upload } from 'lucide-react'
import { usePaginatedList, useTemplateList } from '../hooks'
import { Pagination, SearchInput, Modal } from '../components/common'
import DynamicForm from '../components/DynamicForm'
import type { FieldMeta } from '../../../shared/schemas/task-params'

const PAGE_SIZE = 10

function jsonSchemaToFieldMeta(schema: Record<string, unknown>): FieldMeta[] {
  const properties = (schema.properties as Record<string, Record<string, unknown>>) || {}
  const required: string[] = (schema.required as string[]) || []
  const fields: FieldMeta[] = []

  for (const [name, prop] of Object.entries(properties)) {
    const jsonType = prop.type as string
    let type: FieldMeta['type'] = 'string'
    if (jsonType === 'number' || jsonType === 'integer') type = 'number'
    else if (jsonType === 'boolean') type = 'boolean'

    const label = (prop.title as string) || name
    const isRequired = required.includes(name)

    fields.push({
      name,
      type,
      label,
      required: isRequired,
      defaultValue: prop.default,
      description: prop.description as string
    })
  }

  return fields
}

const Accounts: React.FC = () => {
  const { t } = useTranslation()
  const { templates } = useTemplateList()
  const {
    items,
    total,
    page,
    totalPages,
    loading,
    error,
    setPage,
    setSearch,
    search,
    refresh: fetchData
  } = usePaginatedList<Account>((p, ps, s) => accountApi.list(p, ps, s), PAGE_SIZE)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    templateId: '',
    pool: '',
    notes: '',
    labels: '',
    data: '{}',
    dynamicFormValues: {} as Record<string, unknown>
  })
  const [creating, setCreating] = useState(false)
  const [editingItem, setEditingItem] = useState<Account | null>(null)
  const [editForm, setEditForm] = useState({ pool: '', notes: '', labels: '', data: '{}' })
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [showBatchImport, setShowBatchImport] = useState(false)
  const [batchJson, setBatchJson] = useState('')
  const [batchError, setBatchError] = useState<string | null>(null)

  const handleBatchImport = useCallback(async () => {
    setBatchError(null)
    let parsed: Array<{ templateId?: string; data?: Record<string, unknown>; pool?: string; labels?: string[]; notes?: string }>
    try {
      parsed = JSON.parse(batchJson)
      if (!Array.isArray(parsed)) {
        setBatchError('请输入 JSON 数组')
        return
      }
    } catch {
      setBatchError('JSON 格式无效')
      return
    }
    const items = parsed.map((item) => ({
      templateId: item.templateId || '',
      data: item.data || {},
      pool: item.pool || '',
      labels: item.labels || [],
      notes: item.notes || ''
    }))
    try {
      const count = await accountApi.batchCreate(items)
      setShowBatchImport(false)
      setBatchJson('')
      window.alert(`成功导入 ${count} 个账户`)
      fetchData()
    } catch {
      setBatchError(t('common.operationFailed'))
    }
  }, [batchJson, t, fetchData])

  const handleCreate = useCallback(async () => {
    if (!form.templateId.trim() || !form.pool.trim()) return
    // 使用 DynamicForm 的值或手写 JSON
    const selectedTemplate = templates.find((t) => t.id === form.templateId)
    let parsedData: Record<string, unknown> = {}
    if (selectedTemplate?.schema && Object.keys(selectedTemplate.schema).length > 0) {
      parsedData = { ...form.dynamicFormValues }
    } else {
      try {
        parsedData = JSON.parse(form.data || '{}')
      } catch {
        setCreateError(t('common.invalidJson'))
        return
      }
    }
    // 检查账号池是否存在
    try {
      const pools = await accountApi.listPools()
      const poolName = form.pool.trim()
      if (!pools.includes(poolName)) {
        if (!window.confirm(`账号池「${poolName}」尚不存在，是否创建？`)) {
          return
        }
      }
    } catch {
      // 忽略池检查错误
    }
    setCreating(true)
    setCreateError(null)
    try {
      await accountApi.create({
        templateId: form.templateId.trim(),
        data: parsedData,
        pool: form.pool.trim(),
        labels: form.labels
          ? form.labels
              .split(',')
              .map((l) => l.trim())
              .filter(Boolean)
          : [],
        notes: form.notes.trim()
      })
      setShowCreate(false)
      setForm({ templateId: '', pool: '', notes: '', labels: '', data: '{}', dynamicFormValues: {} })
      fetchData()
    } catch {
      setCreateError(t('common.error'))
    } finally {
      setCreating(false)
    }
  }, [form, t, fetchData])

  const handleDelete = useCallback(
    async (id: string): Promise<void> => {
      if (!window.confirm(t('accounts.confirmDelete'))) return
      try {
        await accountApi.delete(id)
        fetchData()
      } catch {
        // Ignore delete errors
      }
    },
    [t, fetchData]
  )

  const openEdit = (item: Account): void => {
    setEditingItem(item)
    setEditForm({
      pool: item.pool,
      notes: item.notes,
      labels: item.labels.join(', '),
      data: JSON.stringify(item.data, null, 2)
    })
    setEditError(null)
  }

  const handleEdit = useCallback(async () => {
    if (!editingItem) return
    let parsedData: Record<string, unknown> = {}
    try {
      parsedData = JSON.parse(editForm.data || '{}')
    } catch {
      setEditError(t('common.invalidJson'))
      return
    }
    setSaving(true)
    setEditError(null)
    try {
      await accountApi.update(editingItem.id, {
        pool: editForm.pool.trim(),
        notes: editForm.notes.trim(),
        labels: editForm.labels
          ? editForm.labels
              .split(',')
              .map((l) => l.trim())
              .filter(Boolean)
          : [],
        data: parsedData
      })
      setEditingItem(null)
      fetchData()
    } catch {
      setEditError(t('common.error'))
    } finally {
      setSaving(false)
    }
  }, [editingItem, editForm, t, fetchData])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('accounts.title')}</h1>
        <div className="flex items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('accounts.searchPlaceholder')}
          />
          <button
            onClick={() => setShowBatchImport(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Upload size={16} />
            批量导入
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            {t('accounts.createAccount')}
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
          <Search size={48} />
          <p className="mt-4 text-lg">{t('accounts.noAccounts')}</p>
        </div>
      ) : (
        <>
          <div className="dark:bg-bg-card rounded-xl border border-border-light overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-bg-tertiary">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    {t('accounts.templateId')}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    {t('accounts.pool')}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    {t('accounts.labels')}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    {t('accounts.notes')}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    {t('accounts.createdAt')}
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">
                    {t('accounts.actions')}
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
                    <td className="px-4 py-3">{item.pool}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {item.labels.length > 0 ? (
                          item.labels.map((l, i) => (
                            <span
                              key={i}
                              className="inline-block px-2 py-0.5 text-xs bg-blue-50 text-blue-600 rounded-full"
                            >
                              {l}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate text-text-muted">
                      {item.notes || '—'}
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs">
                      {new Date(item.createdAt).toLocaleString()}
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
        onClose={() => setShowCreate(false)}
        title={t('accounts.createAccount')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('accounts.templateId')}
            </label>
            <select
              value={form.templateId}
              onChange={(e) => setForm((f) => ({ ...f, templateId: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{t('accounts.selectTemplate', '请选择模板')}</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.type})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('accounts.pool')}
            </label>
            <input
              type="text"
              value={form.pool}
              onChange={(e) => setForm((f) => ({ ...f, pool: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('accounts.labels')}
            </label>
            <input
              type="text"
              value={form.labels}
              onChange={(e) => setForm((f) => ({ ...f, labels: e.target.value }))}
              placeholder={t('accounts.labelsPlaceholder')}
              className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('accounts.notes')}
            </label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {(() => {
            const selectedTpl = templates.find((t) => t.id === form.templateId)
            const hasSchema = selectedTpl?.schema && selectedTpl.schema.properties
            if (hasSchema) {
              const fields = jsonSchemaToFieldMeta(selectedTpl!.schema)
              return (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('accounts.data')}
                  </label>
                  <DynamicForm
                    fields={fields}
                    values={form.dynamicFormValues}
                    onChange={(values) => setForm((f) => ({ ...f, dynamicFormValues: values }))}
                  />
                </div>
              )
            }
            return (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('accounts.data')} (JSON)
                </label>
                <textarea
                  value={form.data}
                  onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono resize-none"
                />
              </div>
            )
          })()}
        </div>
        {createError && <div className="text-red-600 text-sm mt-3">{createError}</div>}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => {
              setShowCreate(false)
              setCreateError(null)
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !form.templateId.trim() || !form.pool.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('common.create')}
          </button>
        </div>
      </Modal>

      <Modal
        open={!!editingItem}
        onClose={() => setEditingItem(null)}
        title={t('accounts.editAccount')}
        scrollable
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('accounts.pool')}
            </label>
            <input
              type="text"
              value={editForm.pool}
              onChange={(e) => setEditForm((f) => ({ ...f, pool: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('accounts.labels')}
            </label>
            <input
              type="text"
              value={editForm.labels}
              onChange={(e) => setEditForm((f) => ({ ...f, labels: e.target.value }))}
              placeholder={t('accounts.labelsPlaceholder')}
              className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('accounts.notes')}
            </label>
            <input
              type="text"
              value={editForm.notes}
              onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('accounts.data')} (JSON)
            </label>
            <textarea
              value={editForm.data}
              onChange={(e) => setEditForm((f) => ({ ...f, data: e.target.value }))}
              rows={6}
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
            disabled={saving || !editForm.pool.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('common.save')}
          </button>
        </div>
      </Modal>

      <Modal
        open={showBatchImport}
        onClose={() => {
          setShowBatchImport(false)
          setBatchError(null)
        }}
        title="批量导入账户"
        scrollable
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              JSON 数组（每个对象包含 templateId、pool、labels、notes、data 字段）
            </label>
            <textarea
              value={batchJson}
              onChange={(e) => setBatchJson(e.target.value)}
              rows={12}
              placeholder={`[
  { "templateId": "template-evm-wallet", "pool": "my-pool", "data": { "address": "...", "privateKey": "..." } },
  { "templateId": "template-evm-wallet", "pool": "my-pool", "data": { "address": "...", "privateKey": "..." } }
]`}
              className="w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono resize-none"
            />
          </div>
        </div>
        {batchError && <div className="text-red-600 text-sm mt-3">{batchError}</div>}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => {
              setShowBatchImport(false)
              setBatchError(null)
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleBatchImport}
            disabled={!batchJson.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            导入
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default Accounts
