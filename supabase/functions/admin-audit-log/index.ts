/**
 * Admin Audit Log Edge Function
 *
 * 管理UIからのアクセスを ops_audit テーブルに記録
 *
 * 使用方法:
 * POST /functions/v1/admin-audit-log
 * Headers: Authorization: Bearer <access_token>
 * Body: { "page": "/dashboard/manage/jobs", "action": "filter_changed", "detail": "status=running" }
 *
 * テーブル: ops_audit
 * カラム: action (text), actor (uuid), details (jsonb), target (text), created_at (timestamptz)
 */

// Supabase Edge Functions use Deno runtime
// Environment variables SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface AuditLogRequest {
  page: string;
  action: string;
  detail?: string;
}

interface SupabaseUser {
  id: string;
  email?: string;
}

interface AuthResponse {
  data: { user: SupabaseUser | null };
  error: { message: string } | null;
}

interface InsertResponse {
  error: { message: string; code?: string } | null;
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing environment variables');
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required (Bearer token)' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verify JWT and get user via Supabase Auth API
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
      },
    });

    if (!authResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const user: SupabaseUser = await authResponse.json();

    if (!user || !user.id) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    let body: AuditLogRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate required fields
    if (!body.page || typeof body.page !== 'string') {
      return new Response(
        JSON.stringify({ error: 'page is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.action || typeof body.action !== 'string') {
      return new Response(
        JSON.stringify({ error: 'action is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build insert payload
    // ops_audit columns: action (text), actor (uuid), details (jsonb), target (text)
    const insertPayload = {
      action: body.action,
      actor: user.id,
      target: body.page,
      details: {
        page: body.page,
        ...(body.detail ? { detail: body.detail } : {}),
        timestamp: new Date().toISOString(),
      },
    };

    // Insert via PostgREST (using service role for RLS bypass)
    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/ops_audit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(insertPayload),
    });

    if (!insertResponse.ok) {
      const errorText = await insertResponse.text();
      console.error('Insert failed:', insertResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Insert failed', detail: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Audit log recorded', userId: user.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', detail: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
