import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const START_TIME = Date.now();

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'myfitlife-web',
      version: process.env.NEXT_PUBLIC_APP_VERSION || 'dev',
      uptime_seconds: Math.round((Date.now() - START_TIME) / 1000),
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    }
  );
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}
