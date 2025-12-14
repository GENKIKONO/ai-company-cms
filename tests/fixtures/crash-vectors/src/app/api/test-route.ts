// Test fixture - API route with throw error (should be excluded)
import { NextResponse } from 'next/server';

export async function GET() {
  throw new Error('API error - should be excluded');
  
  return NextResponse.json({ message: 'test' });
}