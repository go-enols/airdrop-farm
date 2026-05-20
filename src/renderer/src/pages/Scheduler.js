import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from 'react/jsx-runtime'
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { schedulerApi } from '../api'
import { Plus, Trash2, Clock, Edit3, ToggleLeft, ToggleRight } from 'lucide-react'
import { useTemplateList } from '../hooks'
import { Modal } from '../components/common'
const Scheduler = () => {
  const { t } = useTranslation()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ templateId: '', cronExpression: '' })
  const [creating, setCreating] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [editForm, setEditForm] = useState({ cronExpression: '' })
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState(null)
  const [togglingId, setTogglingId] = useState(null)
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
  const handleDelete = async (id) => {
    if (!window.confirm(t('scheduler.confirmDelete'))) return
    try {
      await schedulerApi.delete(id)
      fetchData()
    } catch {
      setError(t('common.error'))
    }
  }
  const handleToggle = async (item) => {
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
  const openEdit = (item) => {
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
  const formatTime = (time) => {
    if (!time) return '—'
    return new Date(time).toLocaleString()
  }
  return _jsxs('div', {
    className: 'space-y-4',
    children: [
      _jsxs('div', {
        className: 'flex items-center justify-between',
        children: [
          _jsx('h1', { className: 'text-2xl font-bold', children: t('scheduler.title') }),
          _jsxs('button', {
            onClick: () => setShowCreate(true),
            className:
              'flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors',
            children: [_jsx(Plus, { size: 16 }), t('scheduler.createSchedule')]
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
        : items.length === 0
          ? _jsxs('div', {
              className: 'flex flex-col items-center justify-center py-20 text-gray-400',
              children: [
                _jsx(Clock, { size: 48 }),
                _jsx('p', { className: 'mt-4 text-lg', children: t('scheduler.noSchedules') })
              ]
            })
          : _jsx('div', {
              className: 'dark:bg-bg-card rounded-xl border border-border-light overflow-hidden',
              children: _jsxs('table', {
                className: 'w-full text-sm',
                children: [
                  _jsx('thead', {
                    children: _jsxs('tr', {
                      className: 'border-b border-gray-100 bg-bg-tertiary',
                      children: [
                        _jsx('th', {
                          className: 'text-left px-4 py-3 font-medium text-gray-600',
                          children: t('scheduler.templateId')
                        }),
                        _jsx('th', {
                          className: 'text-left px-4 py-3 font-medium text-gray-600',
                          children: t('scheduler.cronExpression')
                        }),
                        _jsx('th', {
                          className: 'text-left px-4 py-3 font-medium text-gray-600',
                          children: t('scheduler.enabled')
                        }),
                        _jsx('th', {
                          className: 'text-left px-4 py-3 font-medium text-gray-600',
                          children: t('scheduler.lastRun')
                        }),
                        _jsx('th', {
                          className: 'text-left px-4 py-3 font-medium text-gray-600',
                          children: t('scheduler.nextRun')
                        }),
                        _jsx('th', {
                          className: 'text-right px-4 py-3 font-medium text-gray-600',
                          children: t('scheduler.actions')
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
                            _jsx('td', {
                              className: 'px-4 py-3 font-mono text-xs',
                              children: item.cronExpression
                            }),
                            _jsx('td', {
                              className: 'px-4 py-3',
                              children: _jsx('button', {
                                onClick: () => handleToggle(item),
                                disabled: togglingId === item.id,
                                className: 'flex items-center gap-1.5 group',
                                children: item.enabled
                                  ? _jsxs(_Fragment, {
                                      children: [
                                        _jsx(ToggleRight, {
                                          size: 20,
                                          className:
                                            'text-green-500 group-hover:text-green-600 transition-colors'
                                        }),
                                        _jsx('span', {
                                          className: 'text-xs font-medium text-green-600',
                                          children: t('scheduler.enabled')
                                        })
                                      ]
                                    })
                                  : _jsxs(_Fragment, {
                                      children: [
                                        _jsx(ToggleLeft, {
                                          size: 20,
                                          className:
                                            'text-gray-400 group-hover:text-text-muted transition-colors'
                                        }),
                                        _jsx('span', {
                                          className: 'text-xs font-medium text-text-muted',
                                          children: t('scheduler.disabled')
                                        })
                                      ]
                                    })
                              })
                            }),
                            _jsx('td', {
                              className: 'px-4 py-3 text-text-muted text-xs',
                              children: formatTime(item.lastRun)
                            }),
                            _jsx('td', {
                              className: 'px-4 py-3 text-text-muted text-xs',
                              children: formatTime(item.nextRun)
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
      _jsxs(Modal, {
        open: showCreate,
        onClose: () => setShowCreate(false),
        title: t('scheduler.createSchedule'),
        children: [
          _jsxs('div', {
            className: 'space-y-4',
            children: [
              _jsxs('div', {
                children: [
                  _jsx('label', {
                    className: 'block text-sm font-medium text-gray-700 mb-1',
                    children: t('scheduler.templateId')
                  }),
                  _jsxs('select', {
                    value: form.templateId,
                    onChange: (e) => setForm((f) => ({ ...f, templateId: e.target.value })),
                    className:
                      'w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary',
                    children: [
                      _jsx('option', { value: '', children: t('scheduler.selectTemplate') }),
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
                    children: t('scheduler.cronExpression')
                  }),
                  _jsx('input', {
                    type: 'text',
                    value: form.cronExpression,
                    onChange: (e) => setForm((f) => ({ ...f, cronExpression: e.target.value })),
                    placeholder: '* * * * *',
                    className:
                      'w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono'
                  })
                ]
              })
            ]
          }),
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
                disabled: creating || !form.templateId.trim() || !form.cronExpression.trim(),
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
        title: t('scheduler.editSchedule'),
        children: [
          _jsxs('div', {
            className: 'space-y-4',
            children: [
              _jsxs('div', {
                children: [
                  _jsx('label', {
                    className: 'block text-sm font-medium text-gray-700 mb-1',
                    children: t('scheduler.templateId')
                  }),
                  _jsx('input', {
                    type: 'text',
                    value:
                      templates.find((t) => t.id === editingItem?.templateId)?.name ||
                      editingItem?.templateId,
                    disabled: true,
                    className:
                      'w-full px-3 py-2 text-sm border border-border-light rounded-lg bg-bg-tertiary text-text-muted'
                  })
                ]
              }),
              _jsxs('div', {
                children: [
                  _jsx('label', {
                    className: 'block text-sm font-medium text-gray-700 mb-1',
                    children: t('scheduler.cronExpression')
                  }),
                  _jsx('input', {
                    type: 'text',
                    value: editForm.cronExpression,
                    onChange: (e) => setEditForm((f) => ({ ...f, cronExpression: e.target.value })),
                    placeholder: '* * * * *',
                    className:
                      'w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono'
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
                disabled: saving || !editForm.cronExpression.trim(),
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
export default Scheduler
