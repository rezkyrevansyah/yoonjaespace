import { useState, useEffect, useCallback, useRef } from 'react'

interface SWROptions {
  refreshInterval?: number | any
  [key: string]: any
}

export default function useSWR<T>(
  key: string | null,
  fetcher: (url: string) => Promise<T>,
  options?: SWROptions
) {
  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState<any>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const mountedRef = useRef(false)

  const fetchData = useCallback(async () => {
    if (!key) return
    
    try {
      const result = await fetcher(key)
      if (mountedRef.current) {
        setData(result)
        setError(undefined)
        setIsLoading(false)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err)
        setIsLoading(false)
      }
    }
  }, [key, fetcher])

  useEffect(() => {
    mountedRef.current = true
    
    if (key) {
      fetchData()
    } else {
        setIsLoading(false)
    }

    let intervalId: NodeJS.Timeout | null = null
    if (key && options?.refreshInterval) {
      intervalId = setInterval(fetchData, options.refreshInterval)
    }

    return () => {
      mountedRef.current = false
      if (intervalId) clearInterval(intervalId)
    }
  }, [key, options?.refreshInterval, fetchData])

  const mutate = useCallback(async (newData?: T | Promise<T>, shouldRevalidate: boolean = true) => {
    if (newData !== undefined) {
      const resolvedData = await Promise.resolve(newData)
      setData(resolvedData)
    }
    
    if (shouldRevalidate && key) {
       await fetchData()
    }
  }, [fetchData, key])

  return {
    data,
    error,
    isLoading,
    mutate
  }
}
