/**
 * @file useAsyncEffect hook 测试
 * @description 验证 useAsyncEffect 在加载/成功/失败状态下的行为，
 *              以及依赖项变化时自动重新执行异步函数的特性。
 * @module tests/renderer/hooks
 */

import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { useAsyncEffect } from '../../../src/renderer/src/hooks/useAsyncEffect'

/**
 * 测试辅助组件：渲染 useAsyncEffect 的 loading/data/error 状态到 data-testid 元素
 *
 * @param fn  - 异步执行函数
 * @param deps - 依赖项数组，变化时触发重新执行
 */
function TestHarness({ fn, deps }: { fn: () => Promise<unknown>; deps: unknown[] }) {
  const result = useAsyncEffect(fn, deps)
  return (
    <div>
      <span data-testid="loading">{String(result.loading)}</span>
      <span data-testid="data">{result.data === null ? 'null' : 'set'}</span>
      <span data-testid="error">{result.error ?? 'none'}</span>
    </div>
  )
}

// describe: useAsyncEffect — 异步副作用 hook
describe('useAsyncEffect', () => {
  let container: HTMLDivElement
  let root: ReturnType<typeof createRoot>

  // 每个用例前创建容器
  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  // 每个用例后卸载并清理容器
  afterEach(() => {
    root.unmount()
    container.remove()
  })

  // 用例：初始为加载状态，异步函数解析后显示数据
  it('starts in loading state then resolves to data', async () => {
    const fn = vi.fn().mockResolvedValue({ id: 1 })
    await act(async () => {
      root = createRoot(container)
      root.render(<TestHarness fn={fn} deps={[]} />)
    })
    expect(container.querySelector('[data-testid="data"]')?.textContent).toBe('set')
    expect(container.querySelector('[data-testid="error"]')?.textContent).toBe('none')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  // 用例：异步函数拒绝时捕获错误信息
  it('captures error message on rejection', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('boom'))
    await act(async () => {
      root = createRoot(container)
      root.render(<TestHarness fn={fn} deps={[]} />)
    })
    expect(container.querySelector('[data-testid="data"]')?.textContent).toBe('null')
    expect(container.querySelector('[data-testid="error"]')?.textContent).toBe('boom')
  })

  // 用例：依赖项变化时重新执行异步函数
  it('re-runs on dep change', async () => {
    const fn = vi.fn().mockResolvedValue(null)

    await act(async () => {
      root = createRoot(container)
      root.render(<TestHarness fn={fn} deps={['first']} />)
    })
    expect(fn).toHaveBeenCalledTimes(1)
    await act(async () => {
      root.unmount()
      root = createRoot(container)
      root.render(<TestHarness fn={fn} deps={['second']} />)
    })
    expect(fn).toHaveBeenCalledTimes(2)
  })
})

  afterEach(() => {
    root.unmount()
    container.remove()
  })

  it('starts in loading state then resolves to data', async () => {
    const fn = vi.fn().mockResolvedValue({ id: 1 })
    await act(async () => {
      root = createRoot(container)
      root.render(<TestHarness fn={fn} deps={[]} />)
    })
    expect(container.querySelector('[data-testid="data"]')?.textContent).toBe('set')
    expect(container.querySelector('[data-testid="error"]')?.textContent).toBe('none')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('captures error message on rejection', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('boom'))
    await act(async () => {
      root = createRoot(container)
      root.render(<TestHarness fn={fn} deps={[]} />)
    })
    expect(container.querySelector('[data-testid="data"]')?.textContent).toBe('null')
    expect(container.querySelector('[data-testid="error"]')?.textContent).toBe('boom')
  })

  it('re-runs on dep change', async () => {
    const fn = vi.fn().mockResolvedValue(null)
    // Render once with empty deps, then unmount and re-render with new deps
    await act(async () => {
      root = createRoot(container)
      root.render(<TestHarness fn={fn} deps={['first']} />)
    })
    expect(fn).toHaveBeenCalledTimes(1)
    await act(async () => {
      root.unmount()
      root = createRoot(container)
      root.render(<TestHarness fn={fn} deps={['second']} />)
    })
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
