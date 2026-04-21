import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const { workout_type, exercises } = body as {
    workout_type?: string;
    exercises?: string[];
  };

  const { data: profile } = await supabase
    .from('profiles')
    .select('cached_readiness_score, cached_readiness_zone')
    .eq('id', user.id)
    .single();

  const prof = profile as Record<string, unknown> | null;
  const readiness = Number(prof?.cached_readiness_score) || 70;
  const zone = String(prof?.cached_readiness_zone || 'green');

  const exerciseList = (exercises || []).join(', ');
  const prompt = `Gere um aquecimento de 5-8 exercícios para preparar o corpo para este treino: ${exerciseList}.
Tipo de treino: ${workout_type || 'full body'}.
Readiness do corpo: ${readiness}/100 (zona ${zone}).
${zone === 'red' ? 'IMPORTANTE: readiness muito baixo. Aquecimento deve ser suave, com foco em mobilidade e ativação neural leve.' : ''}
${zone === 'yellow' ? 'Readiness moderado. Aquecimento com progressão gradual.' : ''}

Responda APENAS em JSON, sem markdown:
[{"name":"nome do exercício","reps":10,"duration_sec":null},...]
Onde reps OU duration_sec (não ambos). Exercícios devem ser específicos pro treino do dia.`;

  try {
    const { callWithRetry } = await import('@myfitlife/ai');
    const result = await callWithRetry({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system:
        'Você é um preparador físico. Responda apenas JSON válido, sem markdown.',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const cleaned = result.text.replace(/```json|```/g, '').trim();
    const warmupExercises = JSON.parse(cleaned);

    return NextResponse.json({ exercises: warmupExercises });
  } catch {
    const fallback = [
      { name: 'Polichinelo', duration_sec: 30 },
      { name: 'Rotação de braços', reps: 10 },
      { name: 'Agachamento livre', reps: 10 },
      { name: 'Mobilidade de quadril', reps: 8 },
      { name: 'Prancha', duration_sec: 20 },
    ];
    return NextResponse.json({ exercises: fallback });
  }
}
