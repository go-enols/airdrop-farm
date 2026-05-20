import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from 'react/jsx-runtime'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { proxyApi } from '../api'
import {
  Plus,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Copy,
  CheckSquare,
  Square
} from 'lucide-react'
const PAGE_SIZE = 20
const statusColor = {
  active: 'bg-status-active-bg text-status-active-text',
  inactive: 'bg-status-inactive-bg text-status-inactive-text',
  expired: 'bg-status-expired-bg text-status-expired-text'
}
const emptyForm = {
  protocol: 'http',
  host: '',
  port: 0,
  username: '',
  password: '',
  status: 'active',
  labels: []
}
const Proxies = () => {
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editingProxy, setEditingProxy] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [showBatchDelete, setShowBatchDelete] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [labelInput, setLabelInput] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [copiedId, setCopiedId] = useState(null)
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
        labels: form.labels
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
        labels: form.labels
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
  const copyProxyAddress = async (proxy) => {
    const auth = proxy.username ? `${proxy.username}:${proxy.password}@` : ''
    const address = `${proxy.protocol}://${auth}${proxy.host}:${proxy.port}`
    try {
      await navigator.clipboard.writeText(address)
      setCopiedId(proxy.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // Ignore clipboard errors
    }
  }
  const openEditModal = (proxy) => {
    setEditingProxy(proxy)
    setForm({
      protocol: proxy.protocol,
      host: proxy.host,
      port: proxy.port,
      username: proxy.username || '',
      password: proxy.password || '',
      status: proxy.status,
      labels: [...proxy.labels]
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
  const removeLabel = (label) => {
    setForm((f) => ({ ...f, labels: f.labels.filter((l) => l !== label) }))
  }
  const toggleSelect = (id) => {
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
  const renderForm = () =>
    _jsxs('div', {
      className: 'space-y-3',
      children: [
        _jsxs('div', {
          children: [
            _jsx('label', {
              className: 'block text-sm font-medium mb-1',
              children: t('proxies.protocol')
            }),
            _jsxs('select', {
              value: form.protocol,
              onChange: (e) => setForm((f) => ({ ...f, protocol: e.target.value })),
              className:
                'w-full px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary',
              children: [
                _jsx('option', { value: 'http', children: 'HTTP' }),
                _jsx('option', { value: 'https', children: 'HTTPS' }),
                _jsx('option', { value: 'socks5', children: 'SOCKS5' })
              ]
            })
          ]
        }),
        _jsxs('div', {
          className: 'grid grid-cols-3 gap-3',
          children: [
            _jsxs('div', {
              className: 'col-span-2',
              children: [
                _jsx('label', {
                  className: 'block text-sm font-medium mb-1',
                  children: t('proxies.host')
                }),
                _jsx('input', {
                  type: 'text',
                  value: form.host,
                  onChange: (e) => setForm((f) => ({ ...f, host: e.target.value })),
                  className:
                    'w-full px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary'
                })
              ]
            }),
            _jsxs('div', {
              children: [
                _jsx('label', {
                  className: 'block text-sm font-medium mb-1',
                  children: t('proxies.port')
                }),
                _jsx('input', {
                  type: 'number',
                  value: form.port || '',
                  onChange: (e) => setForm((f) => ({ ...f, port: Number(e.target.value) })),
                  className:
                    'w-full px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary'
                })
              ]
            })
          ]
        }),
        _jsxs('div', {
          children: [
            _jsx('label', {
              className: 'block text-sm font-medium mb-1',
              children: t('proxies.username')
            }),
            _jsx('input', {
              type: 'text',
              value: form.username || '',
              onChange: (e) => setForm((f) => ({ ...f, username: e.target.value })),
              className:
                'w-full px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary'
            })
          ]
        }),
        _jsxs('div', {
          children: [
            _jsx('label', {
              className: 'block text-sm font-medium mb-1',
              children: t('proxies.password')
            }),
            _jsx('input', {
              type: 'password',
              value: form.password || '',
              onChange: (e) => setForm((f) => ({ ...f, password: e.target.value })),
              className:
                'w-full px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary'
            })
          ]
        }),
        _jsxs('div', {
          children: [
            _jsx('label', {
              className: 'block text-sm font-medium mb-1',
              children: t('proxies.status')
            }),
            _jsxs('select', {
              value: form.status,
              onChange: (e) => setForm((f) => ({ ...f, status: e.target.value })),
              className:
                'w-full px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary',
              children: [
                _jsx('option', { value: 'active', children: 'Active' }),
                _jsx('option', { value: 'inactive', children: 'Inactive' }),
                _jsx('option', { value: 'expired', children: 'Expired' })
              ]
            })
          ]
        }),
        _jsxs('div', {
          children: [
            _jsx('label', {
              className: 'block text-sm font-medium mb-1',
              children: t('proxies.labels')
            }),
            _jsx('div', {
              className: 'flex flex-wrap gap-1 mb-2',
              children: form.labels.map((l) =>
                _jsxs(
                  'span',
                  {
                    className:
                      'inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded',
                    children: [
                      l,
                      _jsx('button', {
                        onClick: () => removeLabel(l),
                        className: 'hover:text-danger',
                        children: '\u00D7'
                      })
                    ]
                  },
                  l
                )
              )
            }),
            _jsxs('div', {
              className: 'flex gap-2',
              children: [
                _jsx('input', {
                  type: 'text',
                  value: labelInput,
                  onChange: (e) => setLabelInput(e.target.value),
                  onKeyDown: (e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addLabel()
                    }
                  },
                  placeholder: t('common.addLabel') + '...',
                  className:
                    'flex-1 px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary'
                }),
                _jsx('button', {
                  onClick: addLabel,
                  className:
                    'px-3 py-1.5 text-sm border border-border-light rounded-lg hover:bg-bg-card-hover transition-colors',
                  children: _jsx(Plus, { size: 14 })
                })
              ]
            })
          ]
        })
      ]
    })
  return _jsxs('div', {
    className: 'space-y-4',
    children: [
      errorMsg &&
        _jsxs('div', {
          className:
            'px-4 py-2 text-sm text-danger bg-danger-light rounded-lg flex items-center justify-between',
          children: [
            _jsx('span', { children: errorMsg }),
            _jsx('button', {
              onClick: () => setErrorMsg(''),
              className: 'text-danger/70 hover:text-danger',
              children: '\u00D7'
            })
          ]
        }),
      _jsxs('div', {
        className: 'flex items-center justify-between',
        children: [
          _jsx('h1', { className: 'text-2xl font-bold', children: t('proxies.title') }),
          _jsxs('div', {
            className: 'flex items-center gap-3',
            children: [
              _jsxs('div', {
                className: 'relative',
                children: [
                  _jsx(Search, {
                    size: 16,
                    className: 'absolute left-3 top-1/2 -translate-y-1/2 text-text-muted'
                  }),
                  _jsx('input', {
                    type: 'text',
                    placeholder: t('proxies.searchPlaceholder'),
                    value: search,
                    onChange: (e) => setSearch(e.target.value),
                    className:
                      'pl-9 pr-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary w-60'
                  })
                ]
              }),
              selectedIds.size > 0 &&
                _jsxs('button', {
                  onClick: () => setShowBatchDelete(true),
                  className:
                    'flex items-center gap-1.5 px-3 py-1.5 text-sm bg-danger text-white rounded-lg hover:bg-danger-hover transition-colors',
                  children: [
                    _jsx(Trash2, { size: 16 }),
                    t('common.batchDelete'),
                    ' (',
                    selectedIds.size,
                    ')'
                  ]
                }),
              _jsxs('button', {
                onClick: openAddModal,
                className:
                  'flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors',
                children: [_jsx(Plus, { size: 16 }), t('proxies.createProxy')]
              })
            ]
          })
        ]
      }),
      loading
        ? _jsx('div', {
            className: 'text-center py-12 text-text-muted',
            children: t('common.loading')
          })
        : !data?.items.length
          ? _jsx('div', {
              className: 'text-center py-12 text-text-muted',
              children: t('proxies.noProxies')
            })
          : _jsxs(_Fragment, {
              children: [
                _jsx('div', {
                  className: 'overflow-x-auto border border-border-light rounded-lg bg-bg-card',
                  children: _jsxs('table', {
                    className: 'w-full text-sm',
                    children: [
                      _jsx('thead', {
                        className: 'bg-bg-tertiary',
                        children: _jsxs('tr', {
                          children: [
                            _jsx('th', {
                              className: 'px-4 py-2.5 text-left w-10',
                              children: _jsx('button', {
                                onClick: toggleSelectAll,
                                className:
                                  'text-text-muted hover:text-text-primary transition-colors',
                                children: allSelected
                                  ? _jsx(CheckSquare, { size: 16 })
                                  : _jsx(Square, { size: 16 })
                              })
                            }),
                            _jsx('th', {
                              className: 'px-4 py-2.5 text-left font-medium text-text-muted',
                              children: t('proxies.protocol')
                            }),
                            _jsxs('th', {
                              className: 'px-4 py-2.5 text-left font-medium text-text-muted',
                              children: [t('proxies.host'), ':', t('proxies.port')]
                            }),
                            _jsx('th', {
                              className: 'px-4 py-2.5 text-left font-medium text-text-muted',
                              children: t('proxies.username')
                            }),
                            _jsx('th', {
                              className: 'px-4 py-2.5 text-left font-medium text-text-muted',
                              children: t('proxies.status')
                            }),
                            _jsx('th', {
                              className: 'px-4 py-2.5 text-left font-medium text-text-muted',
                              children: t('proxies.labels')
                            }),
                            _jsx('th', {
                              className: 'px-4 py-2.5 text-right font-medium text-text-muted',
                              children: t('common.actions')
                            })
                          ]
                        })
                      }),
                      _jsx('tbody', {
                        className: 'divide-y divide-border-light/50',
                        children: data.items.map((proxy) =>
                          _jsxs(
                            'tr',
                            {
                              className: 'hover:bg-bg-card-hover transition-colors',
                              children: [
                                _jsx('td', {
                                  className: 'px-4 py-2.5',
                                  children: _jsx('button', {
                                    onClick: () => toggleSelect(proxy.id),
                                    className:
                                      'text-text-muted hover:text-text-primary transition-colors',
                                    children: selectedIds.has(proxy.id)
                                      ? _jsx(CheckSquare, { size: 16, className: 'text-primary' })
                                      : _jsx(Square, { size: 16 })
                                  })
                                }),
                                _jsx('td', {
                                  className: 'px-4 py-2.5 font-mono text-xs uppercase',
                                  children: proxy.protocol
                                }),
                                _jsxs('td', {
                                  className: 'px-4 py-2.5 font-mono',
                                  children: [proxy.host, ':', proxy.port]
                                }),
                                _jsx('td', {
                                  className: 'px-4 py-2.5',
                                  children: proxy.username || '-'
                                }),
                                _jsx('td', {
                                  className: 'px-4 py-2.5',
                                  children: _jsx('span', {
                                    className: `px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[proxy.status] || statusColor.inactive}`,
                                    children: proxy.status
                                  })
                                }),
                                _jsx('td', {
                                  className: 'px-4 py-2.5',
                                  children: _jsx('div', {
                                    className: 'flex flex-wrap gap-1',
                                    children: proxy.labels.map((l) =>
                                      _jsx(
                                        'span',
                                        {
                                          className:
                                            'px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded',
                                          children: l
                                        },
                                        l
                                      )
                                    )
                                  })
                                }),
                                _jsx('td', {
                                  className: 'px-4 py-2.5 text-right',
                                  children: _jsxs('div', {
                                    className: 'flex items-center justify-end gap-1',
                                    children: [
                                      _jsx('button', {
                                        onClick: () => copyProxyAddress(proxy),
                                        className:
                                          'p-1 text-text-muted hover:text-primary hover:bg-primary-light rounded transition-colors',
                                        title: t('proxies.copyAddress'),
                                        children:
                                          copiedId === proxy.id
                                            ? _jsx(CheckSquare, {
                                                size: 16,
                                                className: 'text-success'
                                              })
                                            : _jsx(Copy, { size: 16 })
                                      }),
                                      _jsx('button', {
                                        onClick: () => openEditModal(proxy),
                                        className:
                                          'p-1 text-text-muted hover:text-primary hover:bg-primary-light rounded transition-colors',
                                        title: t('common.edit'),
                                        children: _jsx(Edit3, { size: 16 })
                                      }),
                                      _jsx('button', {
                                        onClick: () => setDeleteId(proxy.id),
                                        className:
                                          'p-1 text-danger hover:bg-danger-light rounded transition-colors',
                                        title: t('common.delete'),
                                        children: _jsx(Trash2, { size: 16 })
                                      })
                                    ]
                                  })
                                })
                              ]
                            },
                            proxy.id
                          )
                        )
                      })
                    ]
                  })
                }),
                data.totalPages > 1 &&
                  _jsxs('div', {
                    className: 'flex items-center justify-center gap-2',
                    children: [
                      _jsx('button', {
                        onClick: () => setPage((p) => Math.max(1, p - 1)),
                        disabled: page <= 1,
                        className:
                          'p-1.5 rounded border border-border-light disabled:opacity-40 hover:bg-bg-card-hover transition-colors',
                        children: _jsx(ChevronLeft, { size: 16 })
                      }),
                      _jsxs('span', {
                        className: 'text-sm text-text-muted',
                        children: [page, ' / ', data.totalPages]
                      }),
                      _jsx('button', {
                        onClick: () => setPage((p) => Math.min(data.totalPages, p + 1)),
                        disabled: page >= data.totalPages,
                        className:
                          'p-1.5 rounded border border-border-light disabled:opacity-40 hover:bg-bg-card-hover transition-colors',
                        children: _jsx(ChevronRight, { size: 16 })
                      })
                    ]
                  })
              ]
            }),
      showAdd &&
        _jsx('div', {
          className: 'fixed inset-0 z-50 flex items-center justify-center bg-black/40',
          onClick: () => setShowAdd(false),
          children: _jsxs('div', {
            className: 'bg-bg-card rounded-xl shadow-xl w-full max-w-md p-6',
            onClick: (e) => e.stopPropagation(),
            children: [
              _jsx('h2', {
                className: 'text-lg font-semibold mb-4',
                children: t('proxies.createProxy')
              }),
              renderForm(),
              errorMsg && _jsx('p', { className: 'mt-2 text-sm text-danger', children: errorMsg }),
              _jsxs('div', {
                className: 'flex justify-end gap-2 mt-6',
                children: [
                  _jsx('button', {
                    onClick: () => {
                      setShowAdd(false)
                      setErrorMsg('')
                    },
                    className:
                      'px-4 py-1.5 text-sm border border-border-light rounded-lg hover:bg-bg-card-hover transition-colors',
                    children: t('common.cancel')
                  }),
                  _jsx('button', {
                    onClick: handleAdd,
                    className:
                      'px-4 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors',
                    children: t('common.create')
                  })
                ]
              })
            ]
          })
        }),
      editingProxy &&
        _jsx('div', {
          className: 'fixed inset-0 z-50 flex items-center justify-center bg-black/40',
          onClick: () => {
            setEditingProxy(null)
            setErrorMsg('')
          },
          children: _jsxs('div', {
            className: 'bg-bg-card rounded-xl shadow-xl w-full max-w-md p-6',
            onClick: (e) => e.stopPropagation(),
            children: [
              _jsx('h2', {
                className: 'text-lg font-semibold text-text-primary mb-4',
                children: t('proxies.editProxy')
              }),
              renderForm(),
              errorMsg && _jsx('p', { className: 'mt-2 text-sm text-danger', children: errorMsg }),
              _jsxs('div', {
                className: 'flex justify-end gap-2 mt-6',
                children: [
                  _jsx('button', {
                    onClick: () => {
                      setEditingProxy(null)
                      setErrorMsg('')
                    },
                    className:
                      'px-4 py-1.5 text-sm border border-border-light rounded-lg hover:bg-bg-card-hover transition-colors',
                    children: t('common.cancel')
                  }),
                  _jsx('button', {
                    onClick: handleEdit,
                    className:
                      'px-4 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors',
                    children: t('common.save')
                  })
                ]
              })
            ]
          })
        }),
      deleteId &&
        _jsx('div', {
          className: 'fixed inset-0 z-50 flex items-center justify-center bg-black/40',
          onClick: () => setDeleteId(null),
          children: _jsxs('div', {
            className: 'bg-bg-card rounded-xl shadow-xl w-full max-w-sm p-6',
            onClick: (e) => e.stopPropagation(),
            children: [
              _jsx('h2', {
                className: 'text-lg font-semibold text-text-primary mb-2',
                children: t('common.delete')
              }),
              _jsx('p', {
                className: 'text-sm text-text-secondary mb-6',
                children: t('proxies.confirmDelete')
              }),
              _jsxs('div', {
                className: 'flex justify-end gap-2',
                children: [
                  _jsx('button', {
                    onClick: () => setDeleteId(null),
                    className:
                      'px-4 py-1.5 text-sm border border-border-light rounded-lg hover:bg-bg-card-hover transition-colors',
                    children: t('common.cancel')
                  }),
                  _jsx('button', {
                    onClick: handleDelete,
                    className:
                      'px-4 py-1.5 text-sm bg-danger text-white rounded-lg hover:bg-danger-hover transition-colors',
                    children: t('common.delete')
                  })
                ]
              })
            ]
          })
        }),
      showBatchDelete &&
        _jsx('div', {
          className: 'fixed inset-0 z-50 flex items-center justify-center bg-black/40',
          onClick: () => setShowBatchDelete(false),
          children: _jsxs('div', {
            className: 'bg-bg-card rounded-xl shadow-xl w-full max-w-sm p-6',
            onClick: (e) => e.stopPropagation(),
            children: [
              _jsx('h2', {
                className: 'text-lg font-semibold text-text-primary mb-2',
                children: t('common.batchDelete')
              }),
              _jsx('p', {
                className: 'text-sm text-text-secondary mb-6',
                children: t('proxies.confirmBatchDelete', { count: selectedIds.size })
              }),
              _jsxs('div', {
                className: 'flex justify-end gap-2',
                children: [
                  _jsx('button', {
                    onClick: () => setShowBatchDelete(false),
                    className:
                      'px-4 py-1.5 text-sm border border-border-light rounded-lg hover:bg-bg-card-hover transition-colors',
                    children: t('common.cancel')
                  }),
                  _jsx('button', {
                    onClick: handleBatchDelete,
                    className:
                      'px-4 py-1.5 text-sm bg-danger text-white rounded-lg hover:bg-danger-hover transition-colors',
                    children: t('common.delete')
                  })
                ]
              })
            ]
          })
        })
    ]
  })
}
export default Proxies
