import { useState, useEffect } from 'react'
import { templateApi } from '../api'
export function useTemplateList() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    templateApi
      .list()
      .then((res) => setTemplates(res.items || []))
      .catch((err) => {
        console.warn('Failed to load templates', err)
        setTemplates([])
      })
      .finally(() => setLoading(false))
  }, [])
  return { templates, loading }
}
