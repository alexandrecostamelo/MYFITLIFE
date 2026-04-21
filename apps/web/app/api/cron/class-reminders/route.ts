import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { withHeartbeat } from '@/lib/monitoring/heartbeat';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  return withHeartbeat('class_reminders', async () => {
    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );

    const today = new Date();
    const todayDate = today.toISOString().slice(0, 10);
    const dow = today.getDay();

    const { data: classes } = await admin
      .from('gym_classes')
      .select('id, title, start_time, gym_id')
      .eq('is_active', true)
      .eq('day_of_week', dow);

    let sent = 0;

    for (const cls of (classes || []) as Record<string, unknown>[]) {
      const startTime = String(cls.start_time || '08:00');
      const [h, m] = startTime.split(':').map(Number);
      const classTime = new Date(today);
      classTime.setHours(h, m, 0, 0);
      const diffMin = (classTime.getTime() - today.getTime()) / 60000;

      // Only send if class is 50-70 minutes away (~1h before)
      if (diffMin < 50 || diffMin > 70) continue;

      const { data: bookings } = await admin
        .from('gym_class_bookings')
        .select('user_id')
        .eq('class_id', String(cls.id))
        .eq('class_date', todayDate)
        .eq('status', 'confirmed');

      for (const booking of (bookings || []) as Record<string, unknown>[]) {
        try {
          const { sendPushToUser } = await import('@/lib/push');
          await sendPushToUser(admin, String(booking.user_id), {
            title: `${String(cls.title)} em 1 hora`,
            body: `Sua aula começa às ${startTime.slice(0, 5)}. Não esqueça!`,
            url: '/app/gym/classes',
            tag: 'class_reminder',
          });
          sent++;
        } catch {
          // push not critical
        }
      }
    }

    return NextResponse.json({ sent, ran_at: new Date().toISOString() });
  });
}
