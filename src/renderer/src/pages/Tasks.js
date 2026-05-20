import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from 'react/jsx-runtime'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus,
  Play,
  Pause,
  Square,
  Trash2,
  FileText,
  Edit3,
  CheckSquare as CheckSquareIcon,
  Square as SquareIcon,
  Trash,
  RefreshCw
} from 'lucide-react'
import { taskApi } from '../api'
import { usePaginatedList, useTemplateList } from '../hooks'
import { SearchInput, Pagination, Modal } from '../components/common'
const PAGE_SIZE = 20
const LOG_LEVEL_STYLES = {
  info: 'text-success',
  warn: 'text-warning',
  error: 'text-danger',
  debug: 'text-text-muted'
}
const Tasks = () => {
  const { t } = useTranslation()
  const { items, totalPages, page, loading, setPage, setSearch, search, refresh } =
    usePaginatedList(taskApi.list, PAGE_SIZE)
  const [expandedId, setExpandedId] = useState(null)
  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newScriptFolder, setNewScriptFolder] = useState('')
  const [newConfig, setNewConfig] = useState('{}')
  const [creating, setCreating] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [editScriptFolder, setEditScriptFolder] = useState('')
  const [editConfig, setEditConfig] = useState('{}')
  const [editing, setEditing] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [progressMap, setProgressMap] = useState({})
  const [errorMsg, setErrorMsg] = useState(null)
  const progressTimerRef = useRef(null)
  const { templates } = useTemplateList()
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  useEffect(() => {
    const runningTasks = items.filter((t) => t.status === 'running')
    if (runningTasks.length === 0) {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current)
        progressTimerRef.current = null
      }
      return
    }
    const fetchProgress = async () => {
      const entries = await Promise.all(
        runningTasks.map(async (task) => {
          try {
            const p = await taskApi.getProgress(task.id)
            return [task.id, p]
          } catch {
            return [task.id, null]
          }
        })
      )
      setProgressMap((prev) => {
        const next = { ...prev }
        for (const [id, p] of entries) {
          next[id] = p
        }
        return next
      })
    }
    fetchProgress()
    if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    progressTimerRef.current = setInterval(fetchProgress, 3000)
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current)
        progressTimerRef.current = null
      }
    }
  }, [items])
  useEffect(() => {
    if (!errorMsg) return
    const timer = setTimeout(() => setErrorMsg(null), 4000)
    return () => clearTimeout(timer)
  }, [errorMsg])
  const showError = (msg) => setErrorMsg(msg)
  const handleAction = async (action, id) => {
    try {
      await taskApi[action](id)
      refresh()
    } catch (e) {
      showError(e instanceof Error ? e.message : String(e))
    }
  }
  const handleToggleExpand = async (taskId) => {
    if (expandedId === taskId) {
      setExpandedId(null)
      setLogs([])
      return
    }
    setExpandedId(taskId)
    setLogsLoading(true)
    setLogs([])
    try {
      const res = await taskApi.getLogs(taskId)
      setLogs(res)
    } catch {
      setLogs([])
    } finally {
      setLogsLoading(false)
    }
  }
  const handleClearLogs = async (taskId) => {
    try {
      await taskApi.clearLogs(taskId)
      setLogs([])
    } catch (e) {
      showError(e instanceof Error ? e.message : String(e))
    }
  }
  const handleTemplateSelect = (templateId) => {
    setSelectedTemplateId(templateId)
    if (templateId) {
      const tpl = templates.find((t) => t.id === templateId)
      if (tpl) {
        setNewScriptFolder(tpl.type || '')
        setNewConfig(JSON.stringify(tpl.schema || {}, null, 2))
      }
    }
  }
  const handleCreate = async () => {
    let config
    try {
      config = JSON.parse(newConfig)
    } catch {
      showError(t('tasks.config', '配置') + ' JSON ' + t('common.error', '错误'))
      return
    }
    setCreating(true)
    try {
      await taskApi.create({ scriptFolder: newScriptFolder, config })
      setShowCreate(false)
      setNewScriptFolder('')
      setNewConfig('{}')
      setSelectedTemplateId('')
      refresh()
    } catch (e) {
      showError(e instanceof Error ? e.message : String(e))
    } finally {
      setCreating(false)
    }
  }
  const handleOpenEdit = (task) => {
    setEditTask(task)
    setEditScriptFolder(task.scriptFolder)
    setEditConfig(JSON.stringify(task.config, null, 2))
    setShowEdit(true)
  }
  const handleEdit = async () => {
    if (!editTask) return
    let config
    try {
      config = JSON.parse(editConfig)
    } catch {
      showError(t('tasks.config', '配置') + ' JSON ' + t('common.error', '错误'))
      return
    }
    setEditing(true)
    try {
      await taskApi.update(editTask.id, { scriptFolder: editScriptFolder, config })
      setShowEdit(false)
      setEditTask(null)
      refresh()
    } catch (e) {
      showError(e instanceof Error ? e.message : String(e))
    } finally {
      setEditing(false)
    }
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
    if (!items.length) return
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map((t) => t.id)))
    }
  }
  const handleBatchAction = async (action) => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    try {
      await Promise.all(ids.map((id) => taskApi[action](id)))
      setSelectedIds(new Set())
      refresh()
    } catch (e) {
      showError(e instanceof Error ? e.message : String(e))
    }
  }
  const formatTime = (v) => {
    if (!v) return '-'
    return new Date(v).toLocaleString()
  }
  const renderActionButtons = (task) => {
    const btnBase = 'p-1.5 rounded-lg transition-colors '
    const s = task.status
    if (s === 'running') {
      return _jsxs(_Fragment, {
        children: [
          _jsx('button', {
            onClick: (e) => {
              e.stopPropagation()
              handleAction('pause', task.id)
            },
            className: btnBase + 'text-warning hover:bg-warning-light',
            title: t('tasks.pause'),
            children: _jsx(Pause, { size: 15 })
          }),
          _jsx('button', {
            onClick: (e) => {
              e.stopPropagation()
              handleAction('stop', task.id)
            },
            className: btnBase + 'text-orange hover:bg-orange-light',
            title: t('tasks.stop'),
            children: _jsx(Square, { size: 15 })
          })
        ]
      })
    }
    if (s === 'paused') {
      return _jsxs(_Fragment, {
        children: [
          _jsx('button', {
            onClick: (e) => {
              e.stopPropagation()
              handleAction('resume', task.id)
            },
            className: btnBase + 'text-success hover:bg-success-light',
            title: t('tasks.resume'),
            children: _jsx(Play, { size: 15 })
          }),
          _jsx('button', {
            onClick: (e) => {
              e.stopPropagation()
              handleAction('stop', task.id)
            },
            className: btnBase + 'text-orange hover:bg-orange-light',
            title: t('tasks.stop'),
            children: _jsx(Square, { size: 15 })
          })
        ]
      })
    }
    return _jsxs(_Fragment, {
      children: [
        _jsx('button', {
          onClick: (e) => {
            e.stopPropagation()
            handleAction('start', task.id)
          },
          className: btnBase + 'text-primary hover:bg-primary-light',
          title: t('tasks.start'),
          children: _jsx(Play, { size: 15 })
        }),
        _jsx('button', {
          onClick: (e) => {
            e.stopPropagation()
            handleOpenEdit(task)
          },
          className: btnBase + 'text-text-secondary hover:bg-bg-tertiary',
          title: t('tasks.editTask'),
          children: _jsx(Edit3, { size: 15 })
        }),
        _jsx('button', {
          onClick: (e) => {
            e.stopPropagation()
            handleAction('delete', task.id)
          },
          className: btnBase + 'text-danger hover:bg-danger-light',
          title: t('common.delete'),
          children: _jsx(Trash2, { size: 15 })
        })
      ]
    })
  }
  const allSelected = items.length > 0 && selectedIds.size === items.length
  return _jsxs('div', {
    className: 'space-y-4',
    children: [
      errorMsg &&
        _jsxs('div', {
          className:
            'flex items-center gap-2 px-4 py-3 rounded-lg bg-danger-light text-danger border border-danger/20',
          children: [
            _jsx('span', { className: 'flex-1 text-sm', children: errorMsg }),
            _jsx('button', {
              onClick: () => setErrorMsg(null),
              className: 'text-danger/70 hover:text-danger',
              children: '\u00D7'
            })
          ]
        }),
      _jsxs('div', {
        className: 'flex items-center justify-between',
        children: [
          _jsx('h1', {
            className: 'text-2xl font-bold text-text-primary',
            children: t('tasks.title')
          }),
          _jsxs('div', {
            className: 'flex items-center gap-2',
            children: [
              _jsxs('button', {
                onClick: refresh,
                className:
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-light text-sm hover:bg-bg-card-hover transition-colors',
                children: [_jsx(RefreshCw, { size: 14 }), t('common.refresh')]
              }),
              _jsxs('button', {
                onClick: () => setShowCreate(true),
                className:
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors',
                children: [_jsx(Plus, { size: 16 }), t('tasks.createTask')]
              })
            ]
          })
        ]
      }),
      _jsxs('div', {
        className: 'flex items-center gap-3',
        children: [
          _jsx(SearchInput, {
            value: search,
            onChange: setSearch,
            placeholder: t('tasks.searchPlaceholder'),
            className: 'flex-1 max-w-sm',
            inputClassName:
              'w-full pl-9 pr-3 py-2 rounded-lg border border-border-light bg-bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary'
          }),
          selectedIds.size > 0 &&
            _jsxs('div', {
              className: 'flex items-center gap-2',
              children: [
                _jsx('span', {
                  className: 'text-sm text-text-muted',
                  children: t('tasks.selectedCount', { count: selectedIds.size })
                }),
                _jsxs('button', {
                  onClick: () => handleBatchAction('start'),
                  className:
                    'flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors',
                  children: [_jsx(Play, { size: 13 }), t('tasks.batchStart')]
                }),
                _jsxs('button', {
                  onClick: () => handleBatchAction('stop'),
                  className:
                    'flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-light text-orange text-xs font-medium hover:bg-orange/20 transition-colors',
                  children: [_jsx(Square, { size: 13 }), t('tasks.batchStop')]
                }),
                _jsxs('button', {
                  onClick: () => handleBatchAction('delete'),
                  className:
                    'flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-danger-light text-danger text-xs font-medium hover:bg-danger/20 transition-colors',
                  children: [_jsx(Trash, { size: 13 }), t('tasks.batchDelete')]
                })
              ]
            })
        ]
      }),
      loading && items.length === 0
        ? _jsx('div', {
            className: 'text-center py-12 text-text-muted',
            children: t('common.loading')
          })
        : items.length === 0
          ? _jsx('div', {
              className: 'text-center py-12 text-text-muted',
              children: t('tasks.noTasks')
            })
          : _jsx('div', {
              className: 'rounded-xl border border-border-light overflow-hidden',
              children: _jsxs('table', {
                className: 'w-full text-sm',
                children: [
                  _jsx('thead', {
                    children: _jsxs('tr', {
                      className: 'bg-bg-tertiary',
                      children: [
                        _jsx('th', {
                          className: 'px-4 py-3 w-10',
                          children: _jsx('button', {
                            onClick: toggleSelectAll,
                            className: 'text-text-muted hover:text-text-primary transition-colors',
                            children: allSelected
                              ? _jsx(CheckSquareIcon, { size: 16 })
                              : _jsx(SquareIcon, { size: 16 })
                          })
                        }),
                        _jsx('th', {
                          className: 'px-4 py-3 font-medium text-text-muted',
                          children: t('tasks.scriptFolder')
                        }),
                        _jsx('th', {
                          className: 'px-4 py-3 font-medium text-text-muted',
                          children: t('common.status')
                        }),
                        _jsx('th', {
                          className: 'px-4 py-3 font-medium text-text-muted',
                          children: t('tasks.startTime')
                        }),
                        _jsx('th', {
                          className: 'px-4 py-3 font-medium text-text-muted',
                          children: t('tasks.endTime')
                        }),
                        _jsx('th', {
                          className: 'px-4 py-3 font-medium text-text-muted text-right',
                          children: t('tasks.actions')
                        })
                      ]
                    })
                  }),
                  _jsx('tbody', {
                    children: items.map((task) =>
                      _jsx(
                        'tr',
                        {
                          className: 'border-b border-border-light/50',
                          children: _jsxs('td', {
                            colSpan: 6,
                            className: 'p-0',
                            children: [
                              _jsxs('div', {
                                onClick: () => handleToggleExpand(task.id),
                                className:
                                  'flex items-center cursor-pointer hover:bg-bg-card-hover transition-colors',
                                children: [
                                  _jsx('div', {
                                    className: 'px-4 py-3 w-10',
                                    onClick: (e) => e.stopPropagation(),
                                    children: _jsx('button', {
                                      onClick: () => toggleSelect(task.id),
                                      className:
                                        'text-text-muted hover:text-text-primary transition-colors',
                                      children: selectedIds.has(task.id)
                                        ? _jsx(CheckSquareIcon, {
                                            size: 16,
                                            className: 'text-primary'
                                          })
                                        : _jsx(SquareIcon, { size: 16 })
                                    })
                                  }),
                                  _jsxs('div', {
                                    className:
                                      'flex-1 grid grid-cols-[1fr_100px_160px_160px] items-center',
                                    children: [
                                      _jsx('div', {
                                        className:
                                          'px-4 py-3 font-mono text-xs truncate text-text-primary',
                                        children: task.scriptFolder
                                      }),
                                      _jsx('div', {
                                        className: 'px-4 py-3',
                                        children: _jsxs('span', {
                                          className: `inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-status-${task.status}-bg text-status-${task.status}-text`,
                                          children: [
                                            task.status === 'running' &&
                                              _jsx('span', {
                                                className:
                                                  'w-1.5 h-1.5 rounded-full bg-primary animate-pulse'
                                              }),
                                            t(`tasks.status.${task.status}`)
                                          ]
                                        })
                                      }),
                                      _jsx('div', {
                                        className: 'px-4 py-3 text-text-secondary text-xs',
                                        children: formatTime(task.startedAt)
                                      }),
                                      _jsx('div', {
                                        className: 'px-4 py-3 text-text-secondary text-xs',
                                        children: formatTime(task.endedAt)
                                      })
                                    ]
                                  }),
                                  _jsx('div', {
                                    className: 'flex items-center gap-1 px-4 py-3',
                                    onClick: (e) => e.stopPropagation(),
                                    children: renderActionButtons(task)
                                  })
                                ]
                              }),
                              task.status === 'running' &&
                                progressMap[task.id] &&
                                _jsx('div', {
                                  className:
                                    'px-4 py-2 border-t border-border-light/50 bg-bg-tertiary/50',
                                  children: _jsxs('div', {
                                    className: 'flex items-center gap-3',
                                    children: [
                                      _jsx('span', {
                                        className: 'text-xs text-text-muted shrink-0',
                                        children: t('tasks.progress')
                                      }),
                                      _jsx('div', {
                                        className:
                                          'flex-1 h-2 bg-bg-card rounded-full overflow-hidden',
                                        children: _jsx('div', {
                                          className:
                                            'h-full bg-primary rounded-full transition-all duration-500',
                                          style: {
                                            width: `${Math.min(100, Math.max(0, progressMap[task.id].percent))}%`
                                          }
                                        })
                                      }),
                                      _jsxs('span', {
                                        className: 'text-xs font-mono text-text-muted shrink-0',
                                        children: [progressMap[task.id].percent, '%']
                                      }),
                                      progressMap[task.id].message &&
                                        _jsx('span', {
                                          className:
                                            'text-xs text-text-muted truncate max-w-[200px]',
                                          children: progressMap[task.id].message
                                        })
                                    ]
                                  })
                                }),
                              expandedId === task.id &&
                                _jsxs('div', {
                                  className: 'border-t border-border-light bg-bg-tertiary/30',
                                  children: [
                                    _jsxs('div', {
                                      className:
                                        'flex items-center justify-between px-4 py-2 border-b border-border-light',
                                      children: [
                                        _jsxs('div', {
                                          className: 'flex items-center gap-2',
                                          children: [
                                            _jsx(FileText, {
                                              size: 14,
                                              className: 'text-text-muted'
                                            }),
                                            _jsx('span', {
                                              className: 'text-xs font-medium text-text-muted',
                                              children: t('tasks.logs')
                                            })
                                          ]
                                        }),
                                        _jsxs('button', {
                                          onClick: () => handleClearLogs(task.id),
                                          className:
                                            'flex items-center gap-1 px-2 py-1 rounded text-xs text-danger hover:bg-danger-light transition-colors',
                                          children: [
                                            _jsx(Trash2, { size: 12 }),
                                            t('tasks.clearLogs')
                                          ]
                                        })
                                      ]
                                    }),
                                    _jsx('div', {
                                      className: 'max-h-64 overflow-y-auto px-4 py-2',
                                      children: logsLoading
                                        ? _jsx('div', {
                                            className: 'text-xs text-text-muted py-2',
                                            children: t('common.loading')
                                          })
                                        : logs.length === 0
                                          ? _jsx('div', {
                                              className: 'text-xs text-text-muted py-2',
                                              children: t('tasks.noLogs')
                                            })
                                          : _jsx('div', {
                                              className: 'space-y-0.5 font-mono text-xs',
                                              children: logs.map((log) =>
                                                _jsxs(
                                                  'div',
                                                  {
                                                    className: 'flex gap-3',
                                                    children: [
                                                      _jsx('span', {
                                                        className: 'text-text-muted shrink-0',
                                                        children: new Date(
                                                          log.timestamp
                                                        ).toLocaleTimeString()
                                                      }),
                                                      _jsxs('span', {
                                                        className: `shrink-0 w-10 ${LOG_LEVEL_STYLES[log.level]}`,
                                                        children: [
                                                          '[',
                                                          log.level.toUpperCase(),
                                                          ']'
                                                        ]
                                                      }),
                                                      _jsx('span', {
                                                        className: 'text-text-secondary break-all',
                                                        children: log.message
                                                      })
                                                    ]
                                                  },
                                                  log.id
                                                )
                                              )
                                            })
                                    })
                                  ]
                                })
                            ]
                          })
                        },
                        task.id
                      )
                    )
                  })
                ]
              })
            }),
      totalPages > 1 &&
        _jsx(Pagination, {
          page: page,
          totalPages: totalPages,
          onPrev: () => setPage((p) => Math.max(1, p - 1)),
          onNext: () => setPage((p) => Math.min(totalPages, p + 1)),
          pageText: `${page} / ${totalPages}`
        }),
      _jsxs(Modal, {
        open: showCreate,
        onClose: () => setShowCreate(false),
        title: t('tasks.createTask'),
        children: [
          _jsxs('div', {
            className: 'space-y-4',
            children: [
              _jsxs('div', {
                children: [
                  _jsx('label', {
                    className: 'block text-sm font-medium mb-1',
                    children: t('tasks.selectTemplate', '从模板创建')
                  }),
                  _jsxs('select', {
                    value: selectedTemplateId,
                    onChange: (e) => handleTemplateSelect(e.target.value),
                    className:
                      'w-full px-3 py-2 rounded-lg border border-border-light bg-bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary',
                    children: [
                      _jsx('option', { value: '', children: t('tasks.noTemplate', '不使用模板') }),
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
                    className: 'block text-sm font-medium mb-1',
                    children: t('tasks.scriptFolder')
                  }),
                  _jsx('input', {
                    type: 'text',
                    value: newScriptFolder,
                    onChange: (e) => setNewScriptFolder(e.target.value),
                    placeholder: '/path/to/script',
                    className:
                      'w-full px-3 py-2 rounded-lg border border-border-light bg-bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary'
                  })
                ]
              }),
              _jsxs('div', {
                children: [
                  _jsxs('label', {
                    className: 'block text-sm font-medium mb-1',
                    children: [t('tasks.config'), ' (JSON)']
                  }),
                  _jsx('textarea', {
                    value: newConfig,
                    onChange: (e) => setNewConfig(e.target.value),
                    rows: 6,
                    className:
                      'w-full px-3 py-2 rounded-lg border border-border-light bg-bg-card text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary resize-y'
                  })
                ]
              })
            ]
          }),
          _jsxs('div', {
            className: 'flex justify-end gap-2 mt-6',
            children: [
              _jsx('button', {
                onClick: () => setShowCreate(false),
                className:
                  'px-4 py-2 rounded-lg border border-border-light text-sm hover:bg-bg-card-hover transition-colors',
                children: t('common.cancel')
              }),
              _jsx('button', {
                onClick: handleCreate,
                disabled: creating || !newScriptFolder.trim(),
                className:
                  'px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors',
                children: creating ? t('common.loading') : t('common.create')
              })
            ]
          })
        ]
      }),
      _jsxs(Modal, {
        open: showEdit && !!editTask,
        onClose: () => setShowEdit(false),
        title: t('tasks.editTask'),
        children: [
          _jsxs('div', {
            className: 'space-y-4',
            children: [
              _jsxs('div', {
                children: [
                  _jsx('label', {
                    className: 'block text-sm font-medium mb-1',
                    children: t('tasks.scriptFolder')
                  }),
                  _jsx('input', {
                    type: 'text',
                    value: editScriptFolder,
                    onChange: (e) => setEditScriptFolder(e.target.value),
                    className:
                      'w-full px-3 py-2 rounded-lg border border-border-light bg-bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary'
                  })
                ]
              }),
              _jsxs('div', {
                children: [
                  _jsxs('label', {
                    className: 'block text-sm font-medium mb-1',
                    children: [t('tasks.config'), ' (JSON)']
                  }),
                  _jsx('textarea', {
                    value: editConfig,
                    onChange: (e) => setEditConfig(e.target.value),
                    rows: 6,
                    className:
                      'w-full px-3 py-2 rounded-lg border border-border-light bg-bg-card text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary resize-y'
                  })
                ]
              })
            ]
          }),
          _jsxs('div', {
            className: 'flex justify-end gap-2 mt-6',
            children: [
              _jsx('button', {
                onClick: () => setShowEdit(false),
                className:
                  'px-4 py-2 rounded-lg border border-border-light text-sm hover:bg-bg-card-hover transition-colors',
                children: t('common.cancel')
              }),
              _jsx('button', {
                onClick: handleEdit,
                disabled: editing || !editScriptFolder.trim(),
                className:
                  'px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors',
                children: editing ? t('common.loading') : t('common.save')
              })
            ]
          })
        ]
      })
    ]
  })
}
export default Tasks
