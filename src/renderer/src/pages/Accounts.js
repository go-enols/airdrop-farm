import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from 'react/jsx-runtime'
import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { accountApi } from '../api'
import { Plus, Trash2, Edit3, Search } from 'lucide-react'
import { usePaginatedList, useTemplateList } from '../hooks'
import { Pagination, SearchInput, Modal } from '../components/common'
const PAGE_SIZE = 10
const Accounts = () => {
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
  } = usePaginatedList((p, ps, s) => accountApi.list(p, ps, s), PAGE_SIZE)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ templateId: '', pool: '', notes: '', labels: '', data: '{}' })
  const [creating, setCreating] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [editForm, setEditForm] = useState({ pool: '', notes: '', labels: '', data: '{}' })
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState(null)
  const [createError, setCreateError] = useState(null)
  const handleCreate = useCallback(async () => {
    if (!form.templateId.trim() || !form.pool.trim()) return
    let parsedData = {}
    try {
      parsedData = JSON.parse(form.data || '{}')
    } catch {
      setCreateError(t('common.invalidJson'))
      return
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
      setForm({ templateId: '', pool: '', notes: '', labels: '', data: '{}' })
      fetchData()
    } catch {
      setCreateError(t('common.error'))
    } finally {
      setCreating(false)
    }
  }, [form, t, fetchData])
  const handleDelete = useCallback(
    async (id) => {
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
  const openEdit = (item) => {
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
    let parsedData = {}
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
  return _jsxs('div', {
    className: 'space-y-4',
    children: [
      _jsxs('div', {
        className: 'flex items-center justify-between',
        children: [
          _jsx('h1', { className: 'text-2xl font-bold', children: t('accounts.title') }),
          _jsxs('div', {
            className: 'flex items-center gap-3',
            children: [
              _jsx(SearchInput, {
                value: search,
                onChange: setSearch,
                placeholder: t('accounts.searchPlaceholder')
              }),
              _jsxs('button', {
                onClick: () => setShowCreate(true),
                className:
                  'flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors',
                children: [_jsx(Plus, { size: 16 }), t('accounts.createAccount')]
              })
            ]
          })
        ]
      }),
      (error || createError) &&
        _jsx('div', {
          className: 'text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2',
          children: createError || t('common.error')
        }),
      loading
        ? _jsx('div', {
            className: 'flex items-center justify-center py-20 text-gray-400',
            children: _jsx('span', { children: t('common.loading') })
          })
        : items.length === 0
          ? _jsxs('div', {
              className: 'flex flex-col items-center justify-center py-20 text-gray-400',
              children: [
                _jsx(Search, { size: 48 }),
                _jsx('p', { className: 'mt-4 text-lg', children: t('accounts.noAccounts') })
              ]
            })
          : _jsxs(_Fragment, {
              children: [
                _jsx('div', {
                  className:
                    'dark:bg-bg-card rounded-xl border border-border-light overflow-hidden',
                  children: _jsxs('table', {
                    className: 'w-full text-sm',
                    children: [
                      _jsx('thead', {
                        children: _jsxs('tr', {
                          className: 'border-b border-gray-100 bg-bg-tertiary',
                          children: [
                            _jsx('th', {
                              className: 'text-left px-4 py-3 font-medium text-gray-600',
                              children: t('accounts.templateId')
                            }),
                            _jsx('th', {
                              className: 'text-left px-4 py-3 font-medium text-gray-600',
                              children: t('accounts.pool')
                            }),
                            _jsx('th', {
                              className: 'text-left px-4 py-3 font-medium text-gray-600',
                              children: t('accounts.labels')
                            }),
                            _jsx('th', {
                              className: 'text-left px-4 py-3 font-medium text-gray-600',
                              children: t('accounts.notes')
                            }),
                            _jsx('th', {
                              className: 'text-left px-4 py-3 font-medium text-gray-600',
                              children: t('accounts.createdAt')
                            }),
                            _jsx('th', {
                              className: 'text-right px-4 py-3 font-medium text-gray-600',
                              children: t('accounts.actions')
                            })
                          ]
                        })
                      }),
                      _jsx('tbody', {
                        children: items.map((item) =>
                          _jsxs(
                            'tr',
                            {
                              className:
                                'border-b border-gray-50 hover:bg-bg-tertiary transition-colors',
                              children: [
                                _jsx('td', {
                                  className: 'px-4 py-3 text-xs',
                                  children:
                                    templates.find((t) => t.id === item.templateId)?.name ||
                                    item.templateId
                                }),
                                _jsx('td', { className: 'px-4 py-3', children: item.pool }),
                                _jsx('td', {
                                  className: 'px-4 py-3',
                                  children: _jsx('div', {
                                    className: 'flex flex-wrap gap-1',
                                    children:
                                      item.labels.length > 0
                                        ? item.labels.map((l, i) =>
                                            _jsx(
                                              'span',
                                              {
                                                className:
                                                  'inline-block px-2 py-0.5 text-xs bg-blue-50 text-blue-600 rounded-full',
                                                children: l
                                              },
                                              i
                                            )
                                          )
                                        : _jsx('span', {
                                            className: 'text-gray-300',
                                            children: '\u2014'
                                          })
                                  })
                                }),
                                _jsx('td', {
                                  className: 'px-4 py-3 max-w-[200px] truncate text-text-muted',
                                  children: item.notes || '—'
                                }),
                                _jsx('td', {
                                  className: 'px-4 py-3 text-text-muted text-xs',
                                  children: new Date(item.createdAt).toLocaleString()
                                }),
                                _jsx('td', {
                                  className: 'px-4 py-3 text-right',
                                  children: _jsxs('div', {
                                    className: 'flex items-center justify-end gap-1',
                                    children: [
                                      _jsx('button', {
                                        onClick: () => openEdit(item),
                                        className:
                                          'p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors',
                                        children: _jsx(Edit3, { size: 16 })
                                      }),
                                      _jsx('button', {
                                        onClick: () => handleDelete(item.id),
                                        className:
                                          'p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors',
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
                }),
                _jsx(Pagination, {
                  page: page,
                  totalPages: totalPages,
                  onPrev: () => setPage((p) => Math.max(1, p - 1)),
                  onNext: () => setPage((p) => Math.min(totalPages, p + 1)),
                  totalCountText: t('common.total', { count: total }),
                  pageText: t('common.page', { current: page, total: totalPages })
                })
              ]
            }),
      _jsxs(Modal, {
        open: showCreate,
        onClose: () => setShowCreate(false),
        title: t('accounts.createAccount'),
        children: [
          _jsxs('div', {
            className: 'space-y-4',
            children: [
              _jsxs('div', {
                children: [
                  _jsx('label', {
                    className: 'block text-sm font-medium text-gray-700 mb-1',
                    children: t('accounts.templateId')
                  }),
                  _jsxs('select', {
                    value: form.templateId,
                    onChange: (e) => setForm((f) => ({ ...f, templateId: e.target.value })),
                    className:
                      'w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary',
                    children: [
                      _jsx('option', {
                        value: '',
                        children: t('accounts.selectTemplate', '请选择模板')
                      }),
                      templates.map((t) =>
                        _jsxs(
                          'option',
                          { value: t.id, children: [t.name, ' (', t.type, ')'] },
                          t.id
                        )
                      )
                    ]
                  })
                ]
              }),
              _jsxs('div', {
                children: [
                  _jsx('label', {
                    className: 'block text-sm font-medium text-gray-700 mb-1',
                    children: t('accounts.pool')
                  }),
                  _jsx('input', {
                    type: 'text',
                    value: form.pool,
                    onChange: (e) => setForm((f) => ({ ...f, pool: e.target.value })),
                    className:
                      'w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
                  })
                ]
              }),
              _jsxs('div', {
                children: [
                  _jsx('label', {
                    className: 'block text-sm font-medium text-gray-700 mb-1',
                    children: t('accounts.labels')
                  }),
                  _jsx('input', {
                    type: 'text',
                    value: form.labels,
                    onChange: (e) => setForm((f) => ({ ...f, labels: e.target.value })),
                    placeholder: t('accounts.labelsPlaceholder'),
                    className:
                      'w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
                  })
                ]
              }),
              _jsxs('div', {
                children: [
                  _jsx('label', {
                    className: 'block text-sm font-medium text-gray-700 mb-1',
                    children: t('accounts.notes')
                  }),
                  _jsx('input', {
                    type: 'text',
                    value: form.notes,
                    onChange: (e) => setForm((f) => ({ ...f, notes: e.target.value })),
                    className:
                      'w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
                  })
                ]
              }),
              _jsxs('div', {
                children: [
                  _jsxs('label', {
                    className: 'block text-sm font-medium text-gray-700 mb-1',
                    children: [t('accounts.data'), ' (JSON)']
                  }),
                  _jsx('textarea', {
                    value: form.data,
                    onChange: (e) => setForm((f) => ({ ...f, data: e.target.value })),
                    rows: 4,
                    className:
                      'w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono resize-none'
                  })
                ]
              })
            ]
          }),
          createError &&
            _jsx('div', { className: 'text-red-600 text-sm mt-3', children: createError }),
          _jsxs('div', {
            className: 'flex justify-end gap-3 mt-6',
            children: [
              _jsx('button', {
                onClick: () => {
                  setShowCreate(false)
                  setCreateError(null)
                },
                className:
                  'px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors',
                children: t('common.cancel')
              }),
              _jsx('button', {
                onClick: handleCreate,
                disabled: creating || !form.templateId.trim() || !form.pool.trim(),
                className:
                  'px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
                children: t('common.create')
              })
            ]
          })
        ]
      }),
      _jsxs(Modal, {
        open: !!editingItem,
        onClose: () => setEditingItem(null),
        title: t('accounts.editAccount'),
        scrollable: true,
        children: [
          _jsxs('div', {
            className: 'space-y-4',
            children: [
              _jsxs('div', {
                children: [
                  _jsx('label', {
                    className: 'block text-sm font-medium text-gray-700 mb-1',
                    children: t('accounts.pool')
                  }),
                  _jsx('input', {
                    type: 'text',
                    value: editForm.pool,
                    onChange: (e) => setEditForm((f) => ({ ...f, pool: e.target.value })),
                    className:
                      'w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
                  })
                ]
              }),
              _jsxs('div', {
                children: [
                  _jsx('label', {
                    className: 'block text-sm font-medium text-gray-700 mb-1',
                    children: t('accounts.labels')
                  }),
                  _jsx('input', {
                    type: 'text',
                    value: editForm.labels,
                    onChange: (e) => setEditForm((f) => ({ ...f, labels: e.target.value })),
                    placeholder: t('accounts.labelsPlaceholder'),
                    className:
                      'w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
                  })
                ]
              }),
              _jsxs('div', {
                children: [
                  _jsx('label', {
                    className: 'block text-sm font-medium text-gray-700 mb-1',
                    children: t('accounts.notes')
                  }),
                  _jsx('input', {
                    type: 'text',
                    value: editForm.notes,
                    onChange: (e) => setEditForm((f) => ({ ...f, notes: e.target.value })),
                    className:
                      'w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
                  })
                ]
              }),
              _jsxs('div', {
                children: [
                  _jsxs('label', {
                    className: 'block text-sm font-medium text-gray-700 mb-1',
                    children: [t('accounts.data'), ' (JSON)']
                  }),
                  _jsx('textarea', {
                    value: editForm.data,
                    onChange: (e) => setEditForm((f) => ({ ...f, data: e.target.value })),
                    rows: 6,
                    className:
                      'w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono resize-none'
                  })
                ]
              })
            ]
          }),
          editError && _jsx('div', { className: 'text-red-600 text-sm mt-3', children: editError }),
          _jsxs('div', {
            className: 'flex justify-end gap-3 mt-6',
            children: [
              _jsx('button', {
                onClick: () => setEditingItem(null),
                className:
                  'px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors',
                children: t('common.cancel')
              }),
              _jsx('button', {
                onClick: handleEdit,
                disabled: saving || !editForm.pool.trim(),
                className:
                  'px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
                children: t('common.save')
              })
            ]
          })
        ]
      })
    ]
  })
}
export default Accounts
