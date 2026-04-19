import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withHeartbeat } from '@/lib/monitoring/heartbeat';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  return withHeartbeat('daily_cleanup', async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: cacheDeleted } = await supabase.rpc('cleanup_expired_ai_cache');
    const { data: limitsDeleted } = await supabase.rpc('cleanup_old_rate_limits');

    // Cleanup old AI usage logs (>7 days) and expired blocks
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const { count: usageLogsDeleted } = await supabase
      .from('ai_usage_log')
      .delete({ count: 'exact' })
      .lt('created_at', sevenDaysAgo);

    const { count: expiredBlocksDeleted } = await supabase
      .from('ai_rate_blocks')
      .delete({ count: 'exact' })
      .lt('blocked_until', new Date().toISOString());

    return NextResponse.json({
      cache_deleted: cacheDeleted,
      rate_limits_deleted: limitsDeleted,
      usage_logs_deleted: usageLogsDeleted,
      expired_blocks_deleted: expiredBlocksDeleted,
    });
  });
}
