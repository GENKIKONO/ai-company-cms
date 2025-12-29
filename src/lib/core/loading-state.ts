'use client'

/**
 * 共通ローディング状態フック
 *
 * 【責務】
 * - 非同期処理のローディング状態を統一管理
 * - エラーハンドリングの統一
 */

import { useState, useCallback } from 'react'

/**
 * 非同期関数をラップしてローディング状態を管理
 */
export function useLoading<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>
): {
  loading: boolean
  error: Error | null
  run: (...args: T) => Promise<R | undefined>
} {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const wrapped = useCallback(
    async (...args: T): Promise<R | undefined> => {
      setLoading(true)
      setError(null)
      try {
        const result = await fn(...args)
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        return undefined
      } finally {
        setLoading(false)
      }
    },
    [fn]
  )

  return { loading, error, run: wrapped }
}

/**
 * 複数のローディング状態を管理
 */
export function useMultipleLoading<K extends string>(): {
  isLoading: (key: K) => boolean
  anyLoading: boolean
  startLoading: (key: K) => void
  stopLoading: (key: K) => void
} {
  const [loadingKeys, setLoadingKeys] = useState<Set<K>>(new Set())

  const isLoading = useCallback(
    (key: K) => loadingKeys.has(key),
    [loadingKeys]
  )

  const startLoading = useCallback((key: K) => {
    setLoadingKeys((prev) => new Set([...prev, key]))
  }, [])

  const stopLoading = useCallback((key: K) => {
    setLoadingKeys((prev) => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })
  }, [])

  return {
    isLoading,
    anyLoading: loadingKeys.size > 0,
    startLoading,
    stopLoading,
  }
}
