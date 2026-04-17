import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { redirect } from 'next/navigation';

export default async function AppHome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, onboarding_completed')
    .eq('id', user.id)
    .single();

  if (!profile?.onboarding_completed) {
    redirect('/onboarding');
  }

  const { data: up } = await supabase
    .from('user_profiles')
    .select('target_calories, target_protein_g, target_carbs_g, target_fats_g, target_water_ml, primary_goal, experience_level')
    .eq('user_id', user.id)
    .single();

  const firstName = profile.full_name?.split(' ')[0] || 'você';

  return (
    <main className="mx-auto max-w-2xl p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Bom dia, {firstName}!</h1>
        <p className="text-muted-foreground">Seu plano do dia está sendo preparado.</p>
      </header>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">METAS DIÁRIAS</h2>
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Calorias</div>
            <div className="text-2xl font-bold">{up?.target_calories ?? '---'}</div>
            <div className="text-xs text-muted-foreground">kcal</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Proteína</div>
            <div className="text-2xl font-bold">{up?.target_protein_g ?? '---'}</div>
            <div className="text-xs text-muted-foreground">gramas</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Carboidratos</div>
            <div className="text-2xl font-bold">{up?.target_carbs_g ?? '---'}</div>
            <div className="text-xs text-muted-foreground">gramas</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Gorduras</div>
            <div className="text-2xl font-bold">{up?.target_fats_g ?? '---'}</div>
            <div className="text-xs text-muted-foreground">gramas</div>
          </Card>
          <Card className="col-span-2 p-4">
            <div className="text-xs text-muted-foreground">Água</div>
            <div className="text-2xl font-bold">{up?.target_water_ml ?? '---'}</div>
            <div className="text-xs text-muted-foreground">ml</div>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">PERFIL</h2>
        <Card className="p-4">
          <div className="space-y-1 text-sm">
            <div>
              <span className="text-muted-foreground">Objetivo: </span>
              <span className="font-medium">{up?.primary_goal}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Nível: </span>
              <span className="font-medium">{up?.experience_level}</span>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}
