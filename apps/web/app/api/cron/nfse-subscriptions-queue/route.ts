import { NextRequest, NextResponse } from 'next/server';
import { withHeartbeat } from '@/lib/monitoring/heartbeat';
import { processPendingSubscriptionQueue } from '@/lib/nfse/subscription-issuer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  return withHeartbeat('nfse_sub_queue', async () => {
    const result = await processPendingSubscriptionQueue();
    return NextResponse.json(result);
  });
}
