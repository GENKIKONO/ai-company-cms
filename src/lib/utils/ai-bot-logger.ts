/**
 * AI Bot Access Logger
 * AI Botのアクセスをデータベースに記録
 */

import { supabaseServer } from '@/lib/supabase-server';
import { extractBotInfoFromHeaders, extractClientIP, shouldLogBot } from './ai-bot-detector';
import { logger } from '@/lib/log';

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
    logger.info('🤖 [AI Bot Logger] Starting bot access logging', { data: { url, orgId, responseStatus, requestMethod } });
    
    const botInfo = extractBotInfoFromHeaders(headers);
    logger.info('🤖 [AI Bot Logger] Bot detection result:', { data: botInfo });
    
    // AI Botでない場合はログしない
    if (!shouldLogBot(botInfo)) {
      logger.info('❌ [AI Bot Logger] Bot should not be logged (not AI category or not a bot)');
      return;
    }
    
    logger.info('✅ [AI Bot Logger] Bot should be logged, proceeding...');

    const userAgent = (typeof headers.get === 'function' ? headers.get('user-agent') : '') || '';
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
    logger.warn('Failed to log AI bot access', { data: { error, url, orgId } });
  }
}

/**
 * Bot Log をDBに挿入
 */
async function insertBotLog(entry: BotLogEntry): Promise<void> {
  logger.info('💾 [AI Bot Logger] Inserting bot log entry:', { data: entry });
  
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from('ai_bot_logs')
    .insert({
      organization_id: entry.orgId,
      url: entry.url,
      bot_name: entry.botName,
      user_agent: entry.userAgent,
      ip_address: entry.ipAddress,
      request_method: entry.requestMethod,
      response_status: entry.responseStatus,
      content_unit_id: entry.contentUnitId,
    });

  if (error) {
    logger.error('❌ [AI Bot Logger] Database insert failed:', { data: error });
    throw new Error(`Failed to insert bot log: ${error.message}`);
  }
  
  logger.info('✅ [AI Bot Logger] Successfully inserted bot log:', { data: data });
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
      .eq('organization_id', orgId)
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
        organization_id: orgId,
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
    logger.warn('Failed to ensure content unit', { data: { error, orgId, url } });
    return null;
  }
}