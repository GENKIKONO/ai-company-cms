/**
 * Type-Safe API Client Library
 * Phase 4: Complete Type Safety for API Operations
 */

import type {
  ApiResponse,
  ApiError,
  ApiClient,
  ApiClientConfig,
  GetRequestParams,
  PostRequestParams,
  UpdateRequestParams,
  DeleteRequestParams,
  PostResponse,
  UpdateResponse,
  DeleteResponse,
  FileUploadResponse,
} from '@/types/api.types'
import {
  createApiResponse,
  createErrorResponse,
  createApiError,
  isApiResponse,
  isApiError,
} from '@/types/api.types'
import type { DatabaseResult } from '@/types/database.types'
import { logger } from '@/lib/utils/logger'

// Local type for user_preferences (table not in generated schema)
// TODO: Add user_preferences table to database or remove this feature
interface UserPreferencesRow {
  id: string
  user_id: string
  preferences: Record<string, unknown>
  created_at: string
  updated_at: string
}
type UserPreferencesUpdate = Partial<Omit<UserPreferencesRow, 'id' | 'user_id'>>

// =====================================================
// API CLIENT IMPLEMENTATION
// =====================================================

/**
 * Type-safe API client with comprehensive error handling
 */
export class TypedApiClient implements ApiClient {
  private config: Required<ApiClientConfig>

