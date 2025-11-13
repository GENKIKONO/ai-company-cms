/**
 * API Type Definitions for Complete Type Safety
 * Phase 4: Unified API Response Types and Error Handling
 */

import type { DatabaseError } from './database.types'

// =====================================================
// CORE API RESPONSE TYPES
// =====================================================

/**
 * Base API response structure with generic data type
 */
export interface ApiResponse<T = unknown> {
  /** Response data - null if error occurred */
  data: T | null
  /** Success indicator */
  success: boolean
  /** Human-readable message */
  message?: string
  /** Error information if success is false */
  error?: ApiError | null
  /** Response metadata */
  meta?: ApiResponseMeta
}

/**
 * API Error structure with detailed information
 */
export interface ApiError {
  /** Error code for programmatic handling */
  code: string
  /** Human-readable error message */
  message: string
  /** Detailed error description */
  details?: string
  /** Error context for debugging */
  context?: Record<string, unknown>
  /** HTTP status code */
  status?: number
  /** Timestamp of error occurrence */
  timestamp?: string
  /** Request ID for tracking */
  requestId?: string
  /** Field-specific validation errors */
  fieldErrors?: Record<string, string[]>
}

/**
 * API Response metadata
 */
export interface ApiResponseMeta {
  /** Request processing time in milliseconds */
  processingTime?: number
  /** API version */
  version?: string
  /** Request timestamp */
  timestamp?: string
  /** Request ID for tracking */
  requestId?: string
  /** Cache information */
  cache?: {
    hit: boolean
    ttl?: number
    key?: string
  }
  /** Rate limiting information */
  rateLimit?: {
    limit: number
    remaining: number
    resetTime: string
  }
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  /** Pagination information */
  pagination: PaginationInfo
}

/**
 * Pagination information
 */
export interface PaginationInfo {
  /** Current page number (1-based) */
  page: number
  /** Items per page */
  limit: number
  /** Total number of items */
  total: number
  /** Total number of pages */
  totalPages: number
  /** Whether there is a next page */
  hasNextPage: boolean
  /** Whether there is a previous page */
  hasPreviousPage: boolean
  /** Starting index of current page items */
  startIndex: number
  /** Ending index of current page items */
  endIndex: number
}

// =====================================================
// HTTP METHOD SPECIFIC TYPES
// =====================================================

/**
 * GET request response
 */
export type GetResponse<T = unknown> = ApiResponse<T>

/**
 * POST request response (creation)
 */
export interface PostResponse<T = unknown> extends ApiResponse<T> {
  /** Resource creation metadata */
  created?: {
    id: string
    createdAt: string
    location?: string
  }
}

/**
 * PUT/PATCH request response (update)
 */
export interface UpdateResponse<T = unknown> extends ApiResponse<T> {
  /** Resource update metadata */
  updated?: {
    id: string
    updatedAt: string
    changedFields?: string[]
  }
}

/**
 * DELETE request response
 */
export interface DeleteResponse extends ApiResponse<null> {
  /** Resource deletion metadata */
  deleted?: {
    id: string
    deletedAt: string
    softDelete?: boolean
  }
}

// =====================================================
// API REQUEST TYPES
// =====================================================

/**
 * Base API request parameters
 */
export interface ApiRequestParams {
  /** Request headers */
  headers?: Record<string, string>
  /** Query parameters */
  query?: Record<string, string | string[] | number | boolean>
  /** Request timeout in milliseconds */
  timeout?: number
  /** Abort signal for request cancellation */
  signal?: AbortSignal
}

/**
 * GET request parameters
 */
export interface GetRequestParams extends ApiRequestParams {
  /** Pagination parameters */
  pagination?: {
    page?: number
    limit?: number
    offset?: number
  }
  /** Sort parameters */
  sort?: {
    field: string
    order?: 'asc' | 'desc'
  }[]
  /** Filter parameters */
  filters?: Record<string, unknown>
  /** Fields to include in response */
  include?: string[]
  /** Fields to exclude from response */
  exclude?: string[]
}

