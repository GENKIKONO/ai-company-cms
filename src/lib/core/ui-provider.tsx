'use client'

/**
 * UI Provider - 共通UIルール（Core層）
 *
 * 【現状の位置づけ】
 * 将来のUI統一基盤として用意。現時点では以下の方針：
 * - Toast: 既存の ToastProvider (@/components/ui/toast) を使用
 * - Modal: 各コンポーネントで個別管理
 * - Theme: 将来対応（現状はCSS変数で管理）
 *
 * 【二重Provider回避】
 * UIProvider と ToastProvider は異なるContext。
 * UIProvider.showToast は将来用で、現時点では ToastProvider.addToast を使用すること。
 *
 * 【使い分け】
 * - Toast表示: useToast() from '@/components/ui/toast' を使用
 * - テーマ/将来機能: useUI() from '@/lib/core' を使用（現時点では利用箇所なし）
 *
 * 【責務】
 * - PageShell はUIルールを持たず、Provider を利用する側
 * - UI Provider はビジネスルールを持たない
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

// =============================================================================
// Types
// =============================================================================

type Theme = 'light' | 'dark' | 'system'

interface UIContextValue {
  // テーマ（将来用）
  theme: Theme
  setTheme: (theme: Theme) => void

  // 共通Modal状態（将来用）
  isModalOpen: boolean
  openModal: () => void
  closeModal: () => void
}

// =============================================================================
// Context
// =============================================================================

const UIContext = createContext<UIContextValue | null>(null)

/**
 * UI Contextを使用（将来用）
 *
 * 現時点での利用箇所はなし。
 * Toast表示には useToast() from '@/components/ui/toast' を使用すること。
 */
export function useUI(): UIContextValue {
  const context = useContext(UIContext)
  if (!context) {
    throw new Error('useUI must be used within a UIProvider')
  }
  return context
}

// =============================================================================
// Provider
// =============================================================================

interface UIProviderProps {
  children: ReactNode
  defaultTheme?: Theme
}

/**
 * UIProvider - 共通UI状態管理
 *
 * root layout で1回だけ適用。
 * 既存の ToastProvider とは別のContext（二重Providerではない）。
 */
export function UIProvider({ children, defaultTheme = 'system' }: UIProviderProps): React.ReactElement {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = useCallback(() => setIsModalOpen(true), [])
  const closeModal = useCallback(() => setIsModalOpen(false), [])

  const value: UIContextValue = {
    theme,
    setTheme,
    isModalOpen,
    openModal,
    closeModal,
  }

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  )
}
