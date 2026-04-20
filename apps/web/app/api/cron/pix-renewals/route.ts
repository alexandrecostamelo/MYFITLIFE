import { NextRequest, NextResponse } from 'next/server';
import { withHeartbeat } from '@/lib/monitoring/heartbeat';
import { findSubsNeedingRenewal, generateRenewalCharge } from '@/lib/billing/pix-renewal';
import { sendRenewalNotifications } from '@/lib/billing/renewal-notifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  return withHeartbeat('pix_renewals', async () => {
    const subs = await findSubsNeedingRenewal();
    let generated = 0;
    let errors = 0;

    for (const sub of subs) {
      const result = await generateRenewalCharge(sub.id);
      if (result.ok) generated++;
      else errors++;
    }

    const notifResult = await sendRenewalNotifications();

    return NextResponse.json({
      identified: subs.length,
      charges_generated: generated,
      errors,
      notifications: notifResult,
    });
  });
}
