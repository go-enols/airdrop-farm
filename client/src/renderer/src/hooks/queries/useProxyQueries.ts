/**
 * @file 代理数据查询 Hook
 * @description 封装代理列表查询和 CRUD 操作，支持分页和批量删除。
 * @module renderer/hooks/queries
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { proxyApi } from '../../api'
import type { Proxy, ListResponse } from '../../types'

/** 代理查询键工厂 */
export const proxyKeys = {
  /** 所有代理根键 */
  all: ['proxies'] as const,
  /** 分页列表查询键 */
  list: (page: number, pageSize: number, search: string) =>
    [...proxyKeys.all, 'list', page, pageSize, search] as const,
  /** 单个代理详情查询键 */
  detail: (id: string) => [...proxyKeys.all, 'detail', id] as const
}

/**
 * 获取代理分页列表
 * @param page - 页码（默认 1）
 * @param pageSize - 每页条数（默认 20）
 * @param search - 搜索关键字
 */
export function useProxyList(page = 1, pageSize = 20, search = '') {
  return useQuery<ListResponse<Proxy>>({
    queryKey: proxyKeys.list(page, pageSize, search),
    queryFn: () => proxyApi.list(page, pageSize, search)
  })
}

/** 创建代理 mutation */
export function useCreateProxy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Proxy, 'id' | 'createdAt'>) => proxyApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: proxyKeys.all })
  })
}

/** 更新代理 mutation */
export function useUpdateProxy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Proxy> }) => proxyApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: proxyKeys.all })
  })
}

/** 删除代理 mutation */
export function useDeleteProxy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => proxyApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: proxyKeys.all })
  })
}

/** 批量删除代理 mutation */
export function useBatchDeleteProxies() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => proxyApi.batchDelete(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: proxyKeys.all })
  })
}
