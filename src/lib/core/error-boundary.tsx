'use client'

/**
 * Core エラー境界コンポーネント
 *
 * 【正本】
 * このファイルはCore層のエントリポイントであり、
 * 実装は AppErrorBoundary に委譲する。
 *
 * 【使い分け】
 * - 汎用/root: ErrorBoundary (= AppErrorBoundary)
 * - Dashboard専用: DashboardErrorBoundary（StandardError対応）
 *
 * 【責務】
 * - React コンポーネントツリーのエラーをキャッチ
 * - ユーザーフレンドリーなエラー表示
 * - エラー監視システム（/api/log/error）への送信
 */

// 正本はAppErrorBoundary（Phase 4監視機能付き）
// Core経由でのアクセスを提供
export { AppErrorBoundary as ErrorBoundary, withErrorBoundary } from '@/components/common/AppErrorBoundary'
