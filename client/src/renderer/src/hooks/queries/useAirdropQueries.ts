/**
 * @file 空投项目数据查询 Hook
 * @description 封装空投项目的列表查询、详情获取和 CRUD 操作。
 * @module renderer/hooks/queries
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { airdropApi } from '../../api'
import type { AirdropProject, ListResponse } from '../../types'

/** 空投项目查询键工厂 */
export const airdropKeys = {
  /** 所有空投项目根键 */
  all: ['airdrops'] as const,
  /** 分页列表查询键 */
  list: (page: number, pageSize: number, search: string) =>
    [...airdropKeys.all, 'list', page, pageSize, search] as const,
  /** 单个空投项目详情查询键 */
  detail: (id: string) => [...airdropKeys.all, 'detail', id] as const
}

/**
 * 获取空投项目分页列表
 * @param page - 页码（默认 1）
 * @param pageSize - 每页条数（默认 20）
 * @param search - 搜索关键字
 */
export function useAirdropList(page = 1, pageSize = 20, search = '') {
  return useQuery<ListResponse<AirdropProject>>({
    queryKey: airdropKeys.list(page, pageSize, search),
    queryFn: () => airdropApi.list(page, pageSize, search)
  })
}

/**
 * 获取单个空投项目详情
 * @param id - 项目 ID，为 null 时禁用查询
 */
export function useAirdrop(id: string | null) {
  return useQuery<AirdropProject | null>({
    queryKey: airdropKeys.detail(id!),
    queryFn: () => airdropApi.get(id!),
    enabled: !!id
  })
}

/** 创建空投项目 mutation */
export function useCreateAirdrop() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<AirdropProject, 'id' | 'createdAt' | 'updatedAt'>) =>
      airdropApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: airdropKeys.all })
  })
}

/** 更新空投项目 mutation */
export function useUpdateAirdrop() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AirdropProject> }) =>
      airdropApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: airdropKeys.all })
  })
}

/** 删除空投项目 mutation */
export function useDeleteAirdrop() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => airdropApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: airdropKeys.all })
  })
}
