/**
 * テストユーティリティ
 * 要件定義準拠: 自動テスト体制強化、品質保証
 * 
 * NOTE: このファイルはテスト環境でのみ使用されます
 */

import React from 'react';

// テスト環境でのみ動作する条件分岐
let render: any, screen: any, fireEvent: any, waitFor: any, userEvent: any, jest: any, logger: any, errorMonitor: any;

if (process.env.NODE_ENV === 'test') {
  // テストライブラリのインポートはテスト環境でのみ
  ({ render, screen, fireEvent, waitFor } = require('@testing-library/react'));
  userEvent = require('@testing-library/user-event');
  ({ jest } = require('@jest/globals'));
  ({ logger, errorMonitor } = require('@/lib/monitoring'));
} else {
  // 本番環境では空のモック
  render = () => null;
  screen = {};
  fireEvent = {};
  waitFor = () => Promise.resolve();
  userEvent = {};
  jest = { fn: () => () => null };
  logger = { info: () => null, warn: () => null, error: () => null };
  errorMonitor = { captureError: () => null };
}

// モック関数作成ヘルパー
export const createMockFunction = <T extends (...args: any[]) => any>(
  implementation?: T
): jest.MockedFunction<T> => {
  return jest.fn(implementation) as jest.MockedFunction<T>;
};

// API レスポンスモック
export const createMockApiResponse = <T>(
  data: T,
  options: {
    status?: number;
    delay?: number;
    shouldFail?: boolean;
  } = {}
): Promise<Response> => {
  const { status = 200, delay = 0, shouldFail = false } = options;

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error('API request failed'));
        return;
      }

      const response = new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });

      resolve(response);
    }, delay);
  });
};

// フォームテストヘルパー
export const fillForm = async (formData: Record<string, string>) => {
  const user = userEvent.setup();

  for (const [fieldName, value] of Object.entries(formData)) {
    const field = screen.getByLabelText(new RegExp(fieldName, 'i'));
    await user.clear(field);
    await user.type(field, value);
  }
};

export const submitForm = async (buttonText = '送信') => {
  const user = userEvent.setup();
  const submitButton = screen.getByRole('button', { name: new RegExp(buttonText, 'i') });
  await user.click(submitButton);
};

// エラーバウンダリテストヘルパー
interface TestErrorBoundaryProps {
  children: React.ReactNode;
}

export const TestErrorBoundary = ({ children }: TestErrorBoundaryProps) => {
  return React.createElement(
    'div',
    { 'data-testid': 'error-boundary' },
    children
  );
};

export const triggerComponentError = (component: React.ReactElement) => {
  const ThrowError = () => {
    throw new Error('Test error');
  };

  return render(
    React.createElement(
      TestErrorBoundary,
      null,
      React.createElement(ThrowError)
    )
  );
};

// 非同期操作テストヘルパー
export const waitForLoadingToFinish = async () => {
  if (process.env.NODE_ENV === 'test') {
    await waitFor(() => {
      (expect(screen.queryByText(/読み込み中/i)) as any).not.toBeInTheDocument();
    });
  }
};

export const waitForErrorToAppear = async (errorMessage: string) => {
  if (process.env.NODE_ENV === 'test') {
    await waitFor(() => {
      (expect(screen.getByText(new RegExp(errorMessage, 'i'))) as any).toBeInTheDocument();
    });
  }
};

// ローカルストレージモック
export const createLocalStorageMock = () => {
  const store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
};

// セッションストレージモック
export const createSessionStorageMock = createLocalStorageMock;

// Next.js router モック
export const createMockRouter = (overrides: Partial<any> = {}) => ({
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  route: '/',
  ...overrides,
});

// Supabase クライアントモック
export const createMockSupabaseClient = () => {
  const mockSelect = jest.fn().mockReturnThis();
  const mockInsert = jest.fn().mockReturnThis();
  const mockUpdate = jest.fn().mockReturnThis();
  const mockDelete = jest.fn().mockReturnThis();
  const mockFrom = jest.fn().mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  });

  return {
    from: mockFrom,
    auth: {
      getSession: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
    },
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn(),
        download: jest.fn(),
        remove: jest.fn(),
      }),
    },
  };
};

// 監視システムモック
export const createMockMonitoring = () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  const mockErrorMonitor = {
    captureError: jest.fn(),
    getErrorStats: jest.fn().mockReturnValue({}),
    resetStats: jest.fn(),
  };

  return { mockLogger, mockErrorMonitor };
};

// テスト環境セットアップ
export const setupTestEnvironment = () => {
  // ローカルストレージモック
  Object.defineProperty(window, 'localStorage', {
    value: createLocalStorageMock(),
  });

  // セッションストレージモック
  Object.defineProperty(window, 'sessionStorage', {
    value: createSessionStorageMock(),
  });

  // matchMedia モック
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // IntersectionObserver モック
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  // ResizeObserver モック
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  // console メソッドをモック（テスト出力をクリーンに保つ）
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
};

// テスト後クリーンアップ
export const cleanupTestEnvironment = () => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
};

// パフォーマンステスト用
export const measureRenderTime = async (component: React.ReactElement) => {
  const start = performance.now();
  render(component);
  const end = performance.now();
  
  return {
    renderTime: end - start,
    isAcceptable: (end - start) < 100, // 100ms以下を目標
  };
};

// アクセシビリティテスト用
export const checkAccessibility = async (container: HTMLElement) => {
  const issues: string[] = [];

  // 基本的なアクセシビリティチェック
  const elementsWithoutAlt = container.querySelectorAll('img:not([alt])');
  if (elementsWithoutAlt.length > 0) {
    issues.push(`${elementsWithoutAlt.length} images without alt attributes`);
  }

  const buttonsWithoutLabel = container.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
  if (buttonsWithoutLabel.length > 0) {
    issues.push(`${buttonsWithoutLabel.length} buttons without labels`);
  }

  const inputsWithoutLabel = container.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
  if (inputsWithoutLabel.length > 0) {
    issues.push(`${inputsWithoutLabel.length} inputs without labels`);
  }

  return {
    hasIssues: issues.length > 0,
    issues,
  };
};

// データベーステスト用ヘルパー
export const createTestData = {
  organization: (overrides: any = {}) => ({
    id: 'test-org-id',
    name: 'Test Organization',
    slug: 'test-org',
    description: 'Test organization description',
    created_at: new Date().toISOString(),
    ...overrides,
  }),
  
  user: (overrides: any = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: { role: 'user' },
    created_at: new Date().toISOString(),
    ...overrides,
  }),
  
  service: (overrides: any = {}) => ({
    id: 'test-service-id',
    name: 'Test Service',
    description: 'Test service description',
    organization_id: 'test-org-id',
    created_at: new Date().toISOString(),
    ...overrides,
  }),
};

// エラーテスト用
export const createTestError = (message: string, code?: string) => {
  const error = new Error(message);
  if (code) {
    (error as any).code = code;
  }
  return error;
};

// E2E テスト用ヘルパー
export const e2eHelpers = {
  waitForPageLoad: () => waitFor(() => expect(document.readyState).toBe('complete')),
  
  clickAndWaitForNavigation: async (element: HTMLElement) => {
    fireEvent.click(element);
    await waitFor(() => {
      // ナビゲーション完了を待つ
    });
  },
  
  fillFormAndSubmit: async (formData: Record<string, string>, submitButtonText = '送信') => {
    await fillForm(formData);
    await submitForm(submitButtonText);
  },
};