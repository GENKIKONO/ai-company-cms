/**
 * 管理者ユーザー管理API - Node.js Runtime + Service Role
 * GET /api/admin/users
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerUser, isAdmin } from '@/lib/auth/server';

// 重要: Edge ではなく Node.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Environment validation
function validateEnvironment() {
  const missing = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!process.env.ADMIN_EMAILS && !process.env.ADMIN_EMAIL) missing.push('ADMIN_EMAILS or ADMIN_EMAIL');
  
  return missing;
}

// Supabase Admin Client (Service Role)
function createAdminClient() {
  const missing = validateEnvironment();
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Server Only
  );
}

export async function GET() {
  try {
    // Environment check
    const missing = validateEnvironment();
    if (missing.length > 0) {
      return NextResponse.json(
        { error: 'ENV_MISSING', detail: `Missing: ${missing.join(', ')}` },
        { status: 500 }
      );
    }

    // Authentication & Authorization
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    if (!isAdmin(user)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    // Service Role Client
    const admin = createAdminClient();

    // Fetch users via Admin API
    const { data, error } = await admin.auth.admin.listUsers({ 
      perPage: 100 
    });

    if (error) {
      console.error('Admin API error:', error);
      return NextResponse.json(
        { error: 'ADMIN_API_ERROR', detail: error.message },
        { status: 500 }
      );
    }

    // Transform user data
    const users = data.users.map(authUser => ({
      id: authUser.id,
      email: authUser.email,
      role: authUser.app_metadata?.role || 'user',
      created_at: authUser.created_at,
      updated_at: authUser.updated_at,
      last_sign_in_at: authUser.last_sign_in_at,
      email_confirmed_at: authUser.email_confirmed_at,
      organizations: null, // TODO: Add DB join if needed
    }));

    // Statistics
    const stats = {
      total: users.length,
      admin: users.filter(u => u.role === 'admin').length,
      user: users.filter(u => u.role === 'user').length,
      verified: users.filter(u => u.email_confirmed_at).length,
    };

    return NextResponse.json({
      users,
      stats,
      pagination: {
        limit: 100,
        offset: 0,
        total: users.length,
      }
    });

  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', detail: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}