import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime'
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  Wallet,
  User,
  Globe,
  Zap,
  RefreshCw,
  Activity,
  CheckCircle,
  XCircle,
  Plus,
  ArrowRight,
  Clock,
  TrendingUp,
  Layers,
  Target
} from 'lucide-react'
import { appApi, airdropApi } from '../api'
const statusIcons = {
  running: _jsx(Activity, { className: 'w-4 h-4 animate-pulse' }),
  complete: _jsx(CheckCircle, { className: 'w-4 h-4' }),
  error: _jsx(XCircle, { className: 'w-4 h-4' }),
  idle: _jsx(Clock, { className: 'w-4 h-4' }),
  paused: _jsx(Clock, { className: 'w-4 h-4' }),
  stopped: _jsx(XCircle, { className: 'w-4 h-4' })
}
function StatCard({ icon: Icon, label, value, color, trend }) {
  return _jsxs('div', {
    className:
      'bg-bg-card rounded-xl p-6 border border-border-light hover:border-primary/30 transition-all duration-300',
    children: [
      _jsxs('div', {
        className: 'flex items-center justify-between',
        children: [
          _jsx('div', {
            className: `p-3 rounded-lg ${color}`,
            children: _jsx(Icon, { className: 'w-6 h-6' })
          }),
          trend &&
            _jsxs('div', {
              className: `flex items-center gap-1 text-sm ${trend.isUp ? 'text-success' : 'text-danger'}`,
              children: [
                _jsx(TrendingUp, { className: `w-4 h-4 ${trend.isUp ? '' : 'rotate-180'}` }),
                _jsxs('span', { children: [trend.value, '%'] })
              ]
            })
        ]
      }),
      _jsxs('div', {
        className: 'mt-4',
        children: [
          _jsx('p', { className: 'text-text-muted text-sm', children: label }),
          _jsx('p', {
            className: 'text-2xl font-bold mt-1 text-text-primary',
            children: typeof value === 'number' ? value.toLocaleString() : value
          })
        ]
      })
    ]
  })
}
function StatusBadge({ status, label }) {
  const statusClass = `bg-status-${status}-bg text-status-${status}-text border-status-${status}-text/20`
  return _jsxs('span', {
    className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusClass} border`,
    children: [statusIcons[status] || statusIcons.idle, label]
  })
}
function QuickActionButton({ icon: Icon, label, onClick }) {
  return _jsxs('button', {
    onClick: onClick,
    className:
      'flex items-center gap-3 p-4 rounded-xl bg-bg-card border border-border-light hover:border-primary/50 hover:bg-bg-card-hover transition-all duration-200',
    children: [
      _jsx('div', {
        className:
          'p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors',
        children: _jsx(Icon, { className: 'w-5 h-5' })
      }),
      _jsx('span', { className: 'font-medium text-text-primary', children: label })
    ]
  })
}
function AirdropCard({ airdrop }) {
  const statusLabels = {
    ongoing: '进行中',
    completed: '已完成',
    cancelled: '已取消',
    claimed: '已领取'
  }
  const typeLabels = {
    testnet: '测试网',
    mainnet: '主网',
    galxe: 'Galxe',
    quest: '任务',
    social: '社交',
    other: '其他'
  }
  const statusColors = {
    ongoing: 'bg-primary',
    completed: 'bg-success',
    cancelled: 'bg-danger',
    claimed: 'bg-purple-500'
  }
  const typeColors = {
    testnet: 'bg-cyan-500',
    mainnet: 'bg-primary',
    galxe: 'bg-warning',
    quest: 'bg-purple-500',
    social: 'bg-pink-500',
    other: 'bg-bg-tertiary0'
  }
  return _jsxs('div', {
    className:
      'bg-bg-card rounded-xl p-5 border border-border-light hover:border-primary/30 transition-all duration-200',
    children: [
      _jsxs('div', {
        className: 'flex items-start justify-between mb-3',
        children: [
          _jsx('h4', { className: 'font-semibold text-text-primary', children: airdrop.name }),
          _jsx('span', {
            className: `w-2.5 h-2.5 rounded-full ${statusColors[airdrop.status] || 'bg-bg-tertiary0'}`
          })
        ]
      }),
      _jsx('p', {
        className: 'text-sm text-text-secondary mb-4 line-clamp-2',
        children: airdrop.description
      }),
      _jsxs('div', {
        className: 'flex flex-wrap gap-2',
        children: [
          _jsx('span', {
            className: 'px-2 py-1 rounded-md text-xs bg-primary/20 text-primary',
            children: airdrop.chain
          }),
          _jsx('span', {
            className: `px-2 py-1 rounded-md text-xs ${statusColors[airdrop.status] || 'bg-bg-tertiary0'}/20 text-white/80`,
            children: statusLabels[airdrop.status] || airdrop.status
          }),
          _jsx('span', {
            className: `px-2 py-1 rounded-md text-xs ${typeColors[airdrop.projectType] || 'bg-bg-tertiary0'}/20 text-white/80`,
            children: typeLabels[airdrop.projectType] || airdrop.projectType
          })
        ]
      })
    ]
  })
}
export default function Dashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [airdrops, setAirdrops] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const fetchData = useCallback(async () => {
    try {
      setError(null)
      setRefreshing(true)
      const [, statsData, airdropsData] = await Promise.all([
        appApi.getInfo(),
        appApi.getStats(),
        airdropApi.list(1, 4, '')
      ])
      setStats(statsData)
      setAirdrops(airdropsData.items || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.operationFailed'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [t])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])
  if (loading) {
    return _jsx('div', {
      className: 'flex items-center justify-center h-full',
      children: _jsx('div', {
        className: 'w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin'
      })
    })
  }
  if (error) {
    return _jsxs('div', {
      className: 'flex flex-col items-center justify-center h-full gap-4',
      children: [
        _jsx(XCircle, { className: 'w-12 h-12 text-danger' }),
        _jsx('p', { className: 'text-text-secondary', children: error }),
        _jsx('button', {
          onClick: fetchData,
          className:
            'px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors',
          children: t('common.retry')
        })
      ]
    })
  }
  const ongoingAirdrops = airdrops.filter((a) => a.status === 'ongoing')
  return _jsxs('div', {
    className: 'p-6 space-y-6 animate-fade-in',
    children: [
      _jsxs('div', {
        className: 'flex items-center justify-between',
        children: [
          _jsxs('div', {
            children: [
              _jsx('h1', {
                className: 'text-2xl font-bold text-text-primary',
                children: t('dashboard.title')
              }),
              _jsx('p', {
                className: 'text-text-muted mt-1',
                children: t('dashboard.refresh.title')
              })
            ]
          }),
          _jsxs('button', {
            onClick: fetchData,
            disabled: refreshing,
            className:
              'flex items-center gap-2 px-4 py-2 bg-bg-card border border-border-light rounded-lg hover:border-primary/50 transition-all disabled:opacity-50',
            children: [
              _jsx(RefreshCw, { className: `w-4 h-4 ${refreshing ? 'animate-spin' : ''}` }),
              t('common.refresh')
            ]
          })
        ]
      }),
      _jsxs('div', {
        className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
        children: [
          _jsx(StatCard, {
            icon: Wallet,
            label: t('dashboard.stats.wallets'),
            value: stats?.walletTotal || 0,
            color: 'bg-blue-500/10 text-blue-600'
          }),
          _jsx(StatCard, {
            icon: User,
            label: t('dashboard.stats.accounts'),
            value: stats?.accountTotal || 0,
            color: 'bg-purple-500/10 text-purple-600'
          }),
          _jsx(StatCard, {
            icon: Globe,
            label: t('dashboard.stats.proxies'),
            value: stats?.proxyTotal || 0,
            color: 'bg-cyan-500/10 text-cyan-600'
          }),
          _jsx(StatCard, {
            icon: Zap,
            label: t('dashboard.stats.tasks'),
            value: stats?.taskTotal || 0,
            color: 'bg-amber-500/10 text-amber-600'
          })
        ]
      }),
      _jsxs('div', {
        className: 'grid grid-cols-1 lg:grid-cols-3 gap-6',
        children: [
          _jsxs('div', {
            className: 'lg:col-span-2 bg-bg-card rounded-xl p-6 border border-border-light',
            children: [
              _jsxs('h2', {
                className: 'text-lg font-semibold mb-4 flex items-center gap-2 text-text-primary',
                children: [
                  _jsx(Layers, { className: 'w-5 h-5 text-primary' }),
                  t('dashboard.taskStatusDistribution')
                ]
              }),
              stats?.taskStatusDistribution
                ? _jsx('div', {
                    className: 'space-y-3',
                    children: Object.entries(stats.taskStatusDistribution).map(([status, count]) =>
                      _jsxs(
                        'div',
                        {
                          className: 'flex items-center gap-3',
                          children: [
                            _jsx(StatusBadge, {
                              status: status,
                              label: t(`dashboard.status.${status}`) || status
                            }),
                            _jsx('div', {
                              className: 'flex-1 h-2 bg-bg-tertiary rounded-full overflow-hidden',
                              children: _jsx('div', {
                                className: `h-full bg-status-${status}-bg`,
                                style: { width: `${(count / (stats.taskTotal || 1)) * 100}%` }
                              })
                            }),
                            _jsx('span', {
                              className: 'text-sm text-text-secondary w-12 text-right',
                              children: count
                            })
                          ]
                        },
                        status
                      )
                    )
                  })
                : _jsx('p', {
                    className: 'text-text-muted text-center py-8',
                    children: t('common.noData')
                  })
            ]
          }),
          _jsxs('div', {
            className: 'bg-bg-card rounded-xl p-6 border border-border-light',
            children: [
              _jsxs('h2', {
                className: 'text-lg font-semibold mb-4 flex items-center gap-2 text-text-primary',
                children: [
                  _jsx(Target, { className: 'w-5 h-5 text-primary' }),
                  t('dashboard.quickActions')
                ]
              }),
              _jsxs('div', {
                className: 'space-y-3',
                children: [
                  _jsx(QuickActionButton, {
                    icon: Wallet,
                    label: t('dashboard.createWallet'),
                    onClick: () => navigate('/wallets')
                  }),
                  _jsx(QuickActionButton, {
                    icon: Zap,
                    label: t('dashboard.createTask'),
                    onClick: () => navigate('/tasks')
                  }),
                  _jsx(QuickActionButton, {
                    icon: Globe,
                    label: t('dashboard.addProxy'),
                    onClick: () => navigate('/proxies')
                  }),
                  _jsx(QuickActionButton, {
                    icon: Plus,
                    label: t('dashboard.addAirdrop'),
                    onClick: () => navigate('/airdrops')
                  })
                ]
              })
            ]
          })
        ]
      }),
      _jsxs('div', {
        children: [
          _jsxs('div', {
            className: 'flex items-center justify-between mb-4',
            children: [
              _jsxs('h2', {
                className: 'text-lg font-semibold flex items-center gap-2 text-text-primary',
                children: [
                  _jsx(Activity, { className: 'w-5 h-5 text-primary' }),
                  t('dashboard.airdropOverview')
                ]
              }),
              _jsxs('button', {
                onClick: () => navigate('/airdrops'),
                className:
                  'flex items-center gap-1 text-sm text-primary hover:text-primary-hover transition-colors',
                children: [t('common.viewAll'), _jsx(ArrowRight, { className: 'w-4 h-4' })]
              })
            ]
          }),
          ongoingAirdrops.length > 0
            ? _jsx('div', {
                className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
                children: ongoingAirdrops.map((airdrop) =>
                  _jsx(AirdropCard, { airdrop: airdrop }, airdrop.id)
                )
              })
            : _jsxs('div', {
                className: 'bg-bg-card rounded-xl p-12 border border-border-light text-center',
                children: [
                  _jsx(Clock, { className: 'w-12 h-12 text-text-muted mx-auto mb-4' }),
                  _jsx('p', {
                    className: 'text-text-muted',
                    children: t('dashboard.noRecentActivity')
                  })
                ]
              })
        ]
      }),
      stats?.recentTaskResults &&
        stats.recentTaskResults.length > 0 &&
        _jsxs('div', {
          className: 'bg-bg-card rounded-xl p-6 border border-border-light',
          children: [
            _jsx('h2', {
              className: 'text-lg font-semibold mb-4 text-text-primary',
              children: t('dashboard.recentActivity')
            }),
            _jsx('div', {
              className: 'overflow-x-auto',
              children: _jsxs('table', {
                className: 'w-full',
                children: [
                  _jsx('thead', {
                    children: _jsxs('tr', {
                      className: 'border-b border-border-light',
                      children: [
                        _jsx('th', {
                          className: 'text-left py-3 px-4 text-sm font-medium text-text-muted',
                          children: t('tasks.scriptFolder')
                        }),
                        _jsx('th', {
                          className: 'text-left py-3 px-4 text-sm font-medium text-text-muted',
                          children: t('common.status')
                        }),
                        _jsx('th', {
                          className: 'text-left py-3 px-4 text-sm font-medium text-text-muted',
                          children: t('tasks.startTime')
                        }),
                        _jsx('th', {
                          className: 'text-left py-3 px-4 text-sm font-medium text-text-muted',
                          children: t('tasks.endTime')
                        }),
                        _jsx('th', {
                          className: 'text-left py-3 px-4 text-sm font-medium text-text-muted',
                          children: t('common.duration')
                        })
                      ]
                    })
                  }),
                  _jsx('tbody', {
                    children: stats.recentTaskResults.map((task, index) =>
                      _jsxs(
                        'tr',
                        {
                          className:
                            'border-b border-border-light/50 hover:bg-bg-card-hover transition-colors',
                          children: [
                            _jsx('td', {
                              className: 'py-3 px-4 text-sm text-text-primary max-w-xs truncate',
                              children: task.scriptFolder
                            }),
                            _jsx('td', {
                              className: 'py-3 px-4',
                              children: _jsx(StatusBadge, {
                                status: task.status,
                                label: t(`dashboard.status.${task.status}`) || task.status
                              })
                            }),
                            _jsx('td', {
                              className: 'py-3 px-4 text-sm text-text-secondary',
                              children: task.startedAt
                                ? new Date(task.startedAt).toLocaleString('zh-CN')
                                : '-'
                            }),
                            _jsx('td', {
                              className: 'py-3 px-4 text-sm text-text-secondary',
                              children: task.endedAt
                                ? new Date(task.endedAt).toLocaleString('zh-CN')
                                : '-'
                            }),
                            _jsx('td', {
                              className: 'py-3 px-4 text-sm text-text-secondary',
                              children: task.durationSecs != null ? `${task.durationSecs}s` : '-'
                            })
                          ]
                        },
                        index
                      )
                    )
                  })
                ]
              })
            })
          ]
        })
    ]
  })
}