/**
 * POST request parameters
 */
export interface PostRequestParams<T = unknown> extends ApiRequestParams {
  /** Request body data */
  body: T
  /** Validation options */
  validation?: {
    strict?: boolean
    sanitize?: boolean
  }
}

/**
 * PUT/PATCH request parameters
 */
export interface UpdateRequestParams<T = unknown> extends ApiRequestParams {
  /** Request body data */
  body: Partial<T>
  /** Update options */
  options?: {
    upsert?: boolean
    merge?: boolean
    validate?: boolean
  }
}

/**
 * DELETE request parameters
 */
export interface DeleteRequestParams extends ApiRequestParams {
  /** Delete options */
  options?: {
    soft?: boolean
    cascade?: boolean
    force?: boolean
  }
}

// =====================================================
// VALIDATION TYPES
// =====================================================

/**
 * Validation error details
 */
export interface ValidationError {
  /** Field name that failed validation */
  field: string
  /** Validation error message */
  message: string
  /** Failed validation rule */
  rule: string
  /** Expected value or constraint */
  expected?: unknown
  /** Actual value that failed */
  actual?: unknown
}

/**
 * Input validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean
  /** Validation errors if any */
  errors: ValidationError[]
  /** Sanitized data */
  sanitized?: Record<string, unknown>
}

// =====================================================
// SEARCH AND FILTER TYPES
// =====================================================

/**
 * Search parameters
 */
export interface SearchParams {
  /** Search query */
  query: string
  /** Fields to search in */
  fields?: string[]
  /** Search options */
  options?: {
    fuzzy?: boolean
    highlight?: boolean
    minScore?: number
    operator?: 'and' | 'or'
  }
}

/**
 * Filter condition
 */
export interface FilterCondition {
  /** Field to filter on */
  field: string
  /** Filter operator */
  operator: FilterOperator
  /** Filter value(s) */
  value: unknown
  /** Whether to apply NOT logic */
  not?: boolean
}

/**
 * Available filter operators
 */
export type FilterOperator =
  | 'eq' | 'neq'           // Equal, Not Equal
  | 'gt' | 'gte'           // Greater Than, Greater Than or Equal
  | 'lt' | 'lte'           // Less Than, Less Than or Equal
  | 'like' | 'ilike'       // Pattern matching
  | 'in' | 'nin'           // In Array, Not In Array
  | 'is' | 'isnot'         // Is Null, Is Not Null
  | 'contains' | 'contained' // Array/Object operations
  | 'starts' | 'ends'      // String prefix/suffix
  | 'range'                // Range operations

/**
 * Complex filter expression
 */
export interface FilterExpression {
  /** Logical operator for combining conditions */
  operator: 'and' | 'or'
  /** Filter conditions */
  conditions: (FilterCondition | FilterExpression)[]
}

// =====================================================
// FILE AND UPLOAD TYPES
// =====================================================

/**
 * File upload response
 */
export interface FileUploadResponse extends ApiResponse<FileInfo> {
  /** Upload metadata */
  upload?: {
    uploadId: string
    signedUrl?: string
    expiresAt?: string
  }
}

/**
 * File information
 */
export interface FileInfo {
  /** File ID */
  id: string
  /** Original filename */
  name: string
  /** File size in bytes */
  size: number
  /** MIME type */
  type: string
  /** File URL */
  url: string
  /** File path in storage */
  path: string
  /** Upload timestamp */
  uploadedAt: string
  /** File metadata */
  metadata?: Record<string, unknown>
}

// =====================================================
// AUTHENTICATION TYPES
// =====================================================

/**
 * Authentication response
 */
export interface AuthResponse extends ApiResponse<AuthData> {
  /** Authentication tokens */
  tokens?: {
    accessToken: string
    refreshToken?: string
    expiresAt: string
  }
}

