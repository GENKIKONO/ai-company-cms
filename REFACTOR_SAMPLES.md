# リファクタリング用サンプルコード

## 1. src/lib/stripe.ts - 価格一元化

```typescript
// BEFORE: ハードコード価格
export const SUBSCRIPTION_PLANS = {
  BASIC: {
    price: 5000, // ❌ 不整合
  }
};

// AFTER: 設定参照
import { PLAN_PRICES, PLAN_NAMES } from '@/config/plans';

export const SUBSCRIPTION_PLANS = {
  BASIC: {
    id: 'starter',
    name: PLAN_NAMES.starter,
    price: PLAN_PRICES.starter, // ✅ 2980円
    // ...
  },
  BUSINESS: {
    id: 'business', 
    name: PLAN_NAMES.business,
    price: PLAN_PRICES.business, // ✅ 15000円
    // ...
  }
};
```

## 2. プロダクション Logger ラッパー

```typescript
// src/lib/utils/production-logger.ts
import { type LogLevel } from '@/types/logging';

interface LogContext {
  userId?: string;
  requestId?: string;
  organizationId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

class ProductionLogger {
  private getLogLevel(): LogLevel {
    return (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    const currentLevel = levels[this.getLogLevel()];
    const messageLevel = levels[level];
    return messageLevel <= currentLevel;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version,
      ...context
    };
  }

  error(message: string, error?: Error, context?: LogContext) {
    if (!this.shouldLog('error')) return;
    
    const logData = this.formatMessage('error', message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    });

    console.error(JSON.stringify(logData));
  }

  warn(message: string, context?: LogContext) {
    if (!this.shouldLog('warn')) return;
    console.warn(JSON.stringify(this.formatMessage('warn', message, context)));
  }

  info(message: string, context?: LogContext) {
    if (!this.shouldLog('info')) return;
    console.info(JSON.stringify(this.formatMessage('info', message, context)));
  }

  debug(message: string, context?: LogContext) {
    if (!this.shouldLog('debug')) return;
    console.debug(JSON.stringify(this.formatMessage('debug', message, context)));
  }
}

export const logger = new ProductionLogger();

// 使用例
export function withRequestLogging<T>(
  action: string,
  fn: (context: LogContext) => Promise<T>,
  baseContext?: LogContext
) {
  return async (req: any): Promise<T> => {
    const requestId = crypto.randomUUID();
    const context = {
      requestId,
      action,
      ...baseContext
    };

    logger.info(`${action} started`, context);
    const startTime = Date.now();

    try {
      const result = await fn(context);
      const duration = Date.now() - startTime;
      logger.info(`${action} completed`, { ...context, duration });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`${action} failed`, error as Error, { ...context, duration });
      throw error;
    }
  };
}
```

## 3. API統一エラーハンドリング

```typescript
// src/lib/api/route-wrapper.ts
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/production-logger';
import { handleApiError } from '@/lib/api/error-responses';

type ApiHandler = (req: NextRequest) => Promise<NextResponse>;

export function withApiErrorHandling(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest) => {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    
    try {
      logger.info('API request started', {
        requestId,
        method: req.method,
        url: req.url
      });

      const response = await handler(req);
      
      logger.info('API request completed', {
        requestId,
        method: req.method,
        status: response.status,
        duration: Date.now() - startTime
      });

      return response;
    } catch (error) {
      logger.error('API request failed', error as Error, {
        requestId,
        method: req.method,
        url: req.url,
        duration: Date.now() - startTime
      });

      return handleApiError(error);
    }
  };
}

// 使用例
// app/api/my/organizations/route.ts
export const GET = withApiErrorHandling(async (req) => {
  // ビジネスロジック
  return NextResponse.json({ data });
});
```

## 4. 設定統合実装

```typescript
// src/config/app.ts - 全体設定統合
export const APP_CONFIG = {
  plans: {
    prices: PLAN_PRICES,
    limits: PLAN_LIMITS,
    features: PLAN_FEATURES
  },
  stripe: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
    secretKey: process.env.STRIPE_SECRET_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!
  },
  logging: {
    level: (process.env.LOG_LEVEL as LogLevel) || 'info',
    enableRequestLogging: process.env.NODE_ENV === 'production'
  },
  features: {
    enableMonitoring: process.env.ENABLE_MONITORING === 'true',
    enableABTesting: process.env.ENABLE_AB_TESTING === 'true'
  }
} as const;
```

## 5. JSON-LD動的生成

```typescript
// src/lib/json-ld/pricing-generator.ts
import { PLAN_PRICES, PLAN_NAMES } from '@/config/plans';

export function generatePricingJsonLD() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "AIO Hub",
    "offers": Object.entries(PLAN_PRICES).map(([planType, price]) => ({
      "@type": "Offer",
      "name": PLAN_NAMES[planType as keyof typeof PLAN_NAMES],
      "price": price.toString(),
      "priceCurrency": "JPY"
    }))
  };
}

// app/aio/page.tsx での使用
const pricingJsonLD = generatePricingJsonLD();
```