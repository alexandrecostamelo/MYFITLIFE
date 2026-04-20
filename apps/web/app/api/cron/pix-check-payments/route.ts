import { NextRequest, NextResponse } from 'next/server';
import { withHeartbeat } from '@/lib/monitoring/heartbeat';
import { checkPendingCharges, expireOverdueSubscriptions } from '@/lib/billing/pix-renewal';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  return withHeartbeat('pix_check_payments', async () => {
    const check = await checkPendingCharges();
    const expire = await expireOverdueSubscriptions();

    return NextResponse.json({
      charges_checked: check.checked,
      charges_paid: check.paid,
      subs_expired: expire.expired,
      subs_graced: expire.graced,
    });
  });
}
