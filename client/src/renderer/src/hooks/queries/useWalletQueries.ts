/**
 * @file 钱包数据查询 Hook
 * @description 基于 @tanstack/react-query 封装的钱包 CRUD 操作 Hooks，
 *              提供自动缓存、后台刷新和乐观更新支持。
 * @module renderer/hooks/queries
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { walletApi } from '../../api'
import type { Wallet, ListResponse } from '../../types'

/** 钱包查询键工厂，用于管理 React Query 的缓存键 */
export const walletKeys = {
  /** 所有钱包相关查询的根键 */
  all: ['wallets'] as const,
  /** 分页列表查询键 */
  list: (page: number, pageSize: number, search: string) =>
    [...walletKeys.all, 'list', page, pageSize, search] as const,
  /** 单个钱包详情查询键 */
  detail: (id: string) => [...walletKeys.all, 'detail', id] as const
}

/**
 * 获取钱包分页列表
 * @param page - 页码（从 1 开始，默认 1）
 * @param pageSize - 每页条数（默认 20）
 * @param search - 搜索关键字
 */
export function useWalletList(page = 1, pageSize = 20, search = '') {
  return useQuery<ListResponse<Wallet>>({
    queryKey: walletKeys.list(page, pageSize, search),
    queryFn: () => walletApi.list(page, pageSize, search)
  })
}

/**
 * 获取单个钱包详情
 * @param id - 钱包 ID，为 null 时禁用查询
 */
export function useWallet(id: string | null) {
  return useQuery<Wallet | null>({
    queryKey: walletKeys.detail(id!),
    queryFn: () => walletApi.get(id!),
    enabled: !!id
  })
}

/** 创建钱包 mutation */
export function useCreateWallet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Wallet, 'id' | 'createdAt'>) => walletApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: walletKeys.all })
  })
}

/** 更新钱包 mutation */
export function useUpdateWallet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Wallet> }) => walletApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: walletKeys.all })
  })
}

/** 删除钱包 mutation */
export function useDeleteWallet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => walletApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: walletKeys.all })
  })
}

/** 批量删除钱包 mutation */
export function useBatchDeleteWallets() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => walletApi.batchDelete(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: walletKeys.all })
  })
}
