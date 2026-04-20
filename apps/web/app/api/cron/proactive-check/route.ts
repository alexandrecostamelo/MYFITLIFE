import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPushToUser } from '@/lib/push';
import { withHeartbeat } from '@/lib/monitoring/heartbeat';
import { calculateReadiness } from '@/lib/health/readiness';
import {
  classifyBiomarkers,
  sendBiomarkerAlerts,
} from '@/lib/health/biomarker-classifier';

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  return withHeartbeat('proactive', async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: inactive } = await supabase
      .from('user_stats')
      .select('user_id, current_streak, last_active_date')
      .lt('last_active_date', new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10))
      .gt('current_streak', 0)
      .limit(500);

    let pushed = 0;
    for (const u of inactive || []) {
      const sent = await sendPushToUser(supabase, u.user_id, {
        title: 'Sentimos sua falta no MyFitLife',
        body: `Sua streak de ${u.current_streak} dias está em risco. Volte hoje pra manter o ritmo!`,
        url: '/app',
        tag: 'streak_at_risk',
      });
      pushed += sent;
    }

    // overtraining detection for users with health data
    let overtrained = 0;
    const { data: healthUsers } = await supabase
      .from('profiles')
      .select('id')
      .eq('health_sync_enabled', true)
      .limit(200);

    for (const hu of (healthUsers || []) as Record<string, unknown>[]) {
      try {
        const readiness = await calculateReadiness(String(hu.id));
        if (readiness.zone === 'red') {
          await sendPushToUser(supabase, String(hu.id), {
            title: 'Seu corpo precisa descansar',
            body: `Readiness ${readiness.score}/100. ${readiness.recommendation}`,
            url: '/app/health/readiness',
            tag: 'overtraining_alert',
          });
          overtrained++;
        } else if (
          readiness.zone === 'yellow' &&
          readiness.factors.some((f) => f.includes('queda') || f.includes('subindo'))
        ) {
          await sendPushToUser(supabase, String(hu.id), {
            title: 'Sinais de fadiga detectados',
            body: `Readiness ${readiness.score}/100. Considere moderar o treino hoje.`,
            url: '/app/health/readiness',
            tag: 'fatigue_warning',
          });
          overtrained++;
        }
      } catch {
        // skip user on error
      }
    }

    // Biomarker classification and alerts
    let biomarkerAlerts = 0;
    const { data: recentExamUsers } = await supabase
      .from('biomarkers')
      .select('user_id')
      .eq('alert_sent', false)
      .order('created_at', { ascending: false })
      .limit(200);

    const uniqueUserIds = [
      ...new Set(
        ((recentExamUsers || []) as Record<string, unknown>[]).map((r) =>
          String(r.user_id),
        ),
      ),
    ];

    for (const uid of uniqueUserIds) {
      try {
        const { alerts } = await classifyBiomarkers(uid);
        if (alerts.length > 0) {
          await sendBiomarkerAlerts(uid, alerts);
          biomarkerAlerts += alerts.length;
        }
      } catch {
        // skip user on error
      }
    }

    return NextResponse.json({
      inactive_users: inactive?.length || 0,
      pushed,
      overtraining_alerts: overtrained,
      biomarker_alerts: biomarkerAlerts,
    });
  });
}
