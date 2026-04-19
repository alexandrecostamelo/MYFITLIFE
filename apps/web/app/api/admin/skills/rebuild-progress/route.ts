import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isPlatformAdmin } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await isPlatformAdmin(supabase, user.id))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const targetUserId: string | undefined = body.user_id;

  // Fetch all finished workout logs (optionally for a specific user)
  let query = supabase
    .from('workout_logs')
    .select('id, user_id, session_id, finished_at, started_at')
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: true });

  if (targetUserId) {
    query = query.eq('user_id', targetUserId);
  }

  const { data: logs, error: logsErr } = await query;
  if (logsErr) return NextResponse.json({ error: logsErr.message }, { status: 500 });

  // Fetch all exercises and skill nodes for matching
  const [{ data: exercises }, { data: skillNodes }] = await Promise.all([
    supabase.from('exercises').select('id, name_pt'),
    supabase.from('skill_nodes').select('key, name, mastery_criteria, xp_on_mastery'),
  ]);

  if (!exercises || !skillNodes) {
    return NextResponse.json({ error: 'failed to load reference data' }, { status: 500 });
  }

  // Build a map: exercise_id → matching skill keys
  function normalize(s: string) {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  const exerciseToSkills = new Map<string, string[]>();
  for (const ex of exercises) {
    const exNorm = normalize(ex.name_pt ?? '');
    const matched: string[] = [];
    for (const sk of skillNodes) {
      const skNorm = normalize(sk.name ?? '');
      if (exNorm.includes(skNorm) || skNorm.includes(exNorm)) {
        matched.push(sk.key);
      }
    }
    if (matched.length > 0) exerciseToSkills.set(ex.id as string, matched);
  }

  // Get all session exercises per session
  const sessionIds = [...new Set((logs ?? []).map((l: Record<string, unknown>) => l.session_id as string).filter(Boolean))];
  const { data: sessionExercises } = sessionIds.length > 0
    ? await supabase
        .from('workout_session_exercises')
        .select('session_id, exercise_id')
        .in('session_id', sessionIds)
    : { data: [] };

  // Group exercises by session
  const sessionExMap = new Map<string, string[]>();
  for (const se of (sessionExercises ?? [])) {
    const r = se as Record<string, unknown>;
    const sid = r.session_id as string;
    const eid = r.exercise_id as string;
    if (!sessionExMap.has(sid)) sessionExMap.set(sid, []);
    sessionExMap.get(sid)!.push(eid);
  }

  // Per user: accumulate sessions_practiced per skill key
  const userSkillSessions = new Map<string, Map<string, number>>();
  for (const log of (logs ?? [])) {
    const l = log as Record<string, unknown>;
    const uid = l.user_id as string;
    const sid = l.session_id as string;
    const exIds = sessionExMap.get(sid) ?? [];

    if (!userSkillSessions.has(uid)) userSkillSessions.set(uid, new Map());
    const skillMap = userSkillSessions.get(uid)!;

    for (const eid of exIds) {
      const matchedSkills = exerciseToSkills.get(eid) ?? [];
      for (const sk of matchedSkills) {
        skillMap.set(sk, (skillMap.get(sk) ?? 0) + 1);
      }
    }
  }

  let updated = 0;
  let mastered = 0;

  // Apply progress updates
  for (const [uid, skillMap] of userSkillSessions) {
    const { data: userSkills } = await supabase
      .from('user_skills')
      .select('skill_key, status, progress')
      .eq('user_id', uid);

    for (const us of (userSkills ?? [])) {
      const r = us as Record<string, unknown>;
      const key = r.skill_key as string;
      if (r.status === 'mastered' || !skillMap.has(key)) continue;

      const sessions = skillMap.get(key) ?? 0;
      const progress = { ...((r.progress as Record<string, unknown>) ?? {}), sessions_practiced: sessions };

      // Check mastery
      const node = skillNodes.find((sn: Record<string, unknown>) => sn.key === key);
      const criteria = (node?.mastery_criteria ?? {}) as Record<string, number>;
      const isMastered = Object.keys(criteria).length > 0 &&
        Object.entries(criteria).every(([k, target]) =>
          ((progress as Record<string, unknown>)[k] as number ?? 0) >= target
        );

      if (isMastered) {
        await supabase.from('user_skills').update({
          progress,
          status: 'mastered',
          mastered_at: new Date().toISOString(),
          first_practice_at: new Date().toISOString(),
        }).eq('user_id', uid).eq('skill_key', key);

        const xp = (node as Record<string, unknown>)?.xp_on_mastery as number ?? 0;
        if (xp > 0) {
          await supabase.from('xp_events').insert({
            user_id: uid, event_type: 'skill_mastered', xp_awarded: xp,
            dimension: 'strength', ref_table: 'skill_nodes', ref_id: key,
            description: 'Rebuild: habilidade dominada: ' + key,
          });
          await supabase.rpc('update_user_stats_xp' as never, { p_user_id: uid, p_xp: xp } as never).maybeSingle();
        }
        mastered++;
      } else {
        await supabase.from('user_skills').update({
          progress,
          first_practice_at: new Date().toISOString(),
        }).eq('user_id', uid).eq('skill_key', key);
      }
      updated++;
    }
  }

  return NextResponse.json({ ok: true, updated, mastered, users: userSkillSessions.size });
}
