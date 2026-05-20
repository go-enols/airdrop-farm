import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from 'react/jsx-runtime'
import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { airdropApi } from '../api'
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
const STATUS_COLORS = {
  ongoing: 'bg-blue-50 text-blue-600',
  completed: 'bg-green-50 text-green-600',
  cancelled: 'bg-red-50 text-red-600',
  claimed: 'bg-purple-50 text-purple-600'
}
const TYPE_COLORS = {
  testnet: 'bg-cyan-50 text-cyan-600',
  mainnet: 'bg-blue-50 text-blue-600',
  galxe: 'bg-orange-50 text-orange-600',
  quest: 'bg-purple-50 text-purple-600',
  social: 'bg-pink-50 text-pink-600',
  other: 'bg-gray-100 text-gray-600'
}
const STATUS_KEYS = {
  ongoing: 'airdrops.statusOngoing',
  completed: 'airdrops.statusCompleted',
  cancelled: 'airdrops.statusCancelled',
  claimed: 'airdrops.statusClaimed'
}
const TYPE_KEYS = {
  testnet: 'airdrops.typeTestnet',
  mainnet: 'airdrops.typeMainnet',
  galxe: 'airdrops.typeGalxe',
  quest: 'airdrops.typeQuest',
  social: 'airdrops.typeSocial',
  other: 'airdrops.typeOther'
}
const AIRDROP_STATUSES = ['ongoing', 'completed', 'cancelled', 'claimed']
const AIRDROP_TYPES = ['testnet', 'mainnet', 'galxe', 'quest', 'social', 'other']
const Airdrops = () => {
  const { t } = useTranslation()
  const { items, total, page, totalPages, loading, error, setPage, setSearch, search, refresh } =
    usePaginatedList((p, ps, s) => airdropApi.list(p, ps, s), PAGE_SIZE)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    name: '',
    chain: '',
    status: 'ongoing',
    projectType: 'testnet',
    description: ''
  })
  const [creating, setCreating] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [editForm, setEditForm] = useState({
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
  const [editError, setEditError] = useState(null)
  const [createError, setCreateError] = useState(null)
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
    async (id) => {
      if (!window.confirm(t('airdrops.confirmDelete'))) return
      try {
        await airdropApi.delete(id)
        refresh()
      } catch {
        // Ignore delete errors
      }
    },
    [t, refresh]
  )
  const openEdit = (item) => {
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
  const removeLink = (index) => {
    setEditForm((f) => ({ ...f, links: f.links.filter((_, i) => i !== index) }))
  }
  const updateLink = (index, field, value) => {
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
          status: 'pending',
          notes: ''
        }
      ]
    }))
  }
  const removeTask = (index) => {
    setEditForm((f) => ({ ...f, tasks: f.tasks.filter((_, i) => i !== index) }))
  }
  const updateTask = (index, field, value) => {
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
  const removeEarning = (index) => {
    setEditForm((f) => ({ ...f, earnings: f.earnings.filter((_, i) => i !== index) }))
  }
  const updateEarning = (index, field, value) => {
    setEditForm((f) => ({
      ...f,
      earnings: f.earnings.map((e, i) => (i === index ? { ...e, [field]: value } : e))
    }))
  }
  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }
  return _jsxs('div', {
    className: 'space-y-4',
    children: [
      _jsxs('div', {
        className: 'flex items-center justify-between',
        children: [
          _jsx('h1', { className: 'text-2xl font-bold', children: t('airdrops.title') }),
          _jsxs('div', {
            className: 'flex items-center gap-3',
            children: [
              _jsx(SearchInput, {
                value: search,
                onChange: setSearch,
                placeholder: t('airdrops.searchPlaceholder')
              }),
              _jsxs('button', {
                onClick: () => setShowCreate(true),
                className:
                  'flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors',
                children: [_jsx(Plus, { size: 16 }), t('airdrops.createAirdrop')]
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
                _jsx(ExternalLink, { size: 48 }),
                _jsx('p', { className: 'mt-4 text-lg', children: t('airdrops.noAirdrops') })
              ]
            })
          : _jsxs(_Fragment, {
              children: [
                _jsx('div', {
                  className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
                  children: items.map((item) =>
                    _jsxs(
                      'div',
                      {
                        className:
                          'dark:bg-bg-card rounded-xl border border-border-light p-4 hover:shadow-md transition-shadow flex flex-col',
                        children: [
                          _jsxs('div', {
                            className: 'flex items-start justify-between mb-2',
                            children: [
                              _jsx('h3', {
                                className: 'font-semibold text-base truncate flex-1 mr-2',
                                children: item.name
                              }),
                              _jsxs('div', {
                                className: 'flex items-center gap-1 shrink-0',
                                children: [
                                  _jsx('button', {
                                    onClick: () => openEdit(item),
                                    className:
                                      'p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors',
                                    children: _jsx(Edit3, { size: 14 })
                                  }),
                                  _jsx('button', {
                                    onClick: () => handleDelete(item.id),
                                    className:
                                      'p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors',
                                    children: _jsx(Trash2, { size: 14 })
                                  })
                                ]
                              })
                            ]
                          }),
                          _jsxs('div', {
                            className: 'flex items-center gap-2 mb-2',
                            children: [
                              _jsx('span', {
                                className: `inline-block px-2 py-0.5 text-xs rounded-full font-medium ${STATUS_COLORS[item.status]}`,
                                children: t(STATUS_KEYS[item.status])
                              }),
                              _jsx('span', {
                                className: `inline-block px-2 py-0.5 text-xs rounded-full font-medium ${TYPE_COLORS[item.projectType]}`,
                                children: t(TYPE_KEYS[item.projectType])
                              })
                            ]
                          }),
                          _jsx('div', {
                            className: 'text-sm text-text-muted mb-2',
                            children: item.chain
                          }),
                          item.description &&
                            _jsx('p', {
                              className: 'text-sm text-gray-600 mb-3 line-clamp-2',
                              children: item.description
                            }),
                          item.tags.length > 0 &&
                            _jsx('div', {
                              className: 'flex flex-wrap gap-1',
                              children: item.tags.map((tag, i) =>
                                _jsx(
                                  'span',
                                  {
                                    className:
                                      'inline-block px-2 py-0.5 text-xs bg-gray-100 text-text-muted rounded-full',
                                    children: tag
                                  },
                                  i
                                )
                              )
                            }),
                          _jsxs('button', {
                            onClick: () => toggleExpand(item.id),
                            className:
                              'flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mt-2 transition-colors',
                            children: [
                              expandedId === item.id
                                ? _jsx(ChevronUp, { size: 14 })
                                : _jsx(ChevronDown, { size: 14 }),
                              expandedId === item.id ? t('common.close') : t('common.edit')
                            ]
                          }),
                          expandedId === item.id &&
                            _jsxs('div', {
                              className: 'mt-3 pt-3 border-t border-gray-100 space-y-3',
                              children: [
                                _jsxs('div', {
                                  children: [
                                    _jsxs('div', {
                                      className:
                                        'flex items-center gap-1 text-xs font-medium text-text-muted mb-1',
                                      children: [_jsx(Link, { size: 12 }), t('airdrops.links')]
                                    }),
                                    item.links.length === 0
                                      ? _jsx('p', {
                                          className: 'text-xs text-gray-300',
                                          children: t('airdrops.noLinks')
                                        })
                                      : _jsx('div', {
                                          className: 'space-y-1',
                                          children: item.links.map((link, i) =>
                                            _jsxs(
                                              'a',
                                              {
                                                href: link.url,
                                                target: '_blank',
                                                rel: 'noopener noreferrer',
                                                className:
                                                  'flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700',
                                                children: [
                                                  _jsx(ExternalLink, { size: 10 }),
                                                  link.label || link.url
                                                ]
                                              },
                                              i
                                            )
                                          )
                                        })
                                  ]
                                }),
                                _jsxs('div', {
                                  children: [
                                    _jsxs('div', {
                                      className:
                                        'flex items-center gap-1 text-xs font-medium text-text-muted mb-1',
                                      children: [
                                        _jsx(ListChecks, { size: 12 }),
                                        t('airdrops.tasks')
                                      ]
                                    }),
                                    item.tasks.length === 0
                                      ? _jsx('p', {
                                          className: 'text-xs text-gray-300',
                                          children: t('airdrops.noTasks')
                                        })
                                      : _jsx('div', {
                                          className: 'space-y-1',
                                          children: item.tasks.map((task, i) =>
                                            _jsxs(
                                              'div',
                                              {
                                                className: 'text-xs text-gray-600',
                                                children: [
                                                  _jsx('span', {
                                                    className: 'font-medium',
                                                    children: task.title
                                                  }),
                                                  task.description &&
                                                    _jsxs('span', {
                                                      className: 'text-gray-400 ml-1',
                                                      children: ['\u2014 ', task.description]
                                                    })
                                                ]
                                              },
                                              i
                                            )
                                          )
                                        })
                                  ]
                                }),
                                _jsxs('div', {
                                  children: [
                                    _jsxs('div', {
                                      className:
                                        'flex items-center gap-1 text-xs font-medium text-text-muted mb-1',
                                      children: [
                                        _jsx(DollarSign, { size: 12 }),
                                        t('airdrops.earnings')
                                      ]
                                    }),
                                    item.earnings.length === 0
                                      ? _jsx('p', {
                                          className: 'text-xs text-gray-300',
                                          children: t('airdrops.noEarnings')
                                        })
                                      : _jsx('div', {
                                          className: 'space-y-1',
                                          children: item.earnings.map((earning, i) =>
                                            _jsxs(
                                              'div',
                                              {
                                                className: 'text-xs text-gray-600',
                                                children: [
                                                  earning.amount,
                                                  ' ',
                                                  earning.token,
                                                  earning.valueUsd != null &&
                                                    _jsxs('span', {
                                                      className: 'text-gray-400 ml-1',
                                                      children: ['($', earning.valueUsd, ')']
                                                    })
                                                ]
                                              },
                                              i
                                            )
                                          )
                                        })
                                  ]
                                })
                              ]
                            })
                        ]
                      },
                      item.id
                    )
                  )
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
        onClose: () => {
          setShowCreate(false)
          setCreateError(null)
        },
        title: t('airdrops.createAirdrop'),
        scrollable: true,
        children: [
          _jsxs('div', {
            className: 'space-y-4',
            children: [
              _jsxs('div', {
                children: [
                  _jsx('label', {
                    className: 'block text-sm font-medium text-gray-700 mb-1',
                    children: t('airdrops.name')
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
                    children: t('airdrops.chain')
                  }),
                  _jsx('input', {
                    type: 'text',
                    value: form.chain,
                    onChange: (e) => setForm((f) => ({ ...f, chain: e.target.value })),
                    className:
                      'w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
                  })
                ]
              }),
              _jsxs('div', {
                children: [
                  _jsx('label', {
                    className: 'block text-sm font-medium text-gray-700 mb-1',
                    children: t('airdrops.status')
                  }),
                  _jsx('select', {
                    value: form.status,
                    onChange: (e) => setForm((f) => ({ ...f, status: e.target.value })),
                    className:
                      'w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary',
                    children: AIRDROP_STATUSES.map((s) =>
                      _jsx('option', { value: s, children: t(STATUS_KEYS[s]) }, s)
                    )
                  })
                ]
              }),
              _jsxs('div', {
                children: [
                  _jsx('label', {
                    className: 'block text-sm font-medium text-gray-700 mb-1',
                    children: t('airdrops.projectType')
                  }),
                  _jsx('select', {
                    value: form.projectType,
                    onChange: (e) => setForm((f) => ({ ...f, projectType: e.target.value })),
                    className:
                      'w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary',
                    children: AIRDROP_TYPES.map((tp) =>
                      _jsx('option', { value: tp, children: t(TYPE_KEYS[tp]) }, tp)
                    )
                  })
                ]
              }),
              _jsxs('div', {
                children: [
                  _jsx('label', {
                    className: 'block text-sm font-medium text-gray-700 mb-1',
                    children: t('airdrops.description')
                  }),
                  _jsx('textarea', {
                    value: form.description,
                    onChange: (e) => setForm((f) => ({ ...f, description: e.target.value })),
                    rows: 3,
                    className:
                      'w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none'
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
                disabled: creating || !form.name.trim() || !form.chain.trim(),
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
        title: t('airdrops.editAirdrop'),
        maxWidth: 'max-w-lg',
        scrollable: true,
        children: [
          _jsxs('div', {
            className: 'space-y-4',
            children: [
              _jsxs('div', {
                children: [
                  _jsx('label', {
                    className: 'block text-sm font-medium text-gray-700 mb-1',
                    children: t('airdrops.name')
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
                    children: t('airdrops.chain')
                  }),
                  _jsx('input', {
                    type: 'text',
                    value: editForm.chain,
                    onChange: (e) => setEditForm((f) => ({ ...f, chain: e.target.value })),
                    className:
                      'w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
                  })
                ]
              }),
              _jsxs('div', {
                children: [
                  _jsx('label', {
                    className: 'block text-sm font-medium text-gray-700 mb-1',
                    children: t('airdrops.status')
                  }),
                  _jsx('select', {
                    value: editForm.status,
                    onChange: (e) => setEditForm((f) => ({ ...f, status: e.target.value })),
                    className:
                      'w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary',
                    children: AIRDROP_STATUSES.map((s) =>
                      _jsx('option', { value: s, children: t(STATUS_KEYS[s]) }, s)
                    )
                  })
                ]
              }),
              _jsxs('div', {
                children: [
                  _jsx('label', {
                    className: 'block text-sm font-medium text-gray-700 mb-1',
                    children: t('airdrops.projectType')
                  }),
                  _jsx('select', {
                    value: editForm.projectType,
                    onChange: (e) => setEditForm((f) => ({ ...f, projectType: e.target.value })),
                    className:
                      'w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary',
                    children: AIRDROP_TYPES.map((tp) =>
                      _jsx('option', { value: tp, children: t(TYPE_KEYS[tp]) }, tp)
                    )
                  })
                ]
              }),
              _jsxs('div', {
                children: [
                  _jsx('label', {
                    className: 'block text-sm font-medium text-gray-700 mb-1',
                    children: t('airdrops.description')
                  }),
                  _jsx('textarea', {
                    value: editForm.description,
                    onChange: (e) => setEditForm((f) => ({ ...f, description: e.target.value })),
                    rows: 3,
                    className:
                      'w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none'
                  })
                ]
              }),
              _jsxs('div', {
                children: [
                  _jsx('label', {
                    className: 'block text-sm font-medium text-gray-700 mb-1',
                    children: t('airdrops.tags')
                  }),
                  _jsx('input', {
                    type: 'text',
                    value: editForm.tags,
                    onChange: (e) => setEditForm((f) => ({ ...f, tags: e.target.value })),
                    placeholder: 'tag1, tag2',
                    className:
                      'w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
                  })
                ]
              }),
              _jsxs('div', {
                children: [
                  _jsx('label', {
                    className: 'block text-sm font-medium text-gray-700 mb-1',
                    children: t('airdrops.labels')
                  }),
                  _jsx('input', {
                    type: 'text',
                    value: editForm.labels,
                    onChange: (e) => setEditForm((f) => ({ ...f, labels: e.target.value })),
                    placeholder: 'label1, label2',
                    className:
                      'w-full px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
                  })
                ]
              }),
              _jsxs('div', {
                children: [
                  _jsxs('div', {
                    className: 'flex items-center justify-between mb-2',
                    children: [
                      _jsxs('label', {
                        className: 'text-sm font-medium text-gray-700 flex items-center gap-1',
                        children: [_jsx(Link, { size: 14 }), t('airdrops.links')]
                      }),
                      _jsxs('button', {
                        onClick: addLink,
                        className:
                          'text-xs text-blue-500 hover:text-blue-700 flex items-center gap-0.5',
                        children: [_jsx(Plus, { size: 12 }), t('airdrops.addLink')]
                      })
                    ]
                  }),
                  editForm.links.length === 0
                    ? _jsx('p', {
                        className: 'text-xs text-gray-300',
                        children: t('airdrops.noLinks')
                      })
                    : _jsx('div', {
                        className: 'space-y-2',
                        children: editForm.links.map((link, i) =>
                          _jsxs(
                            'div',
                            {
                              className: 'flex items-center gap-2',
                              children: [
                                _jsx('input', {
                                  type: 'text',
                                  value: link.label,
                                  onChange: (e) => updateLink(i, 'label', e.target.value),
                                  placeholder: t('airdrops.linkLabel'),
                                  className:
                                    'flex-1 px-2 py-1.5 text-xs border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
                                }),
                                _jsx('input', {
                                  type: 'text',
                                  value: link.url,
                                  onChange: (e) => updateLink(i, 'url', e.target.value),
                                  placeholder: t('airdrops.linkUrl'),
                                  className:
                                    'flex-1 px-2 py-1.5 text-xs border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
                                }),
                                _jsx('button', {
                                  onClick: () => removeLink(i),
                                  className: 'p-1 text-gray-400 hover:text-red-500 shrink-0',
                                  children: _jsx(Trash2, { size: 12 })
                                })
                              ]
                            },
                            i
                          )
                        )
                      })
                ]
              }),
              _jsxs('div', {
                children: [
                  _jsxs('div', {
                    className: 'flex items-center justify-between mb-2',
                    children: [
                      _jsxs('label', {
                        className: 'text-sm font-medium text-gray-700 flex items-center gap-1',
                        children: [_jsx(ListChecks, { size: 14 }), t('airdrops.tasks')]
                      }),
                      _jsxs('button', {
                        onClick: addTask,
                        className:
                          'text-xs text-blue-500 hover:text-blue-700 flex items-center gap-0.5',
                        children: [_jsx(Plus, { size: 12 }), t('airdrops.addTask')]
                      })
                    ]
                  }),
                  editForm.tasks.length === 0
                    ? _jsx('p', {
                        className: 'text-xs text-gray-300',
                        children: t('airdrops.noTasks')
                      })
                    : _jsx('div', {
                        className: 'space-y-2',
                        children: editForm.tasks.map((task, i) =>
                          _jsxs(
                            'div',
                            {
                              className: 'flex items-start gap-2',
                              children: [
                                _jsxs('div', {
                                  className: 'flex-1 space-y-1',
                                  children: [
                                    _jsx('input', {
                                      type: 'text',
                                      value: task.title,
                                      onChange: (e) => updateTask(i, 'title', e.target.value),
                                      placeholder: t('airdrops.taskTitle'),
                                      className:
                                        'w-full px-2 py-1.5 text-xs border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
                                    }),
                                    _jsx('input', {
                                      type: 'text',
                                      value: task.description,
                                      onChange: (e) => updateTask(i, 'description', e.target.value),
                                      placeholder: t('airdrops.taskDescription'),
                                      className:
                                        'w-full px-2 py-1.5 text-xs border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
                                    })
                                  ]
                                }),
                                _jsx('button', {
                                  onClick: () => removeTask(i),
                                  className: 'p-1 text-gray-400 hover:text-red-500 shrink-0 mt-1',
                                  children: _jsx(Trash2, { size: 12 })
                                })
                              ]
                            },
                            task.id
                          )
                        )
                      })
                ]
              }),
              _jsxs('div', {
                children: [
                  _jsxs('div', {
                    className: 'flex items-center justify-between mb-2',
                    children: [
                      _jsxs('label', {
                        className: 'text-sm font-medium text-gray-700 flex items-center gap-1',
                        children: [_jsx(DollarSign, { size: 14 }), t('airdrops.earnings')]
                      }),
                      _jsxs('button', {
                        onClick: addEarning,
                        className:
                          'text-xs text-blue-500 hover:text-blue-700 flex items-center gap-0.5',
                        children: [_jsx(Plus, { size: 12 }), t('airdrops.addEarning')]
                      })
                    ]
                  }),
                  editForm.earnings.length === 0
                    ? _jsx('p', {
                        className: 'text-xs text-gray-300',
                        children: t('airdrops.noEarnings')
                      })
                    : _jsx('div', {
                        className: 'space-y-2',
                        children: editForm.earnings.map((earning, i) =>
                          _jsxs(
                            'div',
                            {
                              className: 'flex items-center gap-2',
                              children: [
                                _jsx('input', {
                                  type: 'text',
                                  value: earning.token,
                                  onChange: (e) => updateEarning(i, 'token', e.target.value),
                                  placeholder: t('airdrops.earningToken'),
                                  className:
                                    'w-20 px-2 py-1.5 text-xs border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
                                }),
                                _jsx('input', {
                                  type: 'number',
                                  value: earning.amount,
                                  onChange: (e) =>
                                    updateEarning(i, 'amount', parseFloat(e.target.value) || 0),
                                  placeholder: t('airdrops.earningAmount'),
                                  className:
                                    'w-24 px-2 py-1.5 text-xs border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
                                }),
                                _jsx('input', {
                                  type: 'text',
                                  value: earning.notes,
                                  onChange: (e) => updateEarning(i, 'notes', e.target.value),
                                  placeholder: t('airdrops.earningNotes'),
                                  className:
                                    'flex-1 px-2 py-1.5 text-xs border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
                                }),
                                _jsx('button', {
                                  onClick: () => removeEarning(i),
                                  className: 'p-1 text-gray-400 hover:text-red-500 shrink-0',
                                  children: _jsx(Trash2, { size: 12 })
                                })
                              ]
                            },
                            earning.id
                          )
                        )
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
                disabled: saving || !editForm.name.trim() || !editForm.chain.trim(),
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
export default Airdrops
