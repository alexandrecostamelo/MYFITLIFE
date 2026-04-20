import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { isPremium, getCurrentQuota } from '@/lib/premium/quota';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Premium — MyFitLife' };

const SPEC: Record<string, { label: string; totalKey: string; usedKey: string }> = {
  nutrition: {
    label: 'Nutrição',
    totalKey: 'nutrition_sessions_total',
    usedKey: 'nutrition_sessions_used',
  },
  training: {
    label: 'Treino',
    totalKey: 'training_sessions_total',
    usedKey: 'training_sessions_used',
  },
  physio: {
    label: 'Fisio',
    totalKey: 'physio_sessions_total',
    usedKey: 'physio_sessions_used',
  },
};

export default async function PremiumDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  if (!(await isPremium(user.id))) redirect('/app/plans');

  const quota = await getCurrentQuota(user.id);

  const { data: rawAssignments } = await supabase
    .from('premium_assignments')
    .select('specialty, professional_id')
    .eq('user_id', user.id)
    .eq('is_active', true);

  const assignments = (rawAssignments || []) as Record<string, unknown>[];

  // Enrich assignments with professional info
  const profIds = assignments.map((a) => a.professional_id as string);
  const { data: profs } = profIds.length
    ? await supabase
        .from('professionals')
        .select('user_id, full_name, avatar_url')
        .in('user_id', profIds)
    : { data: [] };

  const profMap = new Map(
    ((profs || []) as Record<string, unknown>[]).map((p) => [p.user_id as string, p]),
  );

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 pb-24 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Premium</h1>
        <p className="text-sm text-muted-foreground">Consultoria humana inclusa</p>
      </div>

      <section className="rounded-xl border bg-card p-4 space-y-3">
        <h2 className="font-semibold text-sm">Seu pacote deste mês</h2>
        {Object.entries(SPEC).map(([key, s]) => {
          const total = (quota?.[s.totalKey] as number) || 0;
          const used = (quota?.[s.usedKey] as number) || 0;
          const remaining = Math.max(0, total - used);
          if (total === 0) return null;
          return (
            <div key={key} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>{s.label}</span>
                  <span className="text-muted-foreground">
                    {remaining}/{total}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
                    style={{ width: `${total > 0 ? (used / total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Seus profissionais</h2>
          <Link href="/app/premium/setup">
            <Button size="sm" variant="outline">
              Trocar
            </Button>
          </Link>
        </div>
        {assignments.length === 0 ? (
          <Link href="/app/premium/setup">
            <Button className="w-full">Escolher meus profissionais</Button>
          </Link>
        ) : (
          <div className="rounded-xl border divide-y">
            {assignments.map((a) => {
              const prof = profMap.get(a.professional_id as string) as Record<string, unknown> | undefined;
              return (
                <div key={a.specialty as string} className="p-3 flex items-center gap-3">
                  {!!prof?.avatar_url && (
                    <img
                      src={String(prof.avatar_url)}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{String(prof?.full_name ?? 'Profissional')}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {SPEC[a.specialty as string]?.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Link href="/app/appointments">
        <Button className="w-full" size="lg">
          Agendar consulta
        </Button>
      </Link>
    </main>
  );
}
