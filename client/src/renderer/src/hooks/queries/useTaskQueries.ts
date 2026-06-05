/**
 * @file 任务数据查询 Hook
 * @description 封装任务 CRUD、生命周期控制（启动/停止/暂停/恢复）及日志查询。
 *              失败时通过 sonner toast 显示错误提示。
 * @module renderer/hooks/queries
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { taskApi } from '../../api'
import type { Task, TaskLog, ListResponse } from '../../types'

/** 任务查询键工厂 */
export const taskKeys = {
  /** 所有任务根键 */
  all: ['tasks'] as const,
  /** 分页列表查询键 */
  list: (page: number, pageSize: number, search: string) =>
    [...taskKeys.all, 'list', page, pageSize, search] as const,
  /** 单个任务详情查询键 */
  detail: (id: string) => [...taskKeys.all, 'detail', id] as const,
  /** 任务日志查询键 */
  logs: (taskId: string, limit: number) => [...taskKeys.all, 'logs', taskId, limit] as const
}

/**
 * 获取任务分页列表
 * @param page - 页码（默认 1）
 * @param pageSize - 每页条数（默认 20）
 * @param search - 搜索关键字
 */
export function useTaskList(page = 1, pageSize = 20, search = '') {
  return useQuery<ListResponse<Task>>({
    queryKey: taskKeys.list(page, pageSize, search),
    queryFn: () => taskApi.list(page, pageSize, search)
  })
}

/**
 * 获取单个任务详情
 * @param id - 任务 ID，为 null 时禁用查询
 */
export function useTask(id: string | null) {
  return useQuery<Task | null>({
    queryKey: taskKeys.detail(id!),
    queryFn: () => taskApi.get(id!),
    enabled: !!id
  })
}

/**
 * 获取任务日志
 * @param taskId - 任务 ID，为 null 时禁用查询
 * @param limit - 返回的最大日志条数（默认 100）
 */
export function useTaskLogs(taskId: string | null, limit = 100) {
  return useQuery<TaskLog[]>({
    queryKey: taskKeys.logs(taskId!, limit),
    queryFn: () => taskApi.getLogs(taskId!, limit),
    enabled: !!taskId
  })
}

/** 创建任务 mutation */
export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { scriptFolder: string; config: Record<string, unknown> }) =>
      taskApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
    onError: (err: Error) => {
      toast.error(err.message || 'Operation failed')
    }
  })
}

/** 更新任务 mutation */
export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) => taskApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
    onError: (err: Error) => {
      toast.error(err.message || 'Operation failed')
    }
  })
}

/** 启动任务 mutation */
export function useStartTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => taskApi.start(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
    onError: (err: Error) => {
      toast.error(err.message || 'Operation failed')
    }
  })
}

/** 停止任务 mutation */
export function useStopTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => taskApi.stop(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
    onError: (err: Error) => {
      toast.error(err.message || 'Operation failed')
    }
  })
}

/** 暂停任务 mutation */
export function usePauseTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => taskApi.pause(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
    onError: (err: Error) => {
      toast.error(err.message || 'Operation failed')
    }
  })
}

/** 恢复已暂停任务 mutation */
export function useResumeTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => taskApi.resume(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
    onError: (err: Error) => {
      toast.error(err.message || 'Operation failed')
    }
  })
}

/** 删除任务 mutation */
export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => taskApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
    onError: (err: Error) => {
      toast.error(err.message || 'Operation failed')
    }
  })
}
