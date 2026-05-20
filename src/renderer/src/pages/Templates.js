import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from 'react/jsx-runtime'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { templateApi } from '../api'
import { Plus, Search, Trash2, ChevronLeft, ChevronRight, Edit3 } from 'lucide-react'
import { Modal } from '../components/common'
const PAGE_SIZE = 10
const Templates = () => {
  const { t } = useTranslation()
  const [allItems, setAllItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', type: '', version: '', schema: '{}' })
  const [creating, setCreating] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', type: '', version: '', schema: '{}' })
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState(null)
  const debounceRef = useRef(null)
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
  const handleCreate = async () => {
    if (!form.name.trim() || !form.type.trim() || !form.version.trim()) return
    let parsedSchema = {}
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
  const handleDelete = async (id) => {
    if (!window.confirm(t('templates.confirmDelete'))) return
    try {
      await templateApi.delete(id)
      fetchData()
    } catch {
      setError(t('common.error'))
    }
  }
  const openEdit = (item) => {
    setEditingItem(item)
    setEditForm({
      name: item.name,
      type: item.type,
      version: item.version,
      schema: JSON.stringify(item.schema, null, 2)
    })
    setEditError(null)
  }
  const handleEdit = async () => {
    if (!editingItem) return
    let parsedSchema = {}
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
  return _jsxs('div', {
    className: 'space-y-4',
    children: [
      _jsxs('div', {
        className: 'flex items-center justify-between',
        children: [
          _jsx('h1', { className: 'text-2xl font-bold', children: t('templates.title') }),
          _jsxs('div', {
            className: 'flex items-center gap-3',
            children: [
              _jsxs('div', {
                className: 'relative',
                children: [
                  _jsx(Search, {
                    size: 16,
                    className: 'absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
                  }),
                  _jsx('input', {
                    type: 'text',
                    value: search,
                    onChange: (e) => setSearch(e.target.value),
                    placeholder: t('templates.searchPlaceholder'),
                    className:
                      'pl-9 pr-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-64'
                  })
                ]
              }),
              _jsxs('button', {
                onClick: () => setShowCreate(true),
                className:
                  'flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors',
                children: [_jsx(Plus, { size: 16 }), t('templates.createTemplate')]
              })
            ]
          })
        ]
      }),
      error &&
        _jsx('div', {
          className: 'text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2',
          children: error
        }),
      loading
        ? _jsx('div', {
            className: 'flex items-center justify-center py-20 text-gray-400',
            children: _jsx('span', { children: t('common.loading') })
          })
        : paged.length === 0
          ? _jsxs('div', {
              className: 'flex flex-col items-center justify-center py-20 text-gray-400',
              children: [
                _jsx(Search, { size: 48 }),
                _jsx('p', { className: 'mt-4 text-lg', children: t('templates.noTemplates') })
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
                              children: t('templates.name')
                            }),
                            _jsx('th', {
                              className: 'text-left px-4 py-3 font-medium text-gray-600',
                              children: t('templates.type')
                            }),
                            _jsx('th', {
                              className: 'text-left px-4 py-3 font-medium text-gray-600',
                              children: t('templates.version')
                            }),
                            _jsx('th', {
                              className: 'text-left px-4 py-3 font-medium text-gray-600',
                              children: t('templates.isLocal')
                            }),
                            _jsx('th', {
                              className: 'text-left px-4 py-3 font-medium text-gray-600',
                              children: t('templates.updatedAt')
                            }),
                            _jsx('th', {
                              className: 'text-right px-4 py-3 font-medium text-gray-600',
                              children: t('templates.actions')
                            })
                          ]
                        })
                      }),
                      _jsx('tbody', {
                        children: paged.map((item) =>
                          _jsxs(
                            'tr',
                            {
                              className:
                                'border-b border-gray-50 hover:bg-bg-tertiary transition-colors',
                              children: [
                                _jsx('td', {
                                  className: 'px-4 py-3 font-medium',
                                  children: item.name
                                }),
                                _jsx('td', {
                                  className: 'px-4 py-3 text-gray-600',
                                  children: item.type
                                }),
                                _jsx('td', {
                                  className: 'px-4 py-3 font-mono text-xs',
                                  children: item.version
                                }),
                                _jsx('td', {
                                  className: 'px-4 py-3',
                                  children: item.isLocal
                                    ? _jsx('span', {
                                        className:
                                          'inline-block px-2 py-0.5 text-xs bg-green-50 text-green-600 rounded-full',
                                        children: t('templates.isLocal')
                                      })
                                    : _jsx('span', {
                                        className:
                                          'inline-block px-2 py-0.5 text-xs bg-gray-100 text-text-muted rounded-full',
                                        children: 'Remote'
                                      })
                                }),
                                _jsx('td', {
                                  className: 'px-4 py-3 text-text-muted text-xs',
                                  children: new Date(item.updatedAt).toLocaleString()
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
                _jsxs('div', {
                  className: 'flex items-center justify-between',
                  children: [
                    _jsx('span', {
                      className: 'text-sm text-text-muted',
                      children: t('common.total', { count: filtered.length })
                    }),
                    _jsxs('div', {
                      className: 'flex items-center gap-2',
                      children: [
                        _jsx('button', {
                          onClick: () => setPage((p) => Math.max(1, p - 1)),
                          disabled: safePage <= 1,
                          className:
                            'p-2 rounded-lg border border-border-light hover:bg-bg-tertiary disabled:opacity-40 disabled:cursor-not-allowed transition-colors',
                          children: _jsx(ChevronLeft, { size: 16 })
                        }),
                        _jsx('span', {
                          className: 'text-sm text-gray-600 min-w-[80px] text-center',
                          children: t('common.page', { current: safePage, total: totalPages })
                        }),
                        _jsx('button', {
                          onClick: () => setPage((p) => Math.min(totalPages, p + 1)),
                          disabled: safePage >= totalPages,
                          className:
                            'p-2 rounded-lg border border-border-light hover:bg-bg-tertiary disabled:opacity-40 disabled:cursor-not-allowed transition-colors',
                          children: _jsx(ChevronRight, { size: 16 })
                        })
                      ]
                    })
                  ]
                })
              ]
            }),
      _jsxs(Modal, {
        open: showCreate,
        onClose: () => setShowCreate(false),
        title: t('templates.createTemplate'),
        children: [
          _jsxs('div', {
            className: 'space-y-4',
            children: [
              _jsxs('div', {
                children: [
                  _jsx('label', {
                    className: 'block text-sm font-medium text-gray-700 mb-1',
                    children: t('templates.name')
                  }),
                  _jsx('input', {
                    type: 'text',
                    value: form.name,
                    onChange: (e) => setForm((f) => ({ ...f, name: e.target.value })),
                    className:
                      'w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
                  })
                ]
              }),
              _jsxs('div', {
                children: [
                  _jsx('label', {
                    className: 'block text-sm font-medium text-gray-700 mb-1',
                    children: t('templates.type')
                  }),
                  _jsx('input', {
                    type: 'text',
                    value: form.type,
                    onChange: (e) => setForm((f) => ({ ...f, type: e.target.value })),
                    className:
                      'w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
                  })
                ]
              }),
              _jsxs('div', {
                children: [
                  _jsx('label', {
                    className: 'block text-sm font-medium text-gray-700 mb-1',
                    children: t('templates.version')
                  }),
                  _jsx('input', {
                    type: 'text',
                    value: form.version,
                    onChange: (e) => setForm((f) => ({ ...f, version: e.target.value })),
                    className:
                      'w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
                  })
                ]
              }),
              _jsxs('div', {
                children: [
                  _jsxs('label', {
                    className: 'block text-sm font-medium text-gray-700 mb-1',
                    children: [t('templates.schema'), ' (JSON)']
                  }),
                  _jsx('textarea', {
                    value: form.schema,
                    onChange: (e) => setForm((f) => ({ ...f, schema: e.target.value })),
                    rows: 6,
                    className:
                      'w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono resize-none'
                  })
                ]
              })
            ]
          }),
          error && _jsx('div', { className: 'text-red-600 text-sm mt-3', children: error }),
          _jsxs('div', {
            className: 'flex justify-end gap-3 mt-6',
            children: [
              _jsx('button', {
                onClick: () => setShowCreate(false),
                className:
                  'px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors',
                children: t('common.cancel')
              }),
              _jsx('button', {
                onClick: handleCreate,
                disabled:
                  creating || !form.name.trim() || !form.type.trim() || !form.version.trim(),
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
        title: t('templates.editTemplate'),
        children: [
          _jsxs('div', {
            className: 'space-y-4',
            children: [
              _jsxs('div', {
                children: [
                  _jsx('label', {
                    className: 'block text-sm font-medium text-gray-700 mb-1',
                    children: t('templates.name')
                  }),
                  _jsx('input', {
                    type: 'text',
                    value: editForm.name,
                    onChange: (e) => setEditForm((f) => ({ ...f, name: e.target.value })),
                    className:
                      'w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
                  })
                ]
              }),
              _jsxs('div', {
                children: [
                  _jsx('label', {
                    className: 'block text-sm font-medium text-gray-700 mb-1',
                    children: t('templates.type')
                  }),
                  _jsx('input', {
                    type: 'text',
                    value: editForm.type,
                    onChange: (e) => setEditForm((f) => ({ ...f, type: e.target.value })),
                    className:
                      'w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
                  })
                ]
              }),
              _jsxs('div', {
                children: [
                  _jsx('label', {
                    className: 'block text-sm font-medium text-gray-700 mb-1',
                    children: t('templates.version')
                  }),
                  _jsx('input', {
                    type: 'text',
                    value: editForm.version,
                    onChange: (e) => setEditForm((f) => ({ ...f, version: e.target.value })),
                    className:
                      'w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
                  })
                ]
              }),
              _jsxs('div', {
                children: [
                  _jsxs('label', {
                    className: 'block text-sm font-medium text-gray-700 mb-1',
                    children: [t('templates.schema'), ' (JSON)']
                  }),
                  _jsx('textarea', {
                    value: editForm.schema,
                    onChange: (e) => setEditForm((f) => ({ ...f, schema: e.target.value })),
                    rows: 8,
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
                disabled:
                  saving ||
                  !editForm.name.trim() ||
                  !editForm.type.trim() ||
                  !editForm.version.trim(),
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
export default Templates
