/**
 * @file React Query 客户端配置
 * @description 创建全局唯一的 QueryClient 实例，配置默认的查询选项：
 *              - staleTime: 30 秒（数据在 30 秒内视为新鲜，不会自动重新获取）
 *              - retry: 失败后重试 1 次
 *              - refetchOnWindowFocus: 禁止切换窗口后自动刷新
 * @module renderer/hooks/queries
 */
import { QueryClient } from '@tanstack/react-query'

/** 全局 QueryClient 实例 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /** 数据过期时间（30 秒），在此时间内不会自动重新获取 */
      staleTime: 30_000,
      /** 查询失败后的重试次数 */
      retry: 1,
      /** 窗口聚焦时不自动刷新 */
      refetchOnWindowFocus: false
    }
  }
})
