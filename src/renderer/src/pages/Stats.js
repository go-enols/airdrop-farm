import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from 'react/jsx-runtime'
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { appApi } from '../api'
import { RefreshCw, BarChart3 } from 'lucide-react'
const Stats = () => {
  const { t } = useTranslation()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await appApi.getStats()
      setStats(res)
    } catch {
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])
  const formatRate = (rate) => {
    if (rate === null) return '—'
    return `${(rate * 100).toFixed(1)}%`
  }
  const distributionEntries = (dist) => {
    return Object.entries(dist || {}).sort((a, b) => b[1] - a[1])
  }
  return _jsxs('div', {
    className: 'space-y-6',
    children: [
      _jsxs('div', {
        className: 'flex items-center justify-between',
        children: [
          _jsx('h1', { className: 'text-2xl font-bold', children: t('stats.title') }),
          _jsxs('button', {
            onClick: fetchData,
            disabled: loading,
            className:
              'flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-text-secondary bg-bg-card border border-border-light rounded-lg hover:bg-bg-card-hover disabled:opacity-50 transition-colors',
            children: [
              _jsx(RefreshCw, { size: 16, className: loading ? 'animate-spin' : '' }),
              t('common.refresh')
            ]
          })
        ]
      }),
      loading && !stats
        ? _jsx('div', {
            className: 'flex items-center justify-center py-20 text-text-muted',
            children: _jsx('span', { children: t('common.loading') })
          })
        : !stats
          ? _jsxs('div', {
              className: 'flex flex-col items-center justify-center py-20 text-text-muted',
              children: [
                _jsx(BarChart3, { size: 48 }),
                _jsx('p', { className: 'mt-4 text-lg', children: t('common.noData') })
              ]
            })
          : _jsxs(_Fragment, {
              children: [
                _jsxs('div', {
                  className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
                  children: [
                    _jsxs('div', {
                      className: 'bg-bg-card rounded-xl border border-border-light p-5',
                      children: [
                        _jsx('div', {
                          className: 'text-sm text-text-muted mb-1',
                          children: t('stats.walletTotal')
                        }),
                        _jsx('div', {
                          className: 'text-3xl font-bold mb-2',
                          children: stats.walletTotal
                        }),
                        distributionEntries(stats.walletChainDistribution).length > 0 &&
                          _jsx('div', {
                            className: 'space-y-1',
                            children: distributionEntries(stats.walletChainDistribution).map(
                              ([chain, count]) =>
                                _jsxs(
                                  'div',
                                  {
                                    className: 'flex items-center justify-between text-xs',
                                    children: [
                                      _jsx('span', {
                                        className: 'text-text-muted',
                                        children: chain
                                      }),
                                      _jsx('span', {
                                        className: 'font-medium text-text-primary',
                                        children: count
                                      })
                                    ]
                                  },
                                  chain
                                )
                            )
                          })
                      ]
                    }),
                    _jsxs('div', {
                      className: 'bg-bg-card rounded-xl border border-border-light p-5',
                      children: [
                        _jsx('div', {
                          className: 'text-sm text-text-muted mb-1',
                          children: t('stats.proxyTotal')
                        }),
                        _jsx('div', {
                          className: 'text-3xl font-bold mb-2',
                          children: stats.proxyTotal
                        }),
                        distributionEntries(stats.proxyProtocolDistribution).length > 0 &&
                          _jsx('div', {
                            className: 'space-y-1',
                            children: distributionEntries(stats.proxyProtocolDistribution).map(
                              ([proto, count]) =>
                                _jsxs(
                                  'div',
                                  {
                                    className: 'flex items-center justify-between text-xs',
                                    children: [
                                      _jsx('span', {
                                        className: 'text-text-muted',
                                        children: proto.toUpperCase()
                                      }),
                                      _jsx('span', {
                                        className: 'font-medium text-text-primary',
                                        children: count
                                      })
                                    ]
                                  },
                                  proto
                                )
                            )
                          })
                      ]
                    }),
                    _jsxs('div', {
                      className: 'bg-bg-card rounded-xl border border-border-light p-5',
                      children: [
                        _jsx('div', {
                          className: 'text-sm text-text-muted mb-1',
                          children: t('stats.taskTotal')
                        }),
                        _jsx('div', {
                          className: 'text-3xl font-bold mb-2',
                          children: stats.taskTotal
                        }),
                        distributionEntries(stats.taskStatusDistribution).length > 0 &&
                          _jsx('div', {
                            className: 'space-y-1',
                            children: distributionEntries(stats.taskStatusDistribution).map(
                              ([status, count]) =>
                                _jsxs(
                                  'div',
                                  {
                                    className: 'flex items-center justify-between text-xs',
                                    children: [
                                      _jsx('span', {
                                        className: 'text-text-muted',
                                        children: status
                                      }),
                                      _jsx('span', {
                                        className: 'font-medium text-text-primary',
                                        children: count
                                      })
                                    ]
                                  },
                                  status
                                )
                            )
                          })
                      ]
                    }),
                    _jsxs('div', {
                      className: 'bg-bg-card rounded-xl border border-border-light p-5',
                      children: [
                        _jsx('div', {
                          className: 'text-sm text-text-muted mb-1',
                          children: t('stats.successRate')
                        }),
                        _jsx('div', {
                          className: 'text-3xl font-bold mb-2',
                          children: formatRate(stats.taskSuccessRate)
                        }),
                        _jsxs('div', {
                          className: 'space-y-1',
                          children: [
                            _jsxs('div', {
                              className: 'flex items-center justify-between text-xs',
                              children: [
                                _jsx('span', {
                                  className: 'text-text-muted',
                                  children: 'completed'
                                }),
                                _jsx('span', {
                                  className: 'font-medium text-success',
                                  children: stats.taskCompletedCount
                                })
                              ]
                            }),
                            _jsxs('div', {
                              className: 'flex items-center justify-between text-xs',
                              children: [
                                _jsx('span', { className: 'text-text-muted', children: 'error' }),
                                _jsx('span', {
                                  className: 'font-medium text-danger',
                                  children: stats.taskErrorCount
                                })
                              ]
                            })
                          ]
                        })
                      ]
                    })
                  ]
                }),
                Object.keys(stats.taskDurationDistribution || {}).length > 0 &&
                  _jsxs('div', {
                    className: 'bg-bg-card rounded-xl border border-border-light p-5',
                    children: [
                      _jsx('h2', {
                        className: 'text-base font-semibold mb-4',
                        children: t('stats.taskDuration')
                      }),
                      _jsx('div', {
                        className: 'space-y-2',
                        children: Object.entries(stats.taskDurationDistribution || {})
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([range, count]) => {
                            const maxCount = Math.max(
                              ...Object.values(stats.taskDurationDistribution || {})
                            )
                            const widthPercent = maxCount > 0 ? (count / maxCount) * 100 : 0
                            return _jsxs(
                              'div',
                              {
                                className: 'flex items-center gap-3',
                                children: [
                                  _jsx('span', {
                                    className: 'text-sm text-text-secondary w-32 shrink-0',
                                    children: range
                                  }),
                                  _jsx('div', {
                                    className: 'flex-1 h-6 bg-bg-tertiary rounded overflow-hidden',
                                    children: _jsx('div', {
                                      className: 'h-full bg-primary rounded transition-all',
                                      style: { width: `${widthPercent}%` }
                                    })
                                  }),
                                  _jsx('span', {
                                    className:
                                      'text-sm font-medium text-text-primary w-12 text-right',
                                    children: count
                                  })
                                ]
                              },
                              range
                            )
                          })
                      })
                    ]
                  }),
                (stats.templateUsage || []).length > 0 &&
                  _jsxs('div', {
                    className: 'bg-bg-card rounded-xl border border-border-light p-5',
                    children: [
                      _jsx('h2', {
                        className: 'text-base font-semibold mb-4',
                        children: t('stats.templateUsage')
                      }),
                      _jsxs('table', {
                        className: 'w-full text-sm',
                        children: [
                          _jsx('thead', {
                            children: _jsxs('tr', {
                              className: 'border-b border-border-light',
                              children: [
                                _jsx('th', {
                                  className: 'text-left px-4 py-2 font-medium text-text-secondary',
                                  children: t('stats.templateName')
                                }),
                                _jsx('th', {
                                  className: 'text-right px-4 py-2 font-medium text-text-secondary',
                                  children: t('stats.taskCount')
                                })
                              ]
                            })
                          }),
                          _jsx('tbody', {
                            children: (stats.templateUsage || []).map((item, i) =>
                              _jsxs(
                                'tr',
                                {
                                  className:
                                    'border-b border-border-light/50 hover:bg-bg-card-hover transition-colors',
                                  children: [
                                    _jsx('td', {
                                      className: 'px-4 py-2',
                                      children: item.templateName
                                    }),
                                    _jsx('td', {
                                      className: 'px-4 py-2 text-right font-medium',
                                      children: item.taskCount
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
                  }),
                (stats.templateRanking || []).length > 0 &&
                  _jsxs('div', {
                    className: 'bg-bg-card rounded-xl border border-border-light p-5',
                    children: [
                      _jsx('h2', {
                        className: 'text-base font-semibold mb-4',
                        children: t('stats.templateRanking')
                      }),
                      _jsxs('table', {
                        className: 'w-full text-sm',
                        children: [
                          _jsx('thead', {
                            children: _jsxs('tr', {
                              className: 'border-b border-border-light',
                              children: [
                                _jsx('th', {
                                  className: 'text-left px-4 py-2 font-medium text-text-secondary',
                                  children: t('stats.templateName')
                                }),
                                _jsx('th', {
                                  className: 'text-right px-4 py-2 font-medium text-text-secondary',
                                  children: t('stats.successCount')
                                }),
                                _jsx('th', {
                                  className: 'text-right px-4 py-2 font-medium text-text-secondary',
                                  children: t('stats.errorCount')
                                }),
                                _jsx('th', {
                                  className: 'text-right px-4 py-2 font-medium text-text-secondary',
                                  children: t('stats.successRate')
                                })
                              ]
                            })
                          }),
                          _jsx('tbody', {
                            children: (stats.templateRanking || []).map((item, i) =>
                              _jsxs(
                                'tr',
                                {
                                  className:
                                    'border-b border-border-light/50 hover:bg-bg-card-hover transition-colors',
                                  children: [
                                    _jsx('td', {
                                      className: 'px-4 py-2',
                                      children: item.templateName
                                    }),
                                    _jsx('td', {
                                      className: 'px-4 py-2 text-right text-success font-medium',
                                      children: item.successCount
                                    }),
                                    _jsx('td', {
                                      className: 'px-4 py-2 text-right text-danger font-medium',
                                      children: item.errorCount
                                    }),
                                    _jsx('td', {
                                      className: 'px-4 py-2 text-right font-medium',
                                      children: formatRate(item.successRate)
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
            })
    ]
  })
}
export default Stats
