import { NextRequest, NextResponse } from 'next/server';
import { processPendingQueue } from '@/lib/nfse/issue';
import { withHeartbeat } from '@/lib/monitoring/heartbeat';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  return withHeartbeat('nfse_queue', async () => {
    const result = await processPendingQueue();
    return NextResponse.json(result);
  });
}
