import { useState, useCallback } from 'react'
export function useApi(apiFn) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const execute = useCallback(
    async (...args) => {
      setLoading(true)
      setError(null)
      try {
        const result = await apiFn(...args)
        setData(result)
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        setError(message)
        return null
      } finally {
        setLoading(false)
      }
    },
    [apiFn]
  )
  const reset = useCallback(() => {
    setData(null)
    setLoading(false)
    setError(null)
  }, [])
  return { data, loading, error, execute, reset }
}
