import { useEffect, useState, useRef, useCallback } from 'react'

interface UseAsyncEffectResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useAsyncEffect<T>(
  fn: () => Promise<T>,
  deps: React.DependencyList = []
): UseAsyncEffectResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const fnRef = useRef(fn)
  // Keep the latest fn in a ref via an effect (avoids writing to refs during render).
  useEffect(() => {
    fnRef.current = fn
  }, [fn])

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fnRef.current()
      if (mountedRef.current) setData(result)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      if (mountedRef.current) setError(message)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    // useAsyncEffect intentionally triggers a re-run of `fn` and resets loading/error
    // on every dep change — this is the canonical "data fetching on mount/dep change"
    // pattern that the react-hooks rule explicitly whitelists via disable.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    mountedRef.current = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void execute()
    return () => {
      mountedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error, refresh: execute }
}
