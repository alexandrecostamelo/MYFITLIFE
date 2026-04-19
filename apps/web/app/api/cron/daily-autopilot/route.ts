import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const today = new Date().toISOString().slice(0, 10);

  const { data: activeUsers } = await supabase
    .from('user_profiles')
    .select('user_id')
    .limit(5000);

  const { data: alreadyHave } = await supabase
    .from('daily_plans')
    .select('user_id')
    .eq('plan_date', today);

  const alreadySet = new Set((alreadyHave || []).map((p: any) => p.user_id));
  const usersToGenerate = (activeUsers || []).filter((u: any) => !alreadySet.has(u.user_id)).slice(0, 200);

  console.log(`[cron/daily-autopilot] Gerando para ${usersToGenerate.length} usuários`);

  return NextResponse.json({
    triggered: usersToGenerate.length,
    message: 'Autopilots serão gerados sob demanda quando o usuário abrir o app',
  });
}
