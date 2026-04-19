'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormAnalyzer } from '@/components/form-analyzer';
import { EXERCISE_LABELS, type PoseCheckKey } from '@myfitlife/core/pose-rules';
import { ArrowLeft, History, Sparkles } from 'lucide-react';

const OPTIONS: Array<{ key: PoseCheckKey; emoji: string; desc: string }> = [
  { key: 'squat', emoji: '🏋️', desc: 'Análise de profundidade, alinhamento e simetria' },
  { key: 'push_up', emoji: '💪', desc: 'Checa alinhamento do corpo e amplitude' },
  { key: 'plank', emoji: '🧘', desc: 'Monitora alinhamento e tempo' },
  { key: 'lunge', emoji: '🦵', desc: 'Checa ângulo do joelho e tronco' },
];

export default function FormAnalysisPage() {
  const [selected, setSelected] = useState<PoseCheckKey | null>(null);
  const [finished, setFinished] = useState<any>(null);

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app" className="rounded p-2 hover:bg-muted"><ArrowLeft className="h-5 w-5" /></Link>
        <Sparkles className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Análise de forma</h1>
      </header>

      {!selected && !finished && (
        <>
          <Card className="mb-4 p-4 text-sm text-muted-foreground">
            Use a câmera pra receber feedback em tempo real sobre sua execução.
            A análise roda 100% no seu celular/computador — nenhum vídeo sai daqui.
          </Card>

          <Button asChild variant="outline" className="mb-4 w-full">
            <Link href="/app/form-analysis/history">
              <History className="mr-2 h-4 w-4" /> Ver histórico
            </Link>
          </Button>

          <div className="space-y-2">
            {OPTIONS.map((o) => (
              <Card
                key={o.key}
                className="cursor-pointer p-4 hover:bg-muted"
                onClick={() => setSelected(o.key)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{o.emoji}</span>
                  <div>
                    <div className="font-medium">{EXERCISE_LABELS[o.key]}</div>
                    <div className="text-xs text-muted-foreground">{o.desc}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {selected && !finished && (
        <>
          <Card className="mb-3 p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{EXERCISE_LABELS[selected]}</div>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Trocar</Button>
            </div>
          </Card>

          <FormAnalyzer
            poseCheckKey={selected}
            exerciseName={EXERCISE_LABELS[selected]}
            onFinish={(session) => setFinished(session)}
          />

          <p className="mt-3 text-center text-xs text-muted-foreground">
            Dica: afaste a câmera pra que seu corpo todo apareça no enquadramento, idealmente lateralmente.
          </p>
        </>
      )}

      {finished && (
        <>
          <Card className="mb-4 border-green-200 bg-green-50 p-6 text-center dark:border-green-900 dark:bg-green-950">
            <Sparkles className="mx-auto mb-2 h-8 w-8 text-green-600" />
            <h2 className="text-xl font-bold">Sessão registrada</h2>
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <div>
                <div className="text-2xl font-bold">{finished.reps_detected}</div>
                <div className="text-xs text-muted-foreground">reps</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{finished.avg_form_score}</div>
                <div className="text-xs text-muted-foreground">média</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{finished.best_form_score}</div>
                <div className="text-xs text-muted-foreground">melhor</div>
              </div>
            </div>
            {finished.summary_cues?.length > 0 && (
              <div className="mt-4 text-left">
                <div className="mb-1 text-xs font-medium">Pontos a melhorar:</div>
                <ul className="space-y-1 text-sm">
                  {finished.summary_cues.map((c: string, i: number) => (
                    <li key={i} className="text-muted-foreground">• {c}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => { setFinished(null); }}>Nova análise</Button>
            <Button asChild variant="outline"><Link href="/app">Voltar ao dashboard</Link></Button>
          </div>
        </>
      )}
    </main>
  );
}
