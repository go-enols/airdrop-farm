import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from 'react/jsx-runtime'
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { logApi } from '../api'
import { RefreshCw, Download, Trash2, Calendar } from 'lucide-react'
import { SearchInput } from '../components/common'
import { useDebounce } from '../hooks'
const INITIAL_LIMIT = 50
const levelColor = {
  debug: 'bg-gray-100 text-gray-600 dark:bg-bg-tertiary dark:text-gray-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  warn: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  error: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
}
const LEVELS = ['debug', 'info', 'warn', 'error']
const levelLabelKey = {
  debug: 'logs.levelDebug',
  info: 'logs.levelInfo',
  warn: 'logs.levelWarn',
  error: 'logs.levelError'
}
const Logs = () => {
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [level, setLevel] = useState('')
  const [category, setCategory] = useState('')
  const [since, setSince] = useState('')
  const [until, setUntil] = useState('')
  const [loading, setLoading] = useState(false)
  const [limit, setLimit] = useState(INITIAL_LIMIT)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await logApi.query(
        level || undefined,
        category || undefined,
        debouncedSearch || undefined,
        since || undefined,
        until || undefined,
        limit
      )
      setData(res)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [level, category, debouncedSearch, since, until, limit])
  const fetchCategories = useCallback(async () => {
    try {
      const cats = await logApi.getCategories()
      setCategories(cats)
    } catch {
      // Ignore fetch errors
    }
  }, [])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCategories()
  }, [fetchCategories])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])
  const handleRefresh = () => {
    fetchData()
    fetchCategories()
  }
  const loadMore = () => {
    setLimit((l) => l + INITIAL_LIMIT)
  }
  const handleClearLogs = async () => {
    setClearing(true)
    try {
      await logApi.deleteLogs()
      setShowClearConfirm(false)
      setLimit(INITIAL_LIMIT)
      fetchData()
    } catch {
      setErrorMsg(t('common.operationFailed'))
    } finally {
      setClearing(false)
    }
  }
  const handleExportLogs = () => {
    if (!data?.items.length) return
    const exportData = data.items.map((log) => ({
      timestamp: log.timestamp,
      level: log.level,
      category: log.category,
      message: log.message,
      fields: log.fields
    }))
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  const formatTime = (ts) => {
    try {
      return new Date(ts).toLocaleString()
    } catch {
      return ts
    }
  }
  return _jsxs('div', {
    className: 'space-y-4',
    children: [
      errorMsg &&
        _jsxs('div', {
          className:
            'px-4 py-2 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-between',
          children: [
            _jsx('span', { children: errorMsg }),
            _jsx('button', {
              onClick: () => setErrorMsg(''),
              className: 'text-red-500 hover:text-red-700',
              children: '\u00D7'
            })
          ]
        }),
      _jsxs('div', {
        className: 'flex items-center justify-between',
        children: [
          _jsx('h1', { className: 'text-2xl font-bold', children: t('logs.title') }),
          _jsxs('div', {
            className: 'flex items-center gap-3',
            children: [
              _jsx(SearchInput, {
                value: search,
                onChange: setSearch,
                placeholder: t('common.search') + '...',
                inputClassName:
                  'pl-9 pr-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary w-48'
              }),
              _jsxs('select', {
                value: level,
                onChange: (e) => setLevel(e.target.value),
                className:
                  'px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary',
                children: [
                  _jsx('option', { value: '', children: t('logs.level') }),
                  LEVELS.map((l) => _jsx('option', { value: l, children: t(levelLabelKey[l]) }, l))
                ]
              }),
              _jsxs('select', {
                value: category,
                onChange: (e) => setCategory(e.target.value),
                className:
                  'px-3 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary max-w-40',
                children: [
                  _jsx('option', { value: '', children: t('common.type') }),
                  categories.map((c) => _jsx('option', { value: c, children: c }, c))
                ]
              }),
              _jsxs('div', {
                className: 'flex items-center gap-1',
                children: [
                  _jsx(Calendar, { size: 14, className: 'text-gray-400' }),
                  _jsx('input', {
                    type: 'date',
                    value: since,
                    onChange: (e) => setSince(e.target.value),
                    className:
                      'px-2 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary'
                  }),
                  _jsx('span', { className: 'text-gray-400 text-xs', children: '~' }),
                  _jsx('input', {
                    type: 'date',
                    value: until,
                    onChange: (e) => setUntil(e.target.value),
                    className:
                      'px-2 py-1.5 text-sm border border-border-light rounded-lg bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary'
                  })
                ]
              }),
              _jsxs('button', {
                onClick: handleExportLogs,
                disabled: !data?.items.length,
                className:
                  'flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-40',
                children: [_jsx(Download, { size: 16 }), t('logs.exportLogs')]
              }),
              _jsxs('button', {
                onClick: () => setShowClearConfirm(true),
                className:
                  'flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors',
                children: [_jsx(Trash2, { size: 16 }), t('logs.clearLogs')]
              }),
              _jsxs('button', {
                onClick: handleRefresh,
                className:
                  'flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
                children: [
                  _jsx(RefreshCw, { size: 16, className: loading ? 'animate-spin' : '' }),
                  t('common.refresh')
                ]
              })
            ]
          })
        ]
      }),
      loading && !data
        ? _jsx('div', {
            className: 'text-center py-12 text-text-muted',
            children: t('common.loading')
          })
        : !data?.items.length
          ? _jsx('div', {
              className: 'text-center py-12 text-text-muted',
              children: t('logs.noLogs')
            })
          : _jsxs(_Fragment, {
              children: [
                _jsx('div', {
                  className: 'overflow-x-auto border border-border-light  rounded-lg',
                  children: _jsxs('table', {
                    className: 'w-full text-sm',
                    children: [
                      _jsx('thead', {
                        className: 'bg-bg-tertiary',
                        children: _jsxs('tr', {
                          children: [
                            _jsx('th', {
                              className:
                                'px-4 py-2.5 text-left font-medium text-gray-600 dark:text-gray-400 w-44',
                              children: t('logs.timestamp')
                            }),
                            _jsx('th', {
                              className:
                                'px-4 py-2.5 text-left font-medium text-gray-600 dark:text-gray-400 w-20',
                              children: t('logs.level')
                            }),
                            _jsx('th', {
                              className:
                                'px-4 py-2.5 text-left font-medium text-gray-600 dark:text-gray-400 w-32',
                              children: t('common.type')
                            }),
                            _jsx('th', {
                              className:
                                'px-4 py-2.5 text-left font-medium text-gray-600 dark:text-gray-400',
                              children: t('logs.message')
                            })
                          ]
                        })
                      }),
                      _jsx('tbody', {
                        className: 'divide-y divide-gray-200 dark:divide-gray-700',
                        children: data.items.map((log) =>
                          _jsxs(
                            'tr',
                            {
                              className: 'hover:bg-bg-tertiary dark:hover:bg-gray-800/50',
                              children: [
                                _jsx('td', {
                                  className:
                                    'px-4 py-2.5 font-mono text-xs text-text-muted dark:text-gray-400',
                                  children: formatTime(log.timestamp)
                                }),
                                _jsx('td', {
                                  className: 'px-4 py-2.5',
                                  children: _jsx('span', {
                                    className: `px-2 py-0.5 rounded-full text-xs font-medium ${levelColor[log.level] || levelColor.debug}`,
                                    children: t(levelLabelKey[log.level] || log.level)
                                  })
                                }),
                                _jsx('td', {
                                  className: 'px-4 py-2.5 text-xs text-gray-600 dark:text-gray-400',
                                  children: log.category
                                }),
                                _jsx('td', {
                                  className: 'px-4 py-2.5 text-xs font-mono break-all max-w-xl',
                                  children: log.message
                                })
                              ]
                            },
                            log.id
                          )
                        )
                      })
                    ]
                  })
                }),
                data.items.length < data.total &&
                  _jsx('div', {
                    className: 'flex justify-center',
                    children: _jsxs('button', {
                      onClick: loadMore,
                      className:
                        'px-4 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
                      children: [t('logs.loadMore'), ' (', data.items.length, '/', data.total, ')']
                    })
                  })
              ]
            }),
      showClearConfirm &&
        _jsx('div', {
          className: 'fixed inset-0 z-50 flex items-center justify-center bg-black/50',
          onClick: () => setShowClearConfirm(false),
          children: _jsxs('div', {
            className: 'dark:bg-bg-card dark:bg-bg-card rounded-xl shadow-xl w-full max-w-sm p-6',
            onClick: (e) => e.stopPropagation(),
            children: [
              _jsx('h2', {
                className: 'text-lg font-semibold mb-2',
                children: t('logs.clearLogs')
              }),
              _jsx('p', {
                className: 'text-sm text-gray-600 dark:text-gray-400 mb-6',
                children: t('logs.confirmClearLogs')
              }),
              _jsxs('div', {
                className: 'flex justify-end gap-2',
                children: [
                  _jsx('button', {
                    onClick: () => setShowClearConfirm(false),
                    className:
                      'px-4 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800',
                    children: t('common.cancel')
                  }),
                  _jsx('button', {
                    onClick: handleClearLogs,
                    disabled: clearing,
                    className:
                      'px-4 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50',
                    children: clearing ? t('common.loading') : t('common.delete')
                  })
                ]
              })
            ]
          })
        })
    ]
  })
}
export default Logs
