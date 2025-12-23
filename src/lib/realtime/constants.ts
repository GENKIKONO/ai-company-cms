/**
 * Realtime Constants
 *
 * チャンネル名・イベント名・設定を集中管理
 * 重複排除と一貫性を保証
 *
 * 命名規約:
 * - Topic: org:{orgId}:{entity}[:{suffix}]
 * - Event: {entity}_{action} (e.g., report_change)
 */

// =====================================================
// Channel Topics
// =====================================================

/**
 * チャンネルトピック生成関数
 */
export const CHANNEL_TOPICS = {
  // Reports
  orgMonthlyReports: (orgId: string) => `org:${orgId}:monthly_reports`,
  orgReportJobs: (orgId: string) => `report:${orgId}:jobs`,

  // AI Interview Sessions
  orgAiInterviewSessions: (orgId: string) => `org:${orgId}:ai_interview_sessions`,

  // QnA Stats (将来対応)
  orgQnaStats: (orgId: string) => `org:${orgId}:qna_stats`,

  // Generic org entity channel
  orgEntity: (orgId: string, entity: string, suffix?: string) =>
    suffix ? `org:${orgId}:${entity}:${suffix}` : `org:${orgId}:${entity}`,
} as const;

// =====================================================
// Broadcast Event Names
// =====================================================

/**
 * Broadcast イベント名 (DB→クライアントへの通知)
 *
 * 命名規約: {entity}_{action}
 * - change: 一般的な変更通知
 * - insert/update/delete: CRUD操作
 * - created/enqueued/completed/published: ドメイン固有のステータス変更
 */
export const BROADCAST_EVENTS = {
  // Reports
  REPORT_CHANGE: 'report_change',
  REPORT_INSERT: 'report_insert',
  REPORT_UPDATE: 'report_update',
  REPORT_DELETE: 'report_delete',
  REPORT_PUBLISHED: 'report_published', // レポート公開完了

  // Jobs
  JOB_CHANGE: 'job_change',
  JOB_INSERT: 'job_insert',
  JOB_UPDATE: 'job_update',
  JOB_STATUS_CHANGE: 'job_status_change',
  JOB_ENQUEUED: 'job_enqueued', // ジョブがキューに追加
  JOB_COMPLETED: 'job_completed', // ジョブ完了

  // Messages (汎用メッセージング)
  MESSAGE_CREATED: 'message_created',

  // AI Interview
  INTERVIEW_SESSION_CHANGE: 'interview_session_change',
  INTERVIEW_SESSION_INSERT: 'interview_session_insert',
  INTERVIEW_SESSION_UPDATE: 'interview_session_update',

  // QnA (将来対応)
  QNA_STATS_CHANGE: 'qna_stats_change',

  // Generic
  DATA_CHANGE: 'data_change',
} as const;

export type BroadcastEventType = typeof BROADCAST_EVENTS[keyof typeof BROADCAST_EVENTS];

// =====================================================
// Channel Configuration
// =====================================================

/**
 * チャンネル設定デフォルト値
 */
export const CHANNEL_CONFIG = {
  // 全てのチャンネルは private 必須
  private: true,

  // Broadcast 設定
  broadcast: {
    // 送信確認を有効化
    ack: true,
    // 自己送信を受信しない
    self: false,
  },
} as const;

/**
 * 再接続設定
 *
 * 指数バックオフ計算例 (baseMs=500, factor=1.8):
 * - Attempt 1: 500ms
 * - Attempt 2: 900ms
 * - Attempt 3: 1620ms
 */
export const RECONNECT_CONFIG = {
  // 最大リトライ回数
  maxAttempts: 3,
  // 基本遅延時間 (ms)
  baseDelayMs: 500,
  // 最大遅延時間 (ms)
  maxDelayMs: 10000,
  // 指数バックオフ倍率
  backoffMultiplier: 1.8,
} as const;

// =====================================================
// Table Names (for postgres_changes filter)
// =====================================================

/**
 * Realtime対象テーブル名
 *
 * 注意: DB検証済み（2024-12-23）
 * - ai_interview_logs → ai_interview_messages に修正
 * - qna_stats → qna_events に修正（qna_statsは存在しない）
 */
export const REALTIME_TABLES = {
  AI_MONTHLY_REPORTS: 'ai_monthly_reports',
  MONTHLY_REPORT_JOBS: 'monthly_report_jobs',
  AI_INTERVIEW_SESSIONS: 'ai_interview_sessions',
  AI_INTERVIEW_MESSAGES: 'ai_interview_messages', // 旧: ai_interview_logs（存在しない）
  QNA_EVENTS: 'qna_events', // 旧: qna_stats（存在しない）
} as const;

export type RealtimeTableName = typeof REALTIME_TABLES[keyof typeof REALTIME_TABLES];

// =====================================================
// Event Type Mapping
// =====================================================

/**
 * postgres_changes → broadcast event type マッピング
 */
export const POSTGRES_TO_BROADCAST_EVENT: Record<string, BroadcastEventType> = {
  INSERT: BROADCAST_EVENTS.DATA_CHANGE,
  UPDATE: BROADCAST_EVENTS.DATA_CHANGE,
  DELETE: BROADCAST_EVENTS.DATA_CHANGE,
};

// =====================================================
// Feature Flags
// =====================================================

/**
 * Realtime機能フラグ (環境変数から取得)
 */
export const REALTIME_FLAGS = {
  // broadcast モード有効化 (postgres_changes からの移行用)
  isBroadcastModeEnabled: () => process.env.NEXT_PUBLIC_REALTIME_BROADCAST_MODE === 'true',

  // デバッグログ有効化
  isDebugLogEnabled: () => process.env.NEXT_PUBLIC_REALTIME_DEBUG === 'true',

  // 再接続を無効化 (テスト用)
  isReconnectDisabled: () => process.env.NEXT_PUBLIC_REALTIME_DISABLE_RECONNECT === 'true',
} as const;

// =====================================================
// Helper Functions
// =====================================================

/**
 * 指数バックオフ遅延計算
 */
export function calculateBackoffDelay(attempt: number): number {
  const delay = RECONNECT_CONFIG.baseDelayMs *
    Math.pow(RECONNECT_CONFIG.backoffMultiplier, attempt);
  return Math.min(delay, RECONNECT_CONFIG.maxDelayMs);
}

/**
 * チャンネル設定マージ
 */
export function getChannelConfig(overrides?: Partial<typeof CHANNEL_CONFIG>) {
  return {
    ...CHANNEL_CONFIG,
    ...overrides,
    broadcast: {
      ...CHANNEL_CONFIG.broadcast,
      ...(overrides?.broadcast || {}),
    },
  };
}