/**
 * Authentication data
 */
export interface AuthData {
  /** User information */
  user: {
    id: string
    email: string
    role: string
    [key: string]: unknown
  }
  /** Session information */
  session?: {
    id: string
    expiresAt: string
    [key: string]: unknown
  }
}

// =====================================================
// WEBHOOK AND EVENT TYPES
// =====================================================

/**
 * Webhook payload
 */
export interface WebhookPayload<T = unknown> {
  /** Event type */
  event: string
  /** Event data */
  data: T
  /** Event timestamp */
  timestamp: string
  /** Webhook metadata */
  meta: {
    source: string
    version: string
    id: string
  }
  /** Event signature for verification */
  signature?: string
}

/**
 * Event notification
 */
export interface EventNotification {
  /** Notification ID */
  id: string
  /** Event type */
  type: string
  /** Notification title */
  title: string
  /** Notification message */
  message: string
  /** Notification level */
  level: 'info' | 'success' | 'warning' | 'error'
  /** Notification timestamp */
  timestamp: string
  /** Additional data */
  data?: Record<string, unknown>
  /** Whether notification was read */
  read?: boolean
}

// =====================================================
// ERROR HANDLING UTILITIES
// =====================================================

/**
 * Error classification
 */
export type ErrorType =
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'not_found'
  | 'conflict'
  | 'rate_limit'
  | 'server_error'
  | 'network_error'
  | 'timeout'
  | 'unknown'

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * Create a standardized API error
 */
export function createApiError(
  code: string,
  message: string,
  options?: {
    details?: string
    context?: Record<string, unknown>
    status?: number
    fieldErrors?: Record<string, string[]>
    severity?: ErrorSeverity
  }
): ApiError {
  return {
    code,
    message,
    details: options?.details,
    context: options?.context,
    status: options?.status,
    timestamp: new Date().toISOString(),
    fieldErrors: options?.fieldErrors,
  }
}

/**
 * Create a successful API response
 */
export function createApiResponse<T>(
  data: T,
  options?: {
    message?: string
    meta?: ApiResponseMeta
  }
): ApiResponse<T> {
  return {
    data,
    success: true,
    message: options?.message,
    meta: options?.meta,
    error: null,
  }
}

/**
 * Create an error API response
 */
export function createErrorResponse(
  error: ApiError,
  options?: {
    message?: string
    meta?: ApiResponseMeta
  }
): ApiResponse<null> {
  return {
    data: null,
    success: false,
    message: options?.message || error.message,
    error,
    meta: options?.meta,
  }
}

/**
 * Type guard for API error
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof (error as ApiError).code === 'string' &&
    typeof (error as ApiError).message === 'string'
  )
}

/**
 * Type guard for API response
 */
export function isApiResponse<T = unknown>(
  response: unknown
): response is ApiResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    'data' in response &&
    typeof (response as ApiResponse).success === 'boolean'
  )
}

/**
 * Type guard for paginated response
 */
export function isPaginatedResponse<T = unknown>(
  response: unknown
): response is PaginatedResponse<T> {
  return (
    isApiResponse(response) &&
    'pagination' in response &&
    typeof (response as PaginatedResponse).pagination === 'object'
  )
}

// =====================================================
// API CLIENT TYPES
// =====================================================

/**
 * Generic API client interface
 */
export interface ApiClient {
  /** GET request */
  get<T = unknown>(
    endpoint: string,
    params?: GetRequestParams
  ): Promise<ApiResponse<T>>

  /** POST request */
  post<TBody = unknown, TResponse = unknown>(
    endpoint: string,
    params: PostRequestParams<TBody>
  ): Promise<PostResponse<TResponse>>

  /** PUT request */
  put<TBody = unknown, TResponse = unknown>(
    endpoint: string,
    params: UpdateRequestParams<TBody>
  ): Promise<UpdateResponse<TResponse>>

