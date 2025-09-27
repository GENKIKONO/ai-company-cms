// Jest setup file for Single-Org Mode tests

// Extend Jest matchers
import '@testing-library/jest-dom'

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key'

// Global test timeout
jest.setTimeout(30000) // 30 seconds for API integration tests

// Mock Next.js dynamic imports
jest.mock('next/dynamic', () => {
  return function mockNextDynamic(dynamicFunction, options) {
    const MockedComponent = dynamicFunction()
    return MockedComponent
  }
})

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/test-path',
}))

// Suppress console warnings in tests unless debugging
const originalConsoleWarn = console.warn
const originalConsoleError = console.error

beforeAll(() => {
  if (!process.env.DEBUG_TESTS) {
    console.warn = jest.fn()
    console.error = jest.fn()
  }
})

afterAll(() => {
  console.warn = originalConsoleWarn
  console.error = originalConsoleError
})