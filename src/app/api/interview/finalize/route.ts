/**
 * Next.js Route Handler - AI Interview Finalize
 * Edge Function連携パターン例
 * 
 * Supabase Assistant 回答準拠 (Q19):
 * - ユーザーJWTのBearer認証
 * - Idempotency-Key の付与
 * - Edge Functions への適切な呼び出し
 * - エラーハンドリングの統一
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { recordContractViolationAsync, ContractViolationHelpers } from '@/lib/contract-violations';

// ============================================
// リクエスト/レスポンス型定義
// ============================================

const FinalizeRequestSchema = z.object({
  interview_id: z.string().uuid('Invalid interview ID format'),
  organization_id: z.string().uuid('Invalid organization ID format'),
  finalize_reason: z.string().min(1).max(500, 'Reason too long'),
  send_notification: z.boolean().optional().default(false),
  metadata: z.record(z.any()).optional()
});

type FinalizeRequest = z.infer<typeof FinalizeRequestSchema>;

// Edge Function のレスポンス型
interface EdgeFunctionResponse {
  success: boolean;
  interview_id?: string;
  finalized_at?: string;
  summary?: {
    total_questions: number;
    completion_rate: number;
    duration_minutes: number;
  };
  notifications_sent?: boolean;
  error?: string;
  code?: string;
}

// ============================================
// POST Handler
// ============================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // ============================================
    // 1. Next.js での認証確認 (Q19)
    // ============================================
    
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session?.access_token) {
      console.log('Authentication failed in Next.js Route', { error: authError?.message });
      return NextResponse.json(
        { success: false, error: 'Authentication required', code: 'UNAUTHENTICATED' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userJWT = session.access_token;

    // ============================================
    // 2. リクエストボディ検証
    // ============================================
    
    let requestBody: FinalizeRequest;
    try {
      const rawBody = await request.json();
      requestBody = FinalizeRequestSchema.parse(rawBody);
    } catch (error) {
      // Contract 違反を記録 (Zod バリデーションエラー)
      if (error instanceof z.ZodError) {
        const violation = ContractViolationHelpers.fromZodError(
          error,
          '/api/interview/finalize',
          'ai_interviews',
          request,
          'api'
        );
        
        // 非同期でバックグラウンド記録 (レスポンスをブロックしない)
        recordContractViolationAsync(violation);
      }
      
      console.log('Request validation failed', { 
        error: error instanceof z.ZodError ? error.errors : error 
      });
      return NextResponse.json(
        { success: false, error: 'Invalid request format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // ユーザー認証の整合性チェック (追加のセキュリティ)
    if (requestBody.organization_id) {
      // 組織メンバーシップ確認をここで行うことも可能
      // (Edge Function でも確認するが、二重チェック)
    }

    // ============================================
    // 3. Idempotency Key 生成・取得 (Q19)
    // ============================================
    
    let idempotencyKey = request.headers.get('idempotency-key');
    if (!idempotencyKey) {
      // クライアントが指定しなかった場合は自動生成
      idempotencyKey = `interview-finalize-${requestBody.interview_id}-${Date.now()}`;
    }

    // ============================================
    // 4. Edge Function 呼び出し (Q19)
    // ============================================
    
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/example-finalize`;
    
    const edgeRequestHeaders = {
      'Authorization': `Bearer ${userJWT}`, // ユーザーJWT
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
      'X-Request-Source': 'nextjs-route-handler',
      'X-Client-Info': 'nextjs/14',
      'X-Request-ID': crypto.randomUUID(),
      'User-Agent': request.headers.get('user-agent') || 'nextjs-route-handler'
    };

    const edgeRequestBody = {
      ...requestBody,
      // 追加のメタデータ
      metadata: {
        ...requestBody.metadata,
        initiated_from: 'web-console',
        next_route: '/api/interview/finalize',
        client_timestamp: new Date().toISOString(),
        user_id: userId // 明示的にユーザーID含める
      }
    };

    console.log('Calling Edge Function', {
      url: edgeFunctionUrl,
      interview_id: requestBody.interview_id,
      organization_id: requestBody.organization_id,
      user_id: userId,
      idempotency_key: idempotencyKey
    });

    // Edge Function呼び出し
    const edgeResponse = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: edgeRequestHeaders,
      body: JSON.stringify(edgeRequestBody)
    });

    const latencyMs = Date.now() - startTime;

    // ============================================
    // 5. Edge Function レスポンス処理
    // ============================================
    
    let edgeData: EdgeFunctionResponse;
    try {
      edgeData = await edgeResponse.json();
    } catch (error) {
      console.error('Failed to parse Edge Function response', {
        status: edgeResponse.status,
        statusText: edgeResponse.statusText,
        error: error.message
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Edge Function response parsing failed',
          code: 'EDGE_RESPONSE_ERROR',
          interview_id: requestBody.interview_id
        },
        { status: 502 }
      );
    }

    // Edge Function エラーレスポンス処理
    if (!edgeResponse.ok) {
      console.error('Edge Function returned error', {
        status: edgeResponse.status,
        statusText: edgeResponse.statusText,
        data: edgeData,
        latency_ms: latencyMs
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: edgeData.error || `Edge Function failed with status ${edgeResponse.status}`,
          code: edgeData.code || 'EDGE_FUNCTION_ERROR',
          interview_id: edgeData.interview_id || requestBody.interview_id
        },
        { status: edgeResponse.status }
      );
    }

    // ============================================
    // 6. 成功レスポンス
    // ============================================
    
    console.log('Interview finalization successful', {
      interview_id: requestBody.interview_id,
      organization_id: requestBody.organization_id,
      user_id: userId,
      latency_ms: latencyMs,
      notifications_sent: edgeData.notifications_sent,
      edge_success: edgeData.success
    });

    return NextResponse.json({
      success: true,
      interview_id: edgeData.interview_id,
      finalized_at: edgeData.finalized_at,
      summary: edgeData.summary,
      notifications_sent: edgeData.notifications_sent || false,
      latency_ms: latencyMs
    });

  } catch (error) {
    const latencyMs = Date.now() - startTime;
    
    console.error('Next.js Route Handler error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      latency_ms: latencyMs
    });

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

// ============================================
// GET Handler (Optional: ステータス確認用)
// ============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const interviewId = searchParams.get('interview_id');

  if (!interviewId) {
    return NextResponse.json(
      { error: 'interview_id parameter required' },
      { status: 400 }
    );
  }

  try {
    // 認証確認 (GETでも必要)
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // インタビューステータス確認 (RLS適用下で)
    // ai_interviews → ai_interview_sessions に移行済み
    const { data: interview, error } = await supabase
      .from('ai_interview_sessions')
      .select('id, status, finalized_at, finalized_by')
      .eq('id', interviewId)
      .eq('created_by', session.user.id) // 作成者のみ参照可能
      .single();

    if (error) {
      console.error('Failed to fetch interview status', { error: error.message });
      return NextResponse.json(
        { error: 'Interview not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      interview_id: interview.id,
      status: interview.status,
      finalized_at: interview.finalized_at,
      finalized_by: interview.finalized_by,
      is_finalized: interview.status === 'finalized'
    });

  } catch (error) {
    console.error('GET handler error', { error: error.message });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/*
============================================
クライアント側での使用例 (React Component):
============================================

```typescript
// components/InterviewFinalizeButton.tsx
import { useState } from 'react';

interface Props {
  interviewId: string;
  organizationId: string;
}

export function InterviewFinalizeButton({ interviewId, organizationId }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleFinalize = async () => {
    setIsLoading(true);
    
    try {
      const idempotencyKey = `finalize-${interviewId}-${Date.now()}`;
      
      const response = await fetch('/api/interview/finalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({
          interview_id: interviewId,
          organization_id: organizationId,
          finalize_reason: 'User requested finalization',
          send_notification: true
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('Interview finalized', result);
        // UI更新・通知表示等
      } else {
        console.error('Finalization failed', result.error);
        // エラー処理
      }
      
    } catch (error) {
      console.error('Request failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handleFinalize} 
      disabled={isLoading}
    >
      {isLoading ? 'Finalizing...' : 'Finalize Interview'}
    </button>
  );
}
```

============================================
環境変数設定 (.env.local):
============================================

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

============================================
使用時の注意点:
============================================

1. Idempotency-Keyは必ず指定する (重複実行防止)
2. organization_idを含めてテナント分離を確保
3. エラーハンドリングはEdge FunctionとNext.js両方で行う
4. ログ出力でトレーサビリティを確保
5. セッション有効期限に注意 (自動リフレッシュ推奨)
*/