  constructor(config: ApiClientConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      defaultHeaders: {
        'Content-Type': 'application/json',
        ...config.defaultHeaders,
      },
      timeout: config.timeout ?? 10000,
      interceptors: config.interceptors ?? {},
      retry: {
        attempts: 3,
        delay: 1000,
        conditions: ['network_error', 'timeout', 'server_error'],
        ...config.retry,
      },
    }
  }

  /**
   * Type-safe GET request
   */
  async get<T = unknown>(
    endpoint: string,
    params?: GetRequestParams
  ): Promise<ApiResponse<T>> {
    try {
      const url = this.buildUrl(endpoint, params?.query)
      const requestConfig = await this.buildRequestConfig('GET', params)

      const response = await this.executeRequest(url, requestConfig)
      return await this.handleResponse<T>(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Type-safe POST request
   */
  async post<TBody = unknown, TResponse = unknown>(
    endpoint: string,
    params: PostRequestParams<TBody>
  ): Promise<PostResponse<TResponse>> {
    try {
      const url = this.buildUrl(endpoint)
      const requestConfig = await this.buildRequestConfig('POST', params)

      const response = await this.executeRequest(url, requestConfig)
      const result = await this.handleResponse<TResponse>(response)
      
      return {
        ...result,
        created: response.status === 201 ? {
          id: this.extractResourceId(response),
          createdAt: new Date().toISOString(),
          location: response.headers.get('Location') ?? undefined,
        } : undefined,
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Type-safe PUT request
   */
  async put<TBody = unknown, TResponse = unknown>(
    endpoint: string,
    params: UpdateRequestParams<TBody>
  ): Promise<UpdateResponse<TResponse>> {
    try {
      const url = this.buildUrl(endpoint)
      const requestConfig = await this.buildRequestConfig('PUT', params)

      const response = await this.executeRequest(url, requestConfig)
      const result = await this.handleResponse<TResponse>(response)
      
      return {
        ...result,
        updated: {
          id: this.extractResourceId(response),
          updatedAt: new Date().toISOString(),
          changedFields: this.extractChangedFields(params.body),
        },
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Type-safe PATCH request
   */
  async patch<TBody = unknown, TResponse = unknown>(
    endpoint: string,
    params: UpdateRequestParams<TBody>
  ): Promise<UpdateResponse<TResponse>> {
    try {
      const url = this.buildUrl(endpoint)
      const requestConfig = await this.buildRequestConfig('PATCH', params)

      const response = await this.executeRequest(url, requestConfig)
      const result = await this.handleResponse<TResponse>(response)
      
      return {
        ...result,
        updated: {
          id: this.extractResourceId(response),
          updatedAt: new Date().toISOString(),
          changedFields: this.extractChangedFields(params.body),
        },
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Type-safe DELETE request
   */
  async delete(
    endpoint: string,
    params?: DeleteRequestParams
  ): Promise<DeleteResponse> {
    try {
      const url = this.buildUrl(endpoint)
      const requestConfig = await this.buildRequestConfig('DELETE', params)

      const response = await this.executeRequest(url, requestConfig)
      const result = await this.handleResponse<null>(response)
      
      return {
        ...result,
        deleted: {
          id: this.extractResourceId(response),
          deletedAt: new Date().toISOString(),
          softDelete: params?.options?.soft ?? false,
        },
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * File upload with type safety
   */
  async upload(
    endpoint: string,
    file: File,
    params?: Parameters<ApiClient['upload']>[2]
  ): Promise<FileUploadResponse> {
    try {
      const url = this.buildUrl(endpoint)
      const formData = new FormData()
      formData.append('file', file)

      const requestConfig: RequestInit = {
        method: 'POST',
        body: formData,
        headers: {
          ...this.config.defaultHeaders,
          ...params?.headers,
        },
        signal: params?.signal,
      }

      // Remove Content-Type for FormData
      delete (requestConfig.headers as Record<string, string>)['Content-Type']

      const response = await this.executeRequest(url, requestConfig)
      return await this.handleResponse(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  private buildUrl(endpoint: string, queryParams?: Record<string, unknown>): string {
    const baseUrl = this.config.baseUrl.replace(/\/$/, '')
    const cleanEndpoint = endpoint.replace(/^\//, '')
    let url = `${baseUrl}/${cleanEndpoint}`

    if (queryParams && Object.keys(queryParams).length > 0) {
      const searchParams = new URLSearchParams()
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, String(v)))
          } else {
            searchParams.append(key, String(value))
          }
        }
      })
      url += `?${searchParams.toString()}`
    }

    return url
  }

  private async buildRequestConfig(
    method: string,
    params?: Parameters<TypedApiClient['get']>[1]
  ): Promise<RequestInit> {
    // eslint-disable-next-line prefer-const
    let config: RequestInit = {
      method,
      headers: {
        ...this.config.defaultHeaders,
        ...params?.headers,
      },
      signal: params?.signal,
    }

    // Apply request interceptor
    if (this.config.interceptors.request) {
      const interceptedParams = await this.config.interceptors.request(params ?? {})
      config.headers = {
        ...config.headers,
        ...interceptedParams.headers,
      }
    }

    // Add body for POST/PUT/PATCH requests
    if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && 
        'body' in (params ?? {}) && (params as { body?: unknown }).body) {
      config.body = JSON.stringify((params as { body: unknown }).body)
    }

    return config
  }

  private async executeRequest(url: string, config: RequestInit): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      // Combine signals if provided
      if (config.signal) {
        const combinedSignal = this.combineSignals(config.signal, controller.signal)
        config.signal = combinedSignal
      } else {
        config.signal = controller.signal
      }

      const response = await fetch(url, config)
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw createApiError('REQUEST_TIMEOUT', 'Request timed out', {
            status: 408,
            context: { url, timeout: this.config.timeout },
          })
        }
        throw createApiError('NETWORK_ERROR', error.message, {
          status: 0,
          context: { url, originalError: error.message },
        })
      }
      
      throw createApiError('UNKNOWN_ERROR', 'An unknown error occurred', {
        context: { url },
      })
    }
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const contentType = response.headers.get('content-type')
      let data: T

      if (contentType?.includes('application/json')) {
        data = await response.json()
      } else if (contentType?.includes('text/')) {
        data = await response.text() as unknown as T
      } else {
        data = await response.blob() as unknown as T
      }

      const result = createApiResponse(data, {
        meta: {
          processingTime: this.getProcessingTime(response),
          version: response.headers.get('API-Version') ?? undefined,
          timestamp: new Date().toISOString(),
          requestId: response.headers.get('X-Request-ID') ?? undefined,
        },
      })

      // Apply response interceptor
      if (this.config.interceptors.response) {
        return await this.config.interceptors.response(result) as ApiResponse<T>
      }

      return result
    } catch (error) {
      throw createApiError('RESPONSE_PARSE_ERROR', 'Failed to parse response', {
        status: response.status,
        context: { error: error instanceof Error ? error.message : 'Unknown parsing error' },
      })
    }
  }

  private handleError<T = unknown>(error: unknown): ApiResponse<T> {
    let apiError: ApiError

    if (isApiError(error)) {
      apiError = error
    } else if (error instanceof Error) {
      apiError = createApiError('CLIENT_ERROR', error.message, {
        context: { stack: error.stack },
      })
    } else {
      apiError = createApiError('UNKNOWN_ERROR', 'An unknown error occurred', {
        context: { error: String(error) },
      })
    }

    // Apply error interceptor
    if (this.config.interceptors.error) {
      Promise.resolve(this.config.interceptors.error(apiError)).catch(interceptorError => {
        logger.error('Error interceptor failed:', { data: interceptorError })
      })
    }

    logger.error('API request failed:', { data: apiError })
    return createErrorResponse(apiError)
  }

  private extractResourceId(response: Response): string {
    const location = response.headers.get('Location')
    if (location) {
      const match = location.match(/\/([^/]+)$/)
      if (match) return match[1]
    }
    return 'unknown'
  }

  private extractChangedFields(body: unknown): string[] {
    if (typeof body === 'object' && body !== null) {
      return Object.keys(body)
    }
    return []
  }

  private getProcessingTime(response: Response): number | undefined {
    const processingTime = response.headers.get('X-Processing-Time')
    return processingTime ? parseInt(processingTime, 10) : undefined
  }

  private combineSignals(signal1: AbortSignal, signal2: AbortSignal): AbortSignal {
    const controller = new AbortController()
    
    const abort = () => controller.abort()
    signal1.addEventListener('abort', abort)
    signal2.addEventListener('abort', abort)
    
    return controller.signal
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Convert database result to API response
 */
export function databaseToApiResponse<T>(result: DatabaseResult<T>): ApiResponse<T> {
  if (result.error) {
    return createErrorResponse(createApiError(
      'DATABASE_ERROR',
      result.error.message,
      {
        details: result.error.details,
        context: { hint: result.error.hint },
      }
    ))
  }

  return createApiResponse(result.data, {
    message: 'Database operation completed successfully',
  })
}

/**
 * Type guard for successful API response
 */
export function isSuccessfulResponse<T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { success: true; data: T } {
  return response.success && response.data !== null
}

/**
 * Extract data from API response with type safety
 */
export function extractData<T>(response: ApiResponse<T>): T {
  if (!isSuccessfulResponse(response)) {
    throw new Error(response.error?.message ?? 'API request failed')
  }
  return response.data
}

/**
 * Create default API client configuration
 */
export function createDefaultApiConfig(baseUrl: string): ApiClientConfig {
  return {
    baseUrl,
    defaultHeaders: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    timeout: 10000,
    retry: {
      attempts: 3,
      delay: 1000,
      conditions: ['network_error', 'timeout'],
    },
  }
}

// =====================================================
// DEFAULT CLIENTS
// =====================================================

/**
 * Default API client instance
 */
export const apiClient = new TypedApiClient(
  createDefaultApiConfig(process.env.NEXT_PUBLIC_API_URL || '/api')
)

/**
 * Internal API client for server-side operations
 */
export const internalApiClient = new TypedApiClient(
  createDefaultApiConfig(process.env.INTERNAL_API_URL || 'http://localhost:3000/api')
)

// =====================================================
// TYPED API ENDPOINTS
// =====================================================

/**
 * Organization API endpoints with type safety
 */
export const organizationApi = {
  list: (params?: GetRequestParams) => 
    apiClient.get<TableRow<'organizations'>[]>('/organizations', params),
    
  get: (id: string) => 
    apiClient.get<TableRow<'organizations'>>(`/organizations/${id}`),
    
  create: (data: TableInsert<'organizations'>) => 
    apiClient.post<TableInsert<'organizations'>, TableRow<'organizations'>>('/organizations', { body: data }),
    
  update: (id: string, data: TableUpdate<'organizations'>) => 
    apiClient.patch<TableUpdate<'organizations'>, TableRow<'organizations'>>(`/organizations/${id}`, { body: data }),
    
  delete: (id: string) => 
    apiClient.delete(`/organizations/${id}`),
}

/**
 * User API endpoints with type safety
 */
export const userApi = {
  profile: () => 
    apiClient.get<TableRow<'profiles'>>('/user/profile'),
    
  updateProfile: (data: TableUpdate<'profiles'>) => 
    apiClient.patch<TableUpdate<'profiles'>, TableRow<'profiles'>>('/user/profile', { body: data }),
    
  preferences: () =>
    apiClient.get<UserPreferencesRow>('/user/preferences'),

  updatePreferences: (data: UserPreferencesUpdate) =>
    apiClient.patch<UserPreferencesUpdate, UserPreferencesRow>('/user/preferences', { body: data }),
}

// Export types for external use
// Note: TypedApiClient class is already exported above, no need for type re-export
export type { 
  ApiResponse, 
  ApiError, 
  GetRequestParams, 
  PostRequestParams, 
  UpdateRequestParams, 
  DeleteRequestParams,
} from '@/types/api.types'

// Import table types
import type { TableRow, TableInsert, TableUpdate } from '@/types/database.types'