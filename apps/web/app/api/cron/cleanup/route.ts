import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: cacheDeleted } = await supabase.rpc('cleanup_expired_ai_cache');
  const { data: limitsDeleted } = await supabase.rpc('cleanup_old_rate_limits');

  return NextResponse.json({
    cache_deleted: cacheDeleted,
    rate_limits_deleted: limitsDeleted,
  });
}
