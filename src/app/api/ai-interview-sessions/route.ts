/**
 * P1-2 Enum Migration対応 - AI Interview Sessions API
 * 
 * Feature Flag統合により段階的enum移行をサポート
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserFullWithClient } from '@/lib/core/auth-state'
import { InterviewSessionService } from '@/lib/utils/enum-migration-helpers'
import { logContractViolation } from '@/lib/utils/contract-violations'
import { logger } from '@/lib/utils/logger'
import { z } from 'zod'

// P1-2: 型安全なスキーマ定義（enum対応）
const InterviewSessionCreateSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'failed']),
  content_type: z.enum(['text', 'video', 'audio', 'structured']),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  organization_id: z.string().uuid().optional()
})

const InterviewSessionUpdateSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'failed']).optional(),
  content_type: z.enum(['text', 'video', 'audio', 'structured']).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    // 認証（Core経由、user_metadataを含む完全版）
    const user = await getUserFullWithClient(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // P1-2: Feature Flag対応での読み取り
    const sessionService = new InterviewSessionService({
      userId: user.id,
      organizationId: user.user_metadata?.organization_id as string | undefined
    })

    const { data: sessions, error } = await supabase
      .from('ai_interview_sessions')
      .select('id, user_id, organization_id, title, description, status, content_type, created_at, updated_at')
      .eq('user_id', user.id)

    if (error) {
      await logContractViolation({
        source: 'api',
        endpoint: '/api/ai-interview-sessions',
        table_name: 'ai_interview_sessions',
        column_name: 'query',
        violation_type: 'OTHER',
        payload: { error: error.message },
        actor_user_id: user.id
      })
      throw error
    }

    // P1-2: Feature Flag対応でのenum値安全読み取り
    const processedSessions = await Promise.all(
      (sessions || []).map(async (session) => ({
        ...session,
        status: await sessionService.readStatus(session.status),
        content_type: await sessionService.readContentType(session.content_type)
      }))
    )

    return NextResponse.json({ sessions: processedSessions })

  } catch (error) {
    logger.error('AI Interview Sessions GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    // 認証（Core経由、user_metadataを含む完全版）
    const user = await getUserFullWithClient(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // P1-2: 型安全な入力検証
    const validationResult = InterviewSessionCreateSchema.safeParse(body)
    if (!validationResult.success) {
      await logContractViolation({
        source: 'api',
        endpoint: '/api/ai-interview-sessions',
        table_name: 'ai_interview_sessions',
        column_name: 'validation',
        violation_type: 'FORMAT_INVALID',
        payload: {
          errors: validationResult.error.errors,
          input: body
        },
        actor_user_id: user.id
      })

      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const validData = validationResult.data

    // P1-2: Feature Flag対応での書き込み
    const sessionService = new InterviewSessionService({
      userId: user.id,
      organizationId: validData.organization_id || (user.user_metadata?.organization_id as string | undefined)
    })

    const statusData = await sessionService.writeStatus(validData.status)
    const contentTypeData = await sessionService.writeContentType(validData.content_type)

    // P1-2: enum移行対応のInsertデータ構築
    const insertData = {
      user_id: user.id,
      organization_id: validData.organization_id || (user.user_metadata?.organization_id as string | undefined),
      title: validData.title,
      description: validData.description,
      ...statusData,        // status, status_enum_temp (Feature Flag次第)
      ...contentTypeData,   // content_type, content_type_enum_temp (Feature Flag次第)
      created_at: new Date().toISOString()
    }

    const { data: newSession, error } = await supabase
      .from('ai_interview_sessions')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      await logContractViolation({
        source: 'api',
        endpoint: '/api/ai-interview-sessions',
        table_name: 'ai_interview_sessions',
        column_name: 'insert',
        violation_type: 'OTHER',
        payload: { 
          error: error.message, 
          insertData 
        },
        actor_user_id: user.id
      })
      throw error
    }

    // P1-2: 安全な値で返却
    const responseSession = {
      ...newSession,
      status: await sessionService.readStatus(newSession.status),
      content_type: await sessionService.readContentType(newSession.content_type)
    }

    return NextResponse.json({ session: responseSession }, { status: 201 })

  } catch (error) {
    logger.error('AI Interview Sessions POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    // 認証（Core経由、user_metadataを含む完全版）
    const user = await getUserFullWithClient(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateFields } = body

    if (!id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // P1-2: 型安全な更新検証
    const validationResult = InterviewSessionUpdateSchema.safeParse(updateFields)
    if (!validationResult.success) {
      await logContractViolation({
        source: 'api',
        endpoint: '/api/ai-interview-sessions',
        table_name: 'ai_interview_sessions',
        column_name: 'validation',
        violation_type: 'FORMAT_INVALID',
        payload: { 
          errors: validationResult.error.errors,
          input: updateFields 
        },
        actor_user_id: user.id
      })
      
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationResult.error.errors 
      }, { status: 400 })
    }

    const validData = validationResult.data

    // P1-2: Feature Flag対応での更新データ構築
    const sessionService = new InterviewSessionService({ userId: user.id })
    let updateData: any = {}

    if (validData.status) {
      const statusData = await sessionService.writeStatus(validData.status)
      updateData = { ...updateData, ...statusData }
    }

    if (validData.content_type) {
      const contentTypeData = await sessionService.writeContentType(validData.content_type)
      updateData = { ...updateData, ...contentTypeData }
    }

    // その他のフィールド
    if (validData.title) updateData.title = validData.title
    if (validData.description !== undefined) updateData.description = validData.description
    
    updateData.updated_at = new Date().toISOString()

    const { data: updatedSession, error } = await supabase
      .from('ai_interview_sessions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)  // 権限確認
      .select()
      .single()

    if (error) {
      await logContractViolation({
        source: 'api',
        endpoint: '/api/ai-interview-sessions',
        table_name: 'ai_interview_sessions',
        column_name: 'update',
        violation_type: 'OTHER',
        payload: { 
          error: error.message, 
          updateData,
          sessionId: id 
        },
        actor_user_id: user.id
      })
      throw error
    }

    // P1-2: 安全な値で返却
    const responseSession = {
      ...updatedSession,
      status: await sessionService.readStatus(updatedSession.status),
      content_type: await sessionService.readContentType(updatedSession.content_type)
    }

    return NextResponse.json({ session: responseSession })

  } catch (error) {
    logger.error('AI Interview Sessions PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}