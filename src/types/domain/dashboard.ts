/**
 * ダッシュボード関連のUI専用型定義
 * 管理画面・ダッシュボード向けのビジネスロジック・UI専用型
 */

// Supabaseの型定義から必要な型をimport（実装時に調整）
// import { Database } from '../supabase'

// ダッシュボード統計情報
export interface DashboardStats {
  totalSessions: number
  completedSessions: number
  activeSessions: number
  averageCompletionTime: number // 分
  completionRate: number // 0-100
  period: {
    from: string
    to: string
  }
}

// ダッシュボードアクティビティ
export interface DashboardActivity {
  id: string
  type: 'session_created' | 'session_completed' | 'user_registered' | 'content_generated'
  description: string
  userId: string
  userName: string
  timestamp: string
  metadata?: Record<string, unknown>
}

// フィルター設定
export interface DashboardFilters {
  dateRange: {
    from: string
    to: string
  }
  contentType?: string[]
  status?: string[]
  userId?: string
}

// ダッシュボードカード設定
export interface DashboardCard {
  id: string
  title: string
  type: 'stat' | 'chart' | 'activity' | 'recent_items'
  position: { x: number; y: number }
  size: { width: number; height: number }
  config?: Record<string, unknown>
  isVisible: boolean
}

// チャートデータ
export interface ChartDataPoint {
  date: string
  value: number
  label?: string
}

export interface DashboardChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string[]
    borderColor?: string[]
  }[]
}