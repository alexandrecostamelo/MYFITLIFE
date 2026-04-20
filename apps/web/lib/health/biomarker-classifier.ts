import { createClient as createAdmin } from '@supabase/supabase-js';

function admin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

interface BiomarkerAlert {
  marker: string;
  value: number;
  unit: string;
  classification: string;
  recommendation: string;
}

export async function classifyBiomarkers(
  userId: string,
): Promise<{ classified: number; alerts: BiomarkerAlert[] }> {
  const supa = admin();

  // Get user sex and age from profiles table
  const { data: profile } = await supa
    .from('profiles')
    .select('gender, birth_date')
    .eq('id', userId)
    .maybeSingle();

  const profileRec = profile as Record<string, unknown> | null;
  const gender = String(profileRec?.gender || 'any');
  const sex =
    gender === 'masculino' || gender === 'male'
      ? 'male'
      : gender === 'feminino' || gender === 'female'
        ? 'female'
        : 'any';

  const birthDate = profileRec?.birth_date
    ? new Date(String(profileRec.birth_date))
    : null;
  const age = birthDate
    ? Math.floor(
        (Date.now() - birthDate.getTime()) / (365.25 * 24 * 3600 * 1000),
      )
    : 30;

  // Get all biomarkers for user
  const { data: biomarkers } = await supa
    .from('biomarkers')
    .select('id, marker_name, value, unit, classification')
    .eq('user_id', userId)
    .order('measured_at', { ascending: false });

  // Get reference ranges
  const { data: refs } = await supa
    .from('biomarker_references')
    .select('*');

  // Keep only latest per marker_name
  const seen = new Set<string>();
  const latest: Record<string, unknown>[] = [];
  for (const b of (biomarkers || []) as Record<string, unknown>[]) {
    const name = String(b.marker_name);
    if (seen.has(name)) continue;
    seen.add(name);
    latest.push(b);
  }

  let classified = 0;
  const alerts: BiomarkerAlert[] = [];

  for (const b of latest) {
    const markerName = String(b.marker_name).toLowerCase();
    const value = Number(b.value);

    // Find best matching reference (sex-specific first, then 'any')
    const ref = (refs || []).find(
      (r: Record<string, unknown>) =>
        String(r.marker_name).toLowerCase() === markerName &&
        (String(r.sex) === sex || String(r.sex) === 'any') &&
        age >= Number(r.age_min) &&
        age <= Number(r.age_max),
    ) as Record<string, unknown> | undefined;

    if (!ref) continue;

    const normalMin = Number(ref.normal_min ?? -Infinity);
    const normalMax = Number(ref.normal_max ?? Infinity);
    const criticalMin = Number(ref.critical_min ?? -Infinity);
    const criticalMax = Number(ref.critical_max ?? Infinity);

    let classification = 'normal';
    let recommendation = '';

    if (value < criticalMin || value > criticalMax) {
      classification = 'critical';
      recommendation =
        value < normalMin
          ? String(ref.recommendation_low || '')
          : String(ref.recommendation_high || '');
    } else if (value < normalMin || value > normalMax) {
      classification = 'attention';
      recommendation =
        value < normalMin
          ? String(ref.recommendation_low || '')
          : String(ref.recommendation_high || '');
    }

    if (classification !== String(b.classification)) {
      await supa
        .from('biomarkers')
        .update({ classification } as Record<string, unknown>)
        .eq('id', String(b.id));
      classified++;
    }

    if (classification !== 'normal') {
      alerts.push({
        marker: String(b.marker_name),
        value,
        unit: String(b.unit || ''),
        classification,
        recommendation,
      });
    }
  }

  return { classified, alerts };
}

export async function sendBiomarkerAlerts(
  userId: string,
  alerts: BiomarkerAlert[],
): Promise<void> {
  if (alerts.length === 0) return;

  const supa = admin();
  const criticals = alerts.filter((a) => a.classification === 'critical');

  if (criticals.length > 0) {
    try {
      const { sendPushToUser } = await import('@/lib/push');
      await sendPushToUser(supa, userId, {
        title: `\u26A0\uFE0F ${criticals.length} biomarcador(es) fora da faixa`,
        body: criticals.map((c) => c.marker).join(', '),
        url: '/app/health/biomarkers',
        tag: 'biomarker_alert',
      });
    } catch {
      // push not critical
    }

    // Mark alerts as sent
    for (const a of criticals) {
      await supa
        .from('biomarkers')
        .update({
          alert_sent: true,
          alert_sent_at: new Date().toISOString(),
        } as Record<string, unknown>)
        .eq('user_id', userId)
        .eq('marker_name', a.marker)
        .eq('alert_sent', false);
    }
  }
}
