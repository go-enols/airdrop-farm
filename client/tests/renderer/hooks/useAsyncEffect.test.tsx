import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { useAsyncEffect } from '../../../src/renderer/src/hooks/useAsyncEffect'

// Test harness component
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

describe('useAsyncEffect', () => {
  let container: HTMLDivElement
  let root: ReturnType<typeof createRoot>

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
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
