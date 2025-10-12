/**
 * 管理者権限確認API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserWithAdmin } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    const { user, isAdmin } = await getUserWithAdmin();
    
    // デバッグ情報をログ出力
    console.log('Admin verification debug:', {
      userExists: !!user,
      userEmail: user?.email,
      userRole: user?.app_metadata?.role,
      adminEmails: process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL,
      isAdmin
    });
    
    return NextResponse.json({
      isAuthenticated: !!user,
      isAdmin,
      email: user?.email || null,
      // デバッグ情報も含める（本番では削除予定）
      debug: {
        userRole: user?.app_metadata?.role,
        adminEmails: process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL,
        calculatedIsAdmin: isAdmin
      }
    });
    
  } catch (error) {
    console.error('Admin verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}