import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

interface CheckResult {
  ok: boolean;
  latency_ms: number;
  error?: string;
}

async function checkEnvVars(): Promise<CheckResult> {
  const start = Date.now();
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ANTHROPIC_API_KEY',
  ];
  const missing = required.filter((k) => !process.env[k]);
  return {
    ok: missing.length === 0,
    latency_ms: Date.now() - start,
    error: missing.length > 0 ? `missing: ${missing.join(', ')}` : undefined,
  };
}

async function checkSupabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) throw error;
    return { ok: true, latency_ms: Date.now() - start };
  } catch (err: unknown) {
    return {
      ok: false,
      latency_ms: Date.now() - start,
      error: (err as Error).message || 'unknown',
    };
  }
}

async function checkSupabaseStorage(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
    const { error } = await supabase.storage.listBuckets();
    if (error) throw error;
    return { ok: true, latency_ms: Date.now() - start };
  } catch (err: unknown) {
    return {
      ok: false,
      latency_ms: Date.now() - start,
      error: (err as Error).message || 'unknown',
    };
  }
}

async function checkAnthropic(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY missing');
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'ping' }],
    });
    if (!res.id) throw new Error('no response id');
    return { ok: true, latency_ms: Date.now() - start };
  } catch (err: unknown) {
    return {
      ok: false,
      latency_ms: Date.now() - start,
      error: (err as Error).message || 'unknown',
    };
  }
}

export async function GET(req: NextRequest) {
  const token =
    req.nextUrl.searchParams.get('token') || req.headers.get('x-health-token');
  const expected = process.env.HEALTH_CHECK_TOKEN;
  if (!expected || token !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const [env, db, storage, anthropic] = await Promise.all([
    checkEnvVars(),
    checkSupabase(),
    checkSupabaseStorage(),
    checkAnthropic(),
  ]);

  const allOk = env.ok && db.ok && storage.ok && anthropic.ok;

  return NextResponse.json(
    {
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        env_vars: env,
        supabase_db: db,
        supabase_storage: storage,
        anthropic_api: anthropic,
      },
    },
    {
      status: allOk ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}
