/**
 * Partition Maintenance Cron Trigger Edge Function
 * P4-7: pg_cron からの HMAC 署名付き HTTP POST を受けて既存の partition-maintenance 関数を内部呼び出し
 * 
 * 機能:
 * 1. HMAC-SHA256 署名検証（X-Signature ヘッダ）
 * 2. タイムスタンプ検証（±10分以内）
 * 3. 既存の partition-maintenance 関数を service_role で内部呼び出し
 * 4. 結果をレスポンスとして返却
 */

import { createEdgeLogger } from '../_shared/logging.ts';

// TypeScript インタフェース定義
interface CronTriggerRequest {
  source: string;
  ts: number;
}

interface CronTriggerResponse {
  ok: boolean;
  triggered_at: string;
  maintenance_result?: any;
  error?: string;
}

// HMAC-SHA256 署名生成
async function generateHmacSignature(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// 固定時間比較（タイミング攻撃対策）
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

// 時刻の許容範囲チェック（現在時刻から ±10分以内）
function isTimestampValid(ts: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  const diff = Math.abs(now - ts);
  const tenMinutes = 10 * 60; // 10分 = 600秒
  return diff <= tenMinutes;
}

// HMAC 署名検証
async function verifyHmacSignature(
  secret: string,
  payload: string,
  providedSignature: string,
  logger: ReturnType<typeof createEdgeLogger>
): Promise<boolean> {
  try {
    // 提供された署名から "sha256=" プレフィックスを除去（存在する場合）
    const cleanSignature = providedSignature.startsWith('sha256=') 
      ? providedSignature.slice(7) 
      : providedSignature;
    
    const expectedSignature = await generateHmacSignature(secret, payload);
    
    const isValid = secureCompare(expectedSignature, cleanSignature);
    
    if (!isValid) {
      logger.warn("HMAC signature verification failed", {
        expected_length: expectedSignature.length,
        provided_length: cleanSignature.length,
        payload_length: payload.length
      });
    }
    
    return isValid;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown HMAC error';
    logger.error("HMAC signature verification error", { error: errorMsg });
    return false;
  }
}

// リクエスト検証
async function validateRequest(
  body: CronTriggerRequest,
  signature: string,
  logger: ReturnType<typeof createEdgeLogger>
): Promise<{ valid: boolean; error?: string }> {
  // 必須フィールドチェック
  if (!body.source || typeof body.ts !== 'number') {
    return { valid: false, error: 'Missing required fields: source, ts' };
  }
  
  // source の値チェック
  if (body.source !== 'pg_cron' && body.source !== 'manual') {
    return { valid: false, error: 'Invalid source. Expected: pg_cron or manual' };
  }
  
  // 時刻の許容範囲チェック
  if (!isTimestampValid(body.ts)) {
    return { valid: false, error: 'Timestamp out of acceptable range (±10 minutes)' };
  }
  
  // HMAC 署名検証
  const secret = Deno.env.get("CRON_HMAC_SECRET");
  if (!secret) {
    logger.error("Missing CRON_HMAC_SECRET environment variable");
    return { valid: false, error: 'Server configuration error' };
  }
  
  if (!signature) {
    return { valid: false, error: 'Missing X-Signature header' };
  }
  
  const payload = JSON.stringify(body);
  const isValidSignature = await verifyHmacSignature(secret, payload, signature, logger);
  
  if (!isValidSignature) {
    return { valid: false, error: 'Invalid HMAC signature' };
  }
  
  return { valid: true };
}

// partition-maintenance 関数の内部呼び出し
async function callPartitionMaintenance(
  logger: ReturnType<typeof createEdgeLogger>
): Promise<{ success: boolean; data?: any; error?: string; status?: number }> {
  const serviceKey = Deno.env.get("SERVICE_ROLE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  
  if (!serviceKey || !supabaseUrl) {
    const error = "Missing required environment variables: SERVICE_ROLE_KEY or SUPABASE_URL";
    logger.error("Environment variable check failed", { error });
    return { success: false, error };
  }
  
  try {
    const url = `${supabaseUrl}/functions/v1/partition-maintenance?create_months=3&retention_months=12&dry_run=false`;
    
    logger.info("Calling partition-maintenance function", {
      url,
      method: 'POST'
    });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    const responseText = await response.text();
    let responseData: any;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      logger.error("Failed to parse partition-maintenance response", {
        status: response.status,
        response_text: responseText,
        parse_error: parseError instanceof Error ? parseError.message : 'Unknown parse error'
      });
      return {
        success: false,
        error: `Invalid JSON response from partition-maintenance: ${responseText}`,
        status: response.status
      };
    }
    
    if (!response.ok) {
      logger.error("partition-maintenance function failed", {
        status: response.status,
        response_data: responseData
      });
      return {
        success: false,
        error: `partition-maintenance returned ${response.status}`,
        status: response.status,
        data: responseData
      };
    }
    
    logger.info("partition-maintenance function succeeded", {
      status: response.status,
      result_summary: {
        function_name: responseData.function_name,
        status: responseData.status,
        duration_ms: responseData.duration_ms,
        created_partitions: responseData.summary?.created_partitions?.length || 0,
        dropped_partitions: responseData.summary?.dropped_partitions?.length || 0,
        errors: responseData.summary?.errors?.length || 0
      }
    });
    
    return { success: true, data: responseData, status: response.status };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown fetch error';
    logger.error("Failed to call partition-maintenance function", { error: errorMsg });
    return { success: false, error: errorMsg };
  }
}

// メインハンドラー
Deno.serve(async (req: Request): Promise<Response> => {
  const logger = createEdgeLogger(req, "partition-maintenance-cron-trigger");
  const triggeredAt = new Date().toISOString();
  
  try {
    if (req.method !== 'POST') {
      logger.warn("Invalid method", { method: req.method });
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // X-Signature ヘッダ取得
    const signature = req.headers.get('X-Signature');
    if (!signature) {
      logger.warn("Missing X-Signature header");
      return new Response(
        JSON.stringify({ error: 'Missing X-Signature header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // リクエストボディの解析
    let requestBody: CronTriggerRequest;
    try {
      const bodyText = await req.text();
      requestBody = JSON.parse(bodyText);
      
      logger.info('Cron trigger request received', {
        source: requestBody.source,
        ts: requestBody.ts,
        request_time: new Date(requestBody.ts * 1000).toISOString(),
        has_signature: !!signature
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown JSON parse error';
      logger.error("Failed to parse request body", { error: errorMsg });
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // リクエスト検証（HMAC + 時刻チェック）
    const validation = await validateRequest(requestBody, signature, logger);
    if (!validation.valid) {
      logger.warn("Request validation failed", { error: validation.error });
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // partition-maintenance 関数呼び出し
    const result = await callPartitionMaintenance(logger);
    
    if (result.success) {
      const response: CronTriggerResponse = {
        ok: true,
        triggered_at: triggeredAt,
        maintenance_result: result.data
      };
      
      logger.info('Cron trigger completed successfully', {
        duration_ms: Date.now() - new Date(triggeredAt).getTime(),
        partition_status: result.data?.status,
        partition_duration_ms: result.data?.duration_ms
      });
      
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      const response: CronTriggerResponse = {
        ok: false,
        triggered_at: triggeredAt,
        error: result.error
      };
      
      logger.error('Cron trigger failed', {
        error: result.error,
        partition_status: result.status,
        duration_ms: Date.now() - new Date(triggeredAt).getTime()
      });
      
      return new Response(JSON.stringify(response), {
        status: result.status || 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Cron trigger function error', { error: errorMsg });
    
    const errorResponse: CronTriggerResponse = {
      ok: false,
      triggered_at: triggeredAt,
      error: errorMsg
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});