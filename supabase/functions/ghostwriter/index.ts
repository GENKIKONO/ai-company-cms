/**
 * Ghostwriter Edge Function - AI自動コンテンツ生成
 * 
 * 機能:
 * - Jina Reader APIでWebページ解析
 * - Gemini Flash APIでコンテンツ生成
 * - データベースへの構造化データ保存
 * 
 * Usage:
 * POST /functions/v1/ghostwriter
 * { "url": "https://example.com", "organization_id": "uuid" }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface GhostwriterRequest {
  url: string;
  organization_id: string;
}

interface OrganizationData {
  name: string;
  description: string;
  address?: string;
  representative?: string;
  website?: string;
  social_links?: string[];
}

interface ServiceData {
  title: string;
  description: string;
}

interface FAQData {
  question: string;
  answer: string;
}

interface GhostwriterResponse {
  organization: OrganizationData;
  services: ServiceData[];
  faqs: FAQData[];
}

serve(async (req) => {
  // CORS対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // リクエスト検証
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }), 
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { url, organization_id }: GhostwriterRequest = await req.json()
    
    if (!url || !organization_id) {
      return new Response(
        JSON.stringify({ error: 'URL and organization_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Supabaseクライアント初期化 (Service Role Key使用でRLSバイパス)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase configuration missing')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // 1. Jina Reader APIでWebページコンテンツを取得
    console.log(`[Ghostwriter] Fetching content from: ${url}`)
    
    const jinaApiKey = Deno.env.get('JINA_API_KEY')
    const jinaHeaders: Record<string, string> = {
      'Accept': 'application/json',
      'X-Return-Format': 'markdown'
    }
    
    // JINA_API_KEYが設定されている場合は認証ヘッダーを追加
    if (jinaApiKey) {
      jinaHeaders['Authorization'] = `Bearer ${jinaApiKey}`
    }
    
    const jinaResponse = await fetch(`https://r.jina.ai/${url}`, {
      headers: jinaHeaders
    })

    if (!jinaResponse.ok) {
      throw new Error(`Jina Reader API failed: ${jinaResponse.status}`)
    }

    const contentData = await jinaResponse.json()
    const webContent = contentData.data?.content || contentData.content || ''
    
    if (!webContent) {
      throw new Error('No content extracted from URL')
    }

    console.log(`[Ghostwriter] Content extracted, length: ${webContent.length} chars`)

    // 2. Gemini Flash APIで構造化データを生成
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    const systemPrompt = `あなたは企業情報を構造化するAIアシスタントです。

与えられたWebページのコンテンツから、以下のJSON構造に厳密に従って企業情報を抽出してください：

{
  "organization": {
    "name": "企業名",
    "description": "企業概要・事業内容（200文字程度）",
    "address": "住所（見つからない場合はnull）",
    "representative": "代表者名（見つからない場合はnull）",
    "website": "公式サイトURL（見つからない場合はnull）",
    "social_links": ["SNSのURL配列（見つからない場合は空配列）"]
  },
  "services": [
    {
      "title": "サービス名",
      "description": "サービスの詳細説明（100文字程度）"
    }
  ],
  "faqs": [
    {
      "question": "よくある質問",
      "answer": "回答内容"
    }
  ]
}

重要な注意事項:
- JSONのキー名は上記と完全に一致させること
- 情報が見つからない場合は指定された値（null、空配列等）を設定
- 日本語で出力すること
- servicesは最大5件まで
- faqsは最大3件まで
- 不正確な推測はしないこと
- social_linksにはFacebook、Twitter、Instagram、YouTubeなどのURLを含める

有効なJSONのみを出力してください。説明文は不要です。`

    const userPrompt = `以下のWebページコンテンツから企業情報を抽出してください：

${webContent.slice(0, 8000)} // Token制限対策`

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemPrompt + '\n\n' + userPrompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_NONE'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_NONE'
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_NONE'
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_NONE'
            }
          ]
        })
      }
    )

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error(`[Ghostwriter] Gemini API Error ${geminiResponse.status}: ${errorText}`)
      throw new Error(`Gemini API failed: ${geminiResponse.status} - ${errorText}`)
    }

    const geminiData = await geminiResponse.json()
    console.log(`[Ghostwriter] Gemini API Response structure:`, JSON.stringify(geminiData, null, 2))
    
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedText) {
      console.error(`[Ghostwriter] No generated text found. Full response:`, geminiData)
      throw new Error(`No response from Gemini API. Response: ${JSON.stringify(geminiData)}`)
    }

    console.log(`[Ghostwriter] Generated text: ${generatedText.slice(0, 200)}...`)

    // 3. JSONパース（エラーハンドリング付き）
    let structuredData: GhostwriterResponse
    try {
      // JSONの開始/終了マーカーを除去
      const jsonText = generatedText.replace(/```json\n?/g, '').replace(/```/g, '').trim()
      structuredData = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('[Ghostwriter] JSON parse error:', parseError)
      throw new Error('Failed to parse AI-generated JSON')
    }

    // 4. データ検証
    if (!structuredData.organization?.name) {
      throw new Error('Generated data missing required organization name')
    }

    console.log(`[Ghostwriter] Generated data for: ${structuredData.organization.name}`)

    // Step A: ロック状態の確認 (Safety Check)
    const { data: existingOrg, error: orgCheckError } = await supabase
      .from('organizations')
      .select('id, data_status')
      .eq('id', organization_id)
      .single()

    if (orgCheckError && orgCheckError.code !== 'PGRST116') {
      // PGRST116 = No rows found (許可), その他のエラーは処理失敗
      throw new Error(`Organization check failed: ${orgCheckError.message}`)
    }

    if (existingOrg && existingOrg.data_status === 'user_verified') {
      console.log(`[Ghostwriter] Organization ${organization_id} is protected, skipping update`)
      return new Response(
        JSON.stringify({
          status: 'skipped',
          message: 'Protected data exists',
          organization_id: organization_id
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Step B: データの保存 (Upsert)
    console.log(`[Ghostwriter] Saving data to database for organization: ${organization_id}`)

    try {
      // 1. Organizations テーブルへのupsert
      const { error: orgError } = await supabase
        .from('organizations')
        .upsert({
          id: organization_id,
          name: structuredData.organization.name,
          description: structuredData.organization.description,
          representative_name: structuredData.organization.representative || null,
          address_street: structuredData.organization.address || null,
          website_url: structuredData.organization.website || null,
          data_status: 'ai_generated',
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'id' 
        })

      if (orgError) {
        throw new Error(`Organization upsert failed: ${orgError.message}`)
      }

      // 2. Services テーブル - 既存データを削除して新しいデータを挿入
      if (structuredData.services && structuredData.services.length > 0) {
        // 既存servicesを削除
        const { error: deleteServicesError } = await supabase
          .from('services')
          .delete()
          .eq('organization_id', organization_id)

        if (deleteServicesError) {
          console.warn(`[Ghostwriter] Failed to delete existing services: ${deleteServicesError.message}`)
        }

        // 新しいservicesを挿入
        const servicesData = structuredData.services.map(service => ({
          organization_id: organization_id,
          name: service.title,
          description: service.description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))

        const { error: servicesError } = await supabase
          .from('services')
          .insert(servicesData)

        if (servicesError) {
          console.warn(`[Ghostwriter] Services insert failed: ${servicesError.message}`)
        } else {
          console.log(`[Ghostwriter] Inserted ${servicesData.length} services`)
        }
      }

      // 3. FAQs テーブル - 既存データを削除して新しいデータを挿入
      if (structuredData.faqs && structuredData.faqs.length > 0) {
        // 既存FAQsを削除
        const { error: deleteFaqsError } = await supabase
          .from('faqs')
          .delete()
          .eq('organization_id', organization_id)

        if (deleteFaqsError) {
          console.warn(`[Ghostwriter] Failed to delete existing FAQs: ${deleteFaqsError.message}`)
        }

        // 新しいFAQsを挿入
        const faqsData = structuredData.faqs.map(faq => ({
          organization_id: organization_id,
          question: faq.question,
          answer: faq.answer,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))

        const { error: faqsError } = await supabase
          .from('faqs')
          .insert(faqsData)

        if (faqsError) {
          console.warn(`[Ghostwriter] FAQs insert failed: ${faqsError.message}`)
        } else {
          console.log(`[Ghostwriter] Inserted ${faqsData.length} FAQs`)
        }
      }

      console.log(`[Ghostwriter] Successfully saved all data for: ${structuredData.organization.name}`)

    } catch (dbError) {
      console.error('[Ghostwriter] Database operation failed:', dbError)
      return new Response(
        JSON.stringify({ 
          error: `Database save failed: ${dbError.message}`,
          organization_id: organization_id,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 500, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // 5. 成功レスポンス
    return new Response(
      JSON.stringify({
        success: true,
        status: 'completed',
        organization_id: organization_id,
        data: structuredData,
        source_url: url,
        generated_at: new Date().toISOString(),
        saved_to_database: true
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('[Ghostwriter] Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})