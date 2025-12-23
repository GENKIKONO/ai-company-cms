/**
 * Q&A Stats Module
 *
 * 型定義・ユーティリティ・サービス層を統合エクスポート
 */

// Service Layer (abstraction for future DB migration)
export {
  getQnaStats,
  aggregateDailyStats,
  analyzeUserAgents,
  type QnaStatsServiceOptions,
  type QnaStatsResult,
} from './service';

// Re-export types and utilities from the main qna-stats file
export {
  // Types
  type QAStatsTotals,
  type QAStatsDailyPoint,
  type QAStatsSummary,
  type QAStatsTopEntry,
  type QAStatsResponse,
  type QAStatsFilters,
  type QACSVExportOptions,
  type QuestionStats,
  type QuestionsByCompany,
  type QuestionsFilters,
  // Utility functions
  calculateQAPopularityScore,
  generateQADailyCSV,
  generateQAEntriesCSV,
  generateQuestionsCSV,
  generateQAExportFileName,
  translateQuestionStatus,
  generateCategoryOptions,
  generateCompanyOptions,
  // Re-exported from material-stats
  normalizeUserAgent,
  anonymizeIP,
  validateDateRange,
  getPresetDateRange,
  getDefaultDateRange,
  generateCSV,
  createErrorResponse,
  createSuccessResponse,
  debugLog,
} from '../qna-stats';
