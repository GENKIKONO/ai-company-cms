/**
 * AI Bot Access Logger
 * AI Botのアクセスをデータベースに記録
 */

import { supabaseServer } from '@/lib/supabase-server';
import { extractBotInfoFromHeaders, extractClientIP, shouldLogBot } from './ai-bot-detector';
import { logger } from './logger';

export interface BotLogEntry {
  orgId: string;
  url: string;
  botName: string;
  userAgent: string;
  ipAddress?: string | null;
  requestMethod?: string;
  responseStatus?: number;
  contentUnitId?: string | null;
}

/**
 * AI Bot アクセスをDBに記録
 */
export async function logAIBotAccess(
  headers: Headers,
  url: string,
  orgId: string,
  responseStatus: number = 200,
  requestMethod: string = 'GET'
): Promise<void> {
  try {
    console.log('🤖 [AI Bot Logger] Starting bot access logging', { url, orgId, responseStatus, requestMethod });
    
    const botInfo = extractBotInfoFromHeaders(headers);
    console.log('🤖 [AI Bot Logger] Bot detection result:', botInfo);
    
    // AI Botでない場合はログしない
    if (!shouldLogBot(botInfo)) {
      console.log('❌ [AI Bot Logger] Bot should not be logged (not AI category or not a bot)');
      return;
    }
    
    console.log('✅ [AI Bot Logger] Bot should be logged, proceeding...');

    const userAgent = headers.get('user-agent') || '';
    const ipAddress = extractClientIP(headers);

    const logEntry: BotLogEntry = {
      orgId,
      url,
      botName: botInfo.botName!,
      userAgent,
      ipAddress,
      requestMethod,
      responseStatus,
    };

    await insertBotLog(logEntry);
    
    logger.info('AI Bot access logged', {
      botName: botInfo.botName,
      url,
      orgId,
    });

  } catch (error) {
    // ログ失敗は警告として扱い、メイン処理は継続
    logger.warn('Failed to log AI bot access', { error, url, orgId });
  }
}

/**
 * Bot Log をDBに挿入
 */
async function insertBotLog(entry: BotLogEntry): Promise<void> {
  console.log('💾 [AI Bot Logger] Inserting bot log entry:', entry);
  
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from('ai_bot_logs')
    .insert({
      org_id: entry.orgId,
      url: entry.url,
      bot_name: entry.botName,
      user_agent: entry.userAgent,
      ip_address: entry.ipAddress,
      request_method: entry.requestMethod,
      response_status: entry.responseStatus,
      content_unit_id: entry.contentUnitId,
    });

  if (error) {
    console.error('❌ [AI Bot Logger] Database insert failed:', error);
    throw new Error(`Failed to insert bot log: ${error.message}`);
  }
  
  console.log('✅ [AI Bot Logger] Successfully inserted bot log:', data);
}

/**
 * Content Unit ID を取得または作成
 * 既存の構造化データ出力と連携してURL + JSON-LD @id を紐づけ
 */
export async function ensureContentUnit(
  orgId: string,
  url: string,
  contentType: string,
  title?: string,
  description?: string,
  jsonldId?: string
): Promise<string | null> {
  try {
    const supabase = await supabaseServer();

    // 既存のContent Unitを検索
    const { data: existing, error: selectError } = await supabase
      .from('ai_content_units')
      .select('id')
      .eq('org_id', orgId)
      .eq('url', url)
      .eq('jsonld_id', jsonldId || '')
      .single();

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = not found
      throw selectError;
    }

    if (existing) {
      return existing.id;
    }

    // 新規作成
    const { data: created, error: insertError } = await supabase
      .from('ai_content_units')
      .insert({
        org_id: orgId,
        url,
        jsonld_id: jsonldId,
        content_type: contentType,
        title,
        description,
        structured_data_complete: !!title && !!description,
      })
      .select('id')
      .single();

    if (insertError) {
      throw insertError;
    }

    return created.id;

  } catch (error) {
    logger.warn('Failed to ensure content unit', { error, orgId, url });
    return null;
  }
}