  /** PATCH request */
  patch<TBody = unknown, TResponse = unknown>(
    endpoint: string,
    params: UpdateRequestParams<TBody>
  ): Promise<UpdateResponse<TResponse>>

  /** DELETE request */
  delete(
    endpoint: string,
    params?: DeleteRequestParams
  ): Promise<DeleteResponse>

  /** Upload file */
  upload(
    endpoint: string,
    file: File,
    params?: ApiRequestParams
  ): Promise<FileUploadResponse>
}

/**
 * API client configuration
 */
export interface ApiClientConfig {
  /** Base URL for API */
  baseUrl: string
  /** Default headers */
  defaultHeaders?: Record<string, string>
  /** Default timeout */
  timeout?: number
  /** Request interceptors */
  interceptors?: {
    request?: (config: ApiRequestParams) => ApiRequestParams | Promise<ApiRequestParams>
    response?: (response: ApiResponse) => ApiResponse | Promise<ApiResponse>
    error?: (error: ApiError) => ApiError | Promise<ApiError>
  }
  /** Retry configuration */
  retry?: {
    attempts?: number
    delay?: number
    conditions?: ErrorType[]
  }
}

// =====================================================
// HEALTH CHECK TYPES
// =====================================================

/**
 * Health check status
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy'

/**
 * Health check response
 */
export interface HealthCheckResponse extends ApiResponse<HealthCheckData> {
  /** Overall system status */
  status: HealthStatus
}

/**
 * Health check data
 */
export interface HealthCheckData {
  /** Overall status */
  status: HealthStatus
  /** Timestamp of check */
  timestamp: string
  /** Service uptime in seconds */
  uptime: number
  /** Individual service checks */
  checks: Record<string, ServiceHealthCheck>
  /** System metadata */
  system?: {
    version: string
    environment: string
    region?: string
  }
}

/**
 * Individual service health check
 */
export interface ServiceHealthCheck {
  /** Service status */
  status: HealthStatus
  /** Response time in milliseconds */
  responseTime?: number
  /** Last error if any */
  error?: string
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

// =====================================================
// RATE LIMITING TYPES
// =====================================================

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum requests per window */
  limit: number
  /** Time window in seconds */
  window: number
  /** Rate limit strategy */
  strategy?: 'fixed' | 'sliding'
  /** Rate limit key generator */
  keyGenerator?: (request: ApiRequestParams) => string
}

/**
 * Rate limit status
 */
export interface RateLimitStatus {
  /** Limit configuration */
  limit: number
  /** Remaining requests */
  remaining: number
  /** Reset time */
  resetTime: string
  /** Retry after seconds (if limited) */
  retryAfter?: number
}

// =====================================================
// ANALYTICS TYPES
// =====================================================

/**
 * API analytics event
 */
export interface ApiAnalyticsEvent {
  /** Event type */
  type: 'request' | 'response' | 'error'
  /** Endpoint called */
  endpoint: string
  /** HTTP method */
  method: string
  /** Response status */
  status?: number
  /** Response time in milliseconds */
  responseTime?: number
  /** User agent */
  userAgent?: string
  /** IP address */
  ipAddress?: string
  /** User ID if authenticated */
  userId?: string
  /** Request ID */
  requestId: string
  /** Timestamp */
  timestamp: string
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

/**
 * API metrics summary
 */
export interface ApiMetrics {
  /** Total requests */
  totalRequests: number
  /** Average response time */
  averageResponseTime: number
  /** Error rate */
  errorRate: number
  /** Requests per second */
  requestsPerSecond: number
  /** Most used endpoints */
  topEndpoints: Array<{
    endpoint: string
    count: number
    avgResponseTime: number
  }>
  /** Status code distribution */
  statusCodes: Record<string, number>
  /** Time range of metrics */
  timeRange: {
    start: string
    end: string
  }
}