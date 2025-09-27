import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const diagnosis = {
      commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
      deployId: process.env.VERCEL_DEPLOYMENT_ID || null,
      flags: {
        layoutHasSafeHeader: true
      }
    };

    return NextResponse.json(diagnosis, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      error: error?.message || 'Unknown error',
      commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
      deployId: process.env.VERCEL_DEPLOYMENT_ID || null,
      flags: {
        layoutHasSafeHeader: true
      }
    }, { status: 200 });
  }
}