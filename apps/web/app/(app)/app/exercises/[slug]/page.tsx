import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { VideoGallery } from '@/components/exercise/VideoGallery';
import { AnatomyViewer } from '@/components/anatomy/AnatomyViewer';
import Link from 'next/link';
import { ArrowLeft, Dumbbell } from 'lucide-react';

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: exercise } = await supabase
    .from('exercises')
    .select('id, slug, name_pt, name_en, description, instructions, common_mistakes, breathing_notes, category, primary_muscles, secondary_muscles, equipment, difficulty, form_tips')
    .eq('slug', slug)
    .single();

  if (!exercise) notFound();

  const { data: videos } = await supabase
    .from('exercise_videos')
    .select('*')
    .eq('exercise_id', exercise.id)
    .eq('is_active', true)
    .order('order_index');

  const name = String(exercise.name_pt || exercise.name_en || slug);
  const description = String(exercise.description || '');
  const instructions = (exercise.instructions as string[] | null) || [];
  const commonMistakes = (exercise.common_mistakes as string[] | null) || [];
  const formTips = (exercise.form_tips as string[] | null) || [];
  const breathingNotes = String(exercise.breathing_notes || '');
  const primaryMuscles = (exercise.primary_muscles as string[] | null) || [];
  const secondaryMuscles = (exercise.secondary_muscles as string[] | null) || [];
  const equipment = (exercise.equipment as string[] | null) || [];

  return (
    <main className="mx-auto max-w-2xl px-4 py-4 pb-24 space-y-5">
      <header className="flex items-center gap-2">
        <Link href="/app/workout" className="rounded p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">{name}</h1>
          {exercise.category && (
            <span className="rounded bg-muted px-2 py-0.5 text-xs">{exercise.category}</span>
          )}
        </div>
      </header>

      {/* Video Gallery */}
      <VideoGallery videos={videos || []} />

      {/* Description */}
      {description && (
        <section>
          <p className="text-sm text-muted-foreground">{description}</p>
        </section>
      )}

      {/* Muscles 3D */}
      {primaryMuscles.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Músculos trabalhados</h2>
          <AnatomyViewer
            primaryGroups={primaryMuscles}
            secondaryGroups={secondaryMuscles}
            height={360}
          />
        </section>
      )}

      {/* Equipment */}
      {equipment.length > 0 && (
        <section className="space-y-1">
          <h2 className="text-sm font-semibold flex items-center gap-1">
            <Dumbbell className="h-4 w-4" /> Equipamento
          </h2>
          <div className="flex flex-wrap gap-1">
            {equipment.map((e) => (
              <span key={e} className="rounded border px-2 py-0.5 text-xs">{e}</span>
            ))}
          </div>
        </section>
      )}

      {/* Instructions */}
      {instructions.length > 0 && (
        <section className="space-y-1">
          <h2 className="text-sm font-semibold">Como executar</h2>
          <ol className="ml-4 list-decimal space-y-1 text-sm">
            {instructions.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </section>
      )}

      {/* Form tips */}
      {formTips.length > 0 && (
        <section className="space-y-1">
          <h2 className="text-sm font-semibold">Dicas de forma</h2>
          <ul className="ml-4 list-disc space-y-1 text-sm text-muted-foreground">
            {formTips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Common mistakes */}
      {commonMistakes.length > 0 && (
        <section className="space-y-1">
          <h2 className="text-sm font-semibold text-destructive">Erros comuns</h2>
          <ul className="ml-4 list-disc space-y-1 text-sm">
            {commonMistakes.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Breathing */}
      {breathingNotes && (
        <section className="space-y-1">
          <h2 className="text-sm font-semibold">Respiração</h2>
          <p className="text-sm text-muted-foreground">{breathingNotes}</p>
        </section>
      )}
    </main>
  );
}
