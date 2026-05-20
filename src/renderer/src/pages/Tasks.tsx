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
import type { Task, TaskLog } from '../types'
import { usePaginatedList, useTemplateList } from '../hooks'
import { SearchInput, Pagination, Modal } from '../components/common'

const PAGE_SIZE = 20

const LOG_LEVEL_STYLES: Record<TaskLog['level'], string> = {
  info: 'text-success',
  warn: 'text-warning',
  error: 'text-danger',
  debug: 'text-text-muted'
}

const Tasks: React.FC = () => {
  const { t } = useTranslation()
  const { items, totalPages, page, loading, setPage, setSearch, search, refresh } =
    usePaginatedList(taskApi.list, PAGE_SIZE)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [logs, setLogs] = useState<TaskLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newScriptFolder, setNewScriptFolder] = useState('')
  const [newConfig, setNewConfig] = useState('{}')
  const [creating, setCreating] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [editScriptFolder, setEditScriptFolder] = useState('')
  const [editConfig, setEditConfig] = useState('{}')
  const [editing, setEditing] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [progressMap, setProgressMap] = useState<
    Record<string, { percent: number; message: string } | null>
  >({})
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
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
            return [task.id, p] as const
          } catch {
            return [task.id, null] as const
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

  const showError = (msg: string) => setErrorMsg(msg)

  const handleAction = async (
    action: 'start' | 'stop' | 'pause' | 'resume' | 'delete',
    id: string
  ) => {
    try {
      await taskApi[action](id)
      refresh()
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : String(e))
    }
  }

  const handleToggleExpand = async (taskId: string) => {
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

  const handleClearLogs = async (taskId: string) => {
    try {
      await taskApi.clearLogs(taskId)
      setLogs([])
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : String(e))
    }
  }

  const handleTemplateSelect = (templateId: string) => {
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
    let config: Record<string, unknown>
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
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : String(e))
    } finally {
      setCreating(false)
    }
  }

  const handleOpenEdit = (task: Task) => {
    setEditTask(task)
    setEditScriptFolder(task.scriptFolder)
    setEditConfig(JSON.stringify(task.config, null, 2))
    setShowEdit(true)
  }

  const handleEdit = async () => {
    if (!editTask) return
    let config: Record<string, unknown>
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
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : String(e))
    } finally {
      setEditing(false)
    }
  }

  const toggleSelect = (id: string) => {
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

  const handleBatchAction = async (action: 'start' | 'stop' | 'delete') => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    try {
      await Promise.all(ids.map((id) => taskApi[action](id)))
      setSelectedIds(new Set())
      refresh()
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : String(e))
    }
  }

  const formatTime = (v: string | null) => {
    if (!v) return '-'
    return new Date(v).toLocaleString()
  }

  const renderActionButtons = (task: Task) => {
    const btnBase = 'p-1.5 rounded-lg transition-colors '
    const s = task.status

    if (s === 'running') {
      return (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAction('pause', task.id)
            }}
            className={btnBase + 'text-warning hover:bg-warning-light'}
            title={t('tasks.pause')}
          >
            <Pause size={15} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAction('stop', task.id)
            }}
            className={btnBase + 'text-orange hover:bg-orange-light'}
            title={t('tasks.stop')}
          >
            <Square size={15} />
          </button>
        </>
      )
    }

    if (s === 'paused') {
      return (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAction('resume', task.id)
            }}
            className={btnBase + 'text-success hover:bg-success-light'}
            title={t('tasks.resume')}
          >
            <Play size={15} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAction('stop', task.id)
            }}
            className={btnBase + 'text-orange hover:bg-orange-light'}
            title={t('tasks.stop')}
          >
            <Square size={15} />
          </button>
        </>
      )
    }

    return (
      <>
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleAction('start', task.id)
          }}
          className={btnBase + 'text-primary hover:bg-primary-light'}
          title={t('tasks.start')}
        >
          <Play size={15} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleOpenEdit(task)
          }}
          className={btnBase + 'text-text-secondary hover:bg-bg-tertiary'}
          title={t('tasks.editTask')}
        >
          <Edit3 size={15} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleAction('delete', task.id)
          }}
          className={btnBase + 'text-danger hover:bg-danger-light'}
          title={t('common.delete')}
        >
          <Trash2 size={15} />
        </button>
      </>
    )
  }

  const allSelected = items.length > 0 && selectedIds.size === items.length

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-danger-light text-danger border border-danger/20">
          <span className="flex-1 text-sm">{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-danger/70 hover:text-danger">
            &times;
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">{t('tasks.title')}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-light text-sm hover:bg-bg-card-hover transition-colors"
          >
            <RefreshCw size={14} />
            {t('common.refresh')}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            <Plus size={16} />
            {t('tasks.createTask')}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t('tasks.searchPlaceholder')}
          className="flex-1 max-w-sm"
          inputClassName="w-full pl-9 pr-3 py-2 rounded-lg border border-border-light bg-bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-muted">
              {t('tasks.selectedCount', { count: selectedIds.size })}
            </span>
            <button
              onClick={() => handleBatchAction('start')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
            >
              <Play size={13} />
              {t('tasks.batchStart')}
            </button>
            <button
              onClick={() => handleBatchAction('stop')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-light text-orange text-xs font-medium hover:bg-orange/20 transition-colors"
            >
              <Square size={13} />
              {t('tasks.batchStop')}
            </button>
            <button
              onClick={() => handleBatchAction('delete')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-danger-light text-danger text-xs font-medium hover:bg-danger/20 transition-colors"
            >
              <Trash size={13} />
              {t('tasks.batchDelete')}
            </button>
          </div>
        )}
      </div>

      {loading && items.length === 0 ? (
        <div className="text-center py-12 text-text-muted">{t('common.loading')}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-text-muted">{t('tasks.noTasks')}</div>
      ) : (
        <div className="rounded-xl border border-border-light overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg-tertiary">
                <th className="px-4 py-3 w-10">
                  <button
                    onClick={toggleSelectAll}
                    className="text-text-muted hover:text-text-primary transition-colors"
                  >
                    {allSelected ? <CheckSquareIcon size={16} /> : <SquareIcon size={16} />}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium text-text-muted">{t('tasks.scriptFolder')}</th>
                <th className="px-4 py-3 font-medium text-text-muted">{t('common.status')}</th>
                <th className="px-4 py-3 font-medium text-text-muted">{t('tasks.startTime')}</th>
                <th className="px-4 py-3 font-medium text-text-muted">{t('tasks.endTime')}</th>
                <th className="px-4 py-3 font-medium text-text-muted text-right">
                  {t('tasks.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((task) => (
                <tr key={task.id} className="border-b border-border-light/50">
                  <td colSpan={6} className="p-0">
                    <div
                      onClick={() => handleToggleExpand(task.id)}
                      className="flex items-center cursor-pointer hover:bg-bg-card-hover transition-colors"
                    >
                      <div className="px-4 py-3 w-10" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleSelect(task.id)}
                          className="text-text-muted hover:text-text-primary transition-colors"
                        >
                          {selectedIds.has(task.id) ? (
                            <CheckSquareIcon size={16} className="text-primary" />
                          ) : (
                            <SquareIcon size={16} />
                          )}
                        </button>
                      </div>
                      <div className="flex-1 grid grid-cols-[1fr_100px_160px_160px] items-center">
                        <div className="px-4 py-3 font-mono text-xs truncate text-text-primary">
                          {task.scriptFolder}
                        </div>
                        <div className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-status-${task.status}-bg text-status-${task.status}-text`}
                          >
                            {task.status === 'running' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            )}
                            {t(`tasks.status.${task.status}`)}
                          </span>
                        </div>
                        <div className="px-4 py-3 text-text-secondary text-xs">
                          {formatTime(task.startedAt)}
                        </div>
                        <div className="px-4 py-3 text-text-secondary text-xs">
                          {formatTime(task.endedAt)}
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-1 px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {renderActionButtons(task)}
                      </div>
                    </div>
                    {task.status === 'running' && progressMap[task.id] && (
                      <div className="px-4 py-2 border-t border-border-light/50 bg-bg-tertiary/50">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-text-muted shrink-0">
                            {t('tasks.progress')}
                          </span>
                          <div className="flex-1 h-2 bg-bg-card rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, Math.max(0, progressMap[task.id]!.percent))}%`
                              }}
                            />
                          </div>
                          <span className="text-xs font-mono text-text-muted shrink-0">
                            {progressMap[task.id]!.percent}%
                          </span>
                          {progressMap[task.id]!.message && (
                            <span className="text-xs text-text-muted truncate max-w-[200px]">
                              {progressMap[task.id]!.message}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {expandedId === task.id && (
                      <div className="border-t border-border-light bg-bg-tertiary/30">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-border-light">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-text-muted" />
                            <span className="text-xs font-medium text-text-muted">
                              {t('tasks.logs')}
                            </span>
                          </div>
                          <button
                            onClick={() => handleClearLogs(task.id)}
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-danger hover:bg-danger-light transition-colors"
                          >
                            <Trash2 size={12} />
                            {t('tasks.clearLogs')}
                          </button>
                        </div>
                        <div className="max-h-64 overflow-y-auto px-4 py-2">
                          {logsLoading ? (
                            <div className="text-xs text-text-muted py-2">
                              {t('common.loading')}
                            </div>
                          ) : logs.length === 0 ? (
                            <div className="text-xs text-text-muted py-2">{t('tasks.noLogs')}</div>
                          ) : (
                            <div className="space-y-0.5 font-mono text-xs">
                              {logs.map((log) => (
                                <div key={log.id} className="flex gap-3">
                                  <span className="text-text-muted shrink-0">
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                  </span>
                                  <span className={`shrink-0 w-10 ${LOG_LEVEL_STYLES[log.level]}`}>
                                    [{log.level.toUpperCase()}]
                                  </span>
                                  <span className="text-text-secondary break-all">
                                    {log.message}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          pageText={`${page} / ${totalPages}`}
        />
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={t('tasks.createTask')}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('tasks.selectTemplate', '从模板创建')}
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateSelect(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border-light bg-bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{t('tasks.noTemplate', '不使用模板')}</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.type})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('tasks.scriptFolder')}</label>
            <input
              type="text"
              value={newScriptFolder}
              onChange={(e) => setNewScriptFolder(e.target.value)}
              placeholder="/path/to/script"
              className="w-full px-3 py-2 rounded-lg border border-border-light bg-bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('tasks.config')} (JSON)</label>
            <textarea
              value={newConfig}
              onChange={(e) => setNewConfig(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 rounded-lg border border-border-light bg-bg-card text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary resize-y"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={() => setShowCreate(false)}
            className="px-4 py-2 rounded-lg border border-border-light text-sm hover:bg-bg-card-hover transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !newScriptFolder.trim()}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            {creating ? t('common.loading') : t('common.create')}
          </button>
        </div>
      </Modal>

      <Modal
        open={showEdit && !!editTask}
        onClose={() => setShowEdit(false)}
        title={t('tasks.editTask')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('tasks.scriptFolder')}</label>
            <input
              type="text"
              value={editScriptFolder}
              onChange={(e) => setEditScriptFolder(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border-light bg-bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('tasks.config')} (JSON)</label>
            <textarea
              value={editConfig}
              onChange={(e) => setEditConfig(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 rounded-lg border border-border-light bg-bg-card text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary resize-y"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={() => setShowEdit(false)}
            className="px-4 py-2 rounded-lg border border-border-light text-sm hover:bg-bg-card-hover transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleEdit}
            disabled={editing || !editScriptFolder.trim()}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            {editing ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default Tasks
