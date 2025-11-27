import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Supabase クライアント作成（Service Role キー使用）
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // LuxuCare の organization_id
    const orgId = 'c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3';

    // RPC 関数を呼び出し
    const { data, error } = await supabase.rpc('generate_ai_manifest', {
      p_org_id: orgId
    });

    if (error) {
      console.error('RPC error:', error);
      return NextResponse.json(
        { error: 'failed to generate manifest' },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // 成功時はデータをそのまま返す
    return NextResponse.json(data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { error: 'failed to generate manifest' },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}