// Test fixture - API route with NextResponse (should be excluded from throw error detection)
import { NextResponse } from 'next/server';

export async function GET() {
  throw new Error('API error - should be excluded from throw error detection');
  
  return NextResponse.json({ message: 'test' });
}