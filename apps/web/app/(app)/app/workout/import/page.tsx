import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { WorkoutImportClient } from './import-client';

export default async function ImportWorkoutsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: exercises } = await supabase
    .from('exercises')
    .select('id, name_pt, slug, aliases')
    .order('name_pt')
    .limit(500);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 pb-24">
      <h1 className="mb-1 text-2xl font-bold">Importar treinos de planilha</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Suporta arquivos .xlsx e .csv. Baixe o template abaixo pra referência.
      </p>
      <WorkoutImportClient catalog={exercises || []} />
    </main>
  );
}
