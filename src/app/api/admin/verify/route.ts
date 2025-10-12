/**
 * 管理者権限確認API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserWithAdmin } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    const { user, isAdmin } = await getUserWithAdmin();
    
    return NextResponse.json({
      isAuthenticated: !!user,
      isAdmin,
      email: user?.email || null
    });
    
  } catch (error) {
    console.error('Admin verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}