/**
 * @file 设置/调度/应用信息数据查询 Hook
 * @description 封装系统设置、定时任务调度、验证码密钥、代理提供商和应用信息等
 *              各类配置数据的查询与变更操作。
 * @module renderer/hooks/queries
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingApi, schedulerApi, captchaKeyApi, proxyProviderApi, appApi } from '../../api'
import type {
  ScheduledTask,
  CaptchaKey,
  ProxyProvider,
  StatsAggregate,
  ListResponse
} from '../../types'

/** 系统设置查询键工厂 */
export const settingKeys = {
  /** 所有设置根键 */
  all: ['settings'] as const,
  /** 单个设置项查询键 */
  key: (key: string) => [...settingKeys.all, key] as const
}

/** 定时任务查询键工厂 */
export const schedulerKeys = {
  /** 所有定时任务根键 */
  all: ['scheduledTasks'] as const,
  /** 分页列表查询键 */
  list: (page: number, pageSize: number, search: string) =>
    [...schedulerKeys.all, 'list', page, pageSize, search] as const,
  /** 单个定时任务详情查询键 */
  detail: (id: string) => [...schedulerKeys.all, 'detail', id] as const
}

/** 验证码密钥查询键工厂 */
export const captchaKeyKeys = {
  /** 所有验证码密钥根键 */
  all: ['captchaKeys'] as const,
  /** 分页列表查询键 */
  list: (page: number, pageSize: number, search: string) =>
    [...captchaKeyKeys.all, 'list', page, pageSize, search] as const
}

/** 代理提供商查询键工厂 */
export const proxyProviderKeys = {
  /** 所有代理提供商根键 */
  all: ['proxyProviders'] as const,
  /** 分页列表查询键 */
  list: (page: number, pageSize: number, search: string) =>
    [...proxyProviderKeys.all, 'list', page, pageSize, search] as const
}

/** 应用信息查询键工厂 */
export const appKeys = {
  /** 应用信息查询键 */
  info: ['appInfo'] as const,
  /** 统计数据查询键 */
  stats: ['appStats'] as const
}

/**
 * 获取单个设置项的值
 * @param key - 设置键名，为 null 时禁用查询
 */
export function useSetting(key: string | null) {
  return useQuery<string | null>({
    queryKey: settingKeys.key(key!),
    queryFn: () => settingApi.get(key!),
    enabled: !!key
  })
}

/** 获取所有设置项 */
export function useAllSettings() {
  return useQuery<Record<string, string>>({
    queryKey: settingKeys.all,
    queryFn: () => settingApi.getAll()
  })
}

/** 设置单个设置项 mutation */
export function useSetSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => settingApi.set(key, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingKeys.all })
  })
}

/**
 * 获取定时任务分页列表
 * @param page - 页码（默认 1）
 * @param pageSize - 每页条数（默认 20）
 * @param search - 搜索关键字
 */
export function useSchedulerList(page = 1, pageSize = 20, search = '') {
  return useQuery<ListResponse<ScheduledTask>>({
    queryKey: schedulerKeys.list(page, pageSize, search),
    queryFn: () => schedulerApi.list()
  })
}

/** 创建定时任务 mutation */
export function useCreateScheduler() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<ScheduledTask, 'id' | 'createdAt'>) => schedulerApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: schedulerKeys.all })
  })
}

/** 更新定时任务 mutation */
export function useUpdateScheduler() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ScheduledTask> }) =>
      schedulerApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: schedulerKeys.all })
  })
}

/** 删除定时任务 mutation */
export function useDeleteScheduler() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => schedulerApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: schedulerKeys.all })
  })
}

/**
 * 获取验证码密钥分页列表
 * @param page - 页码（默认 1）
 * @param pageSize - 每页条数（默认 20）
 * @param search - 搜索关键字
 */
export function useCaptchaKeyList(page = 1, pageSize = 20, search = '') {
  return useQuery<ListResponse<CaptchaKey>>({
    queryKey: captchaKeyKeys.list(page, pageSize, search),
    queryFn: () => captchaKeyApi.list()
  })
}

/** 创建验证码密钥 mutation */
export function useCreateCaptchaKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<CaptchaKey, 'id' | 'createdAt'>) => captchaKeyApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: captchaKeyKeys.all })
  })
}

/** 删除验证码密钥 mutation */
export function useDeleteCaptchaKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => captchaKeyApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: captchaKeyKeys.all })
  })
}

/**
 * 获取代理提供商分页列表
 * @param page - 页码（默认 1）
 * @param pageSize - 每页条数（默认 20）
 * @param search - 搜索关键字
 */
export function useProxyProviderList(page = 1, pageSize = 20, search = '') {
  return useQuery<ListResponse<ProxyProvider>>({
    queryKey: proxyProviderKeys.list(page, pageSize, search),
    queryFn: () => proxyProviderApi.list()
  })
}

/** 创建代理提供商 mutation */
export function useCreateProxyProvider() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<ProxyProvider, 'id' | 'createdAt'>) => proxyProviderApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: proxyProviderKeys.all })
  })
}

/** 删除代理提供商 mutation */
export function useDeleteProxyProvider() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => proxyProviderApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: proxyProviderKeys.all })
  })
}

/** 获取应用基本信息（版本、平台等） */
export function useAppInfo() {
  return useQuery({
    queryKey: appKeys.info,
    queryFn: () => appApi.getInfo()
  })
}

/** 获取仪表盘统计数据聚合 */
export function useAppStats() {
  return useQuery<StatsAggregate>({
    queryKey: appKeys.stats,
    queryFn: () => appApi.getStats()
  })
}
