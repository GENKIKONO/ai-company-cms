/**
 * バリデーション関連の型ユーティリティ
 * zod等のバリデーションライブラリと組み合わせて使用
 */

// バリデーション結果の型
export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: ValidationError[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
  value?: unknown
}

// フィールドバリデーションルール
export interface FieldValidationRule {
  field: string
  required?: boolean
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date' | 'email' | 'url'
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  custom?: (value: unknown) => boolean
  customMessage?: string
}

// スキーマバリデーション
export interface ValidationSchema {
  name: string
  version: string
  rules: FieldValidationRule[]
}

// 型ガード用のユーティリティ
export type TypeGuard<T> = (value: unknown) => value is T

// よく使用される型ガード
export const isString: TypeGuard<string> = (value): value is string => {
  return typeof value === 'string'
}

export const isNumber: TypeGuard<number> = (value): value is number => {
  return typeof value === 'number' && !isNaN(value)
}

export const isBoolean: TypeGuard<boolean> = (value): value is boolean => {
  return typeof value === 'boolean'
}

export const isArray: TypeGuard<unknown[]> = (value): value is unknown[] => {
  return Array.isArray(value)
}

export const isObject: TypeGuard<Record<string, unknown>> = (value): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export const isStringArray: TypeGuard<string[]> = (value): value is string[] => {
  return isArray(value) && value.every(isString)
}

export const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.length > 0
}

// JsonObject 型ガード（isObject のエイリアス）
export const isJsonObject = isObject

export const isNumberArray: TypeGuard<number[]> = (value): value is number[] => {
  return isArray(value) && value.every(isNumber)
}

// UUID検証
export const isUUID = (value: unknown): value is string => {
  if (!isString(value)) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

// Email検証
export const isEmail = (value: unknown): value is string => {
  if (!isString(value)) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(value)
}

// URL検証
export const isURL = (value: unknown): value is string => {
  if (!isString(value)) return false
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

// 日付検証
export const isISODate = (value: unknown): value is string => {
  if (!isString(value)) return false
  const date = new Date(value)
  return !isNaN(date.getTime()) && value === date.toISOString()
}

// Enum検証のヘルパー
export function createEnumValidator<T extends readonly string[]>(
  enumValues: T
): TypeGuard<T[number]> {
  return (value: unknown): value is T[number] => {
    return isString(value) && enumValues.includes(value)
  }
}

// 必須フィールド検証
export function validateRequired<T>(
  value: T | null | undefined,
  fieldName: string
): ValidationResult<NonNullable<T>> {
  if (value === null || value === undefined || value === '') {
    return {
      success: false,
      errors: [{
        field: fieldName,
        message: `${fieldName} is required`,
        code: 'REQUIRED'
      }]
    }
  }
  
  return {
    success: true,
    data: value as NonNullable<T>
  }
}

// 配列の検証
export function validateArray<T>(
  value: unknown,
  itemValidator: TypeGuard<T>,
  fieldName: string,
  options?: { minLength?: number; maxLength?: number }
): ValidationResult<T[]> {
  if (!isArray(value)) {
    return {
      success: false,
      errors: [{
        field: fieldName,
        message: `${fieldName} must be an array`,
        code: 'INVALID_TYPE'
      }]
    }
  }

  if (options?.minLength && value.length < options.minLength) {
    return {
      success: false,
      errors: [{
        field: fieldName,
        message: `${fieldName} must have at least ${options.minLength} items`,
        code: 'MIN_LENGTH'
      }]
    }
  }

  if (options?.maxLength && value.length > options.maxLength) {
    return {
      success: false,
      errors: [{
        field: fieldName,
        message: `${fieldName} must have at most ${options.maxLength} items`,
        code: 'MAX_LENGTH'
      }]
    }
  }

  const errors: ValidationError[] = []
  const validItems: T[] = []

  value.forEach((item, index) => {
    if (itemValidator(item)) {
      validItems.push(item)
    } else {
      errors.push({
        field: `${fieldName}[${index}]`,
        message: `Invalid item at index ${index}`,
        code: 'INVALID_ITEM'
      })
    }
  })

  if (errors.length > 0) {
    return {
      success: false,
      errors
    }
  }

  return {
    success: true,
    data: validItems
  }
}