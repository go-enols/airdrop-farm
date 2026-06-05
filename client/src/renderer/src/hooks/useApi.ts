/**
 * @file 通用数据获取 Hook
 * @description 提供通用的异步数据获取功能，支持 loading、error 状态和手动触发执行。
 *              内部使用 ref 存储最新 apiFn 以避免闭包陷阱。
 * @module renderer/hooks
 */
import { useCallback, useEffect, useRef, useState } from 'react'

/** useApi 返回结果的结构 */
interface UseApiResult<T> {
  /** 获取到的数据 */
  data: T | null
  /** 是否正在加载 */
  loading: boolean
  /** 错误信息（无错误时为 null） */
  error: string | null
  /** 手动执行数据获取 */
  execute: (...args: unknown[]) => Promise<T | null>
  /** 重置状态（清除 data/loading/error） */
  reset: () => void
}

/**
 * useApi — 通用数据获取 Hook
 *
 * 返回的 execute 和 reset 在多次渲染间保持稳定引用。
 * 内部通过 ref 存储最新的 apiFn，避免调用方传入内联箭头函数时导致
 * 使用者的 useEffect([execute]) 在每次渲染时重复触发。
 *
 * 之前版本使用 [apiFn] 作为 useCallback 的依赖，导致 execute 在
 * 每次渲染时都生成新函数，从而引发无限重渲染循环（如 Scheduler.tsx
 * 中出现的"页面持续闪烁"问题）。
 *
 * apiFnRef 更新放在 useEffect 中执行（而非直接写在渲染函数体内），
 * 以符合 react-hooks/exhaustive-deps 规则。
 *
 * @param apiFn - 异步数据获取函数，接收任意参数并返回 Promise<T>
 * @returns {UseApiResult<T>} 包含 data、loading、error、execute、reset 的对象
 */
export function useApi<T>(apiFn: (...args: unknown[]) => Promise<T>): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const apiFnRef = useRef(apiFn)
  // 每次渲染后更新 ref 中存储的函数引用
  useEffect(() => {
    apiFnRef.current = apiFn
  })

  /**
   * 执行数据获取
   * @param args - 传递给 apiFn 的参数
   * @returns 获取到的数据，失败时返回 null
   */
  const execute = useCallback(async (...args: unknown[]): Promise<T | null> => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiFnRef.current(...args)
      setData(result)
      return result
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /** 重置所有状态 */
  const reset = useCallback(() => {
    setData(null)
    setLoading(false)
    setError(null)
  }, [])

  return { data, loading, error, execute, reset }
}
