import { NextRequest, NextResponse } from 'next/server';

// Simple test endpoint - no auth required
export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    status: 'Phone API is working!',
    message: 'The route is accessible',
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ 
    status: 'POST received',
    message: 'Phone API POST endpoint is working',
    timestamp: new Date().toISOString()
  });
}
