/**
 * @file 防抖 Hook
 * @description 将输入值进行防抖处理，适用于搜索输入、窗口 resize 等频繁触发场景。
 * @module renderer/hooks
 */
import { useState, useEffect } from 'react'

/**
 * useDebounce — 防抖 Hook
 *
 * 在 delay 毫秒内，如果 value 发生变化，则重新计时，
 * 只有稳定下来后才返回新的值。
 *
 * @param value - 需要防抖的值
 * @param delay - 防抖延迟（毫秒）
 * @returns 防抖后的值（在 delay 毫秒内稳定后才更新）
 * @example
 * ```ts
 * const debouncedSearch = useDebounce(searchTerm, 300)
 * ```
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}
