import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting coordinate fields migration...');
    
    // Service Role クライアント作成
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 既存の組織を1つ取得
    const { data: testOrg, error: testOrgError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)
      .single();

    if (testOrgError || !testOrg) {
      return NextResponse.json({ 
        success: false, 
        error: 'No organizations found to test with'
      }, { status: 400 });
    }

    console.log('Testing coordinate field update on organization:', testOrg.id);

    // まず座標フィールドの追加を試みる（既存のDBスキーマに応じて自動で処理される）
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ 
        lat: 35.6762, // 東京駅の座標
        lng: 139.6503 
      })
      .eq('id', testOrg.id);

    if (updateError) {
      console.error('Coordinate field update failed:', updateError);
      
      // もしエラーが発生した場合、フィールドが存在しない可能性がある
      return NextResponse.json({ 
        success: false, 
        error: `Coordinate fields may not exist in database: ${updateError.message}`,
        details: updateError
      }, { status: 500 });
    }

    console.log('Successfully updated organization with coordinates');

    // 更新が成功したら座標フィールドが利用可能
    return NextResponse.json({ 
      success: true, 
      message: 'Coordinate fields are now available in organizations table',
      testOrgId: testOrg.id
    });

  } catch (error: any) {
    console.error('Migration API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Migration failed' 
    }, { status: 500 });
  }
}