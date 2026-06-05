/**
 * @file 账户数据查询 Hook
 * @description 封装账号池中账户的列表查询、详情获取、账号池名称列表和 CRUD 操作。
 * @module renderer/hooks/queries
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { accountApi } from '../../api'
import type { Account, ListResponse } from '../../types'

/** 账户查询键工厂 */
export const accountKeys = {
  /** 所有账户根键 */
  all: ['accounts'] as const,
  /** 分页列表查询键 */
  list: (page: number, pageSize: number, search: string) =>
    [...accountKeys.all, 'list', page, pageSize, search] as const,
  /** 单个账户详情查询键 */
  detail: (id: string) => [...accountKeys.all, 'detail', id] as const,
  /** 账号池名称列表查询键 */
  pools: ['accountPools'] as const
}

/**
 * 获取账户分页列表
 * @param page - 页码（默认 1）
 * @param pageSize - 每页条数（默认 20）
 * @param search - 搜索关键字
 */
export function useAccountList(page = 1, pageSize = 20, search = '') {
  return useQuery<ListResponse<Account>>({
    queryKey: accountKeys.list(page, pageSize, search),
    queryFn: () => accountApi.list(page, pageSize, search)
  })
}

/**
 * 获取单个账户详情
 * @param id - 账户 ID，为 null 时禁用查询
 */
export function useAccount(id: string | null) {
  return useQuery<Account | null>({
    queryKey: accountKeys.detail(id!),
    queryFn: () => accountApi.get(id!),
    enabled: !!id
  })
}

/** 获取所有账号池名称列表 */
export function useAccountPools() {
  return useQuery<string[]>({
    queryKey: accountKeys.pools,
    queryFn: () => accountApi.listPools()
  })
}

/** 创建账户 mutation */
export function useCreateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => accountApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: accountKeys.all })
  })
}

/** 更新账户 mutation */
export function useUpdateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Account> }) =>
      accountApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: accountKeys.all })
  })
}

/** 删除账户 mutation */
export function useDeleteAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => accountApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: accountKeys.all })
  })
}
