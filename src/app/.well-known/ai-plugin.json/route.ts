/* eslint-disable no-console */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase.rpc(
      'generate_ai_manifest',
      { p_org_id: 'c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3' }
    );

    if (error || !data) {
      console.error(error);
      return NextResponse.json(
        { error: 'failed to generate manifest' },
        { status: 500 }
      );
    }

    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'unexpected error' },
      { status: 500 }
    );
  }
}