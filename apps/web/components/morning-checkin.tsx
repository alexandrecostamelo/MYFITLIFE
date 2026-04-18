'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BodyMap } from '@/components/body-map';
import type { MuscleRegion } from '@myfitlife/core/workout/muscles';
import { ChevronDown, ChevronUp } from 'lucide-react';

type Soreness = { region: MuscleRegion; intensity: number };

export function MorningCheckin({ onDone }: { onDone: () => void }) {
  const [sleep, setSleep] = useState(7);
  const [energy, setEnergy] = useState(7);
  const [mood, setMood] = useState(7);
  const [soreness, setSoreness] = useState<Soreness[]>([]);
  const [showBodyMap, setShowBodyMap] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sleep_quality: sleep,
        energy_level: energy,
        mood,
        soreness_details: soreness,
        sore_muscles: soreness.map((s) => s.region),
      }),
    });
    setLoading(false);
    onDone();
  }

  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-medium">Como você está hoje?</h2>

      <div className="mb-3">
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-muted-foreground">Qualidade do sono</span>
          <span className="font-medium">{sleep}/10</span>
        </div>
        <input type="range" min="1" max="10" value={sleep} onChange={(e) => setSleep(+e.target.value)} className="w-full" />
      </div>

      <div className="mb-3">
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-muted-foreground">Energia</span>
          <span className="font-medium">{energy}/10</span>
        </div>
        <input type="range" min="1" max="10" value={energy} onChange={(e) => setEnergy(+e.target.value)} className="w-full" />
      </div>

      <div className="mb-3">
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-muted-foreground">Humor</span>
          <span className="font-medium">{mood}/10</span>
        </div>
        <input type="range" min="1" max="10" value={mood} onChange={(e) => setMood(+e.target.value)} className="w-full" />
      </div>

      <div className="mb-3 rounded border">
        <button
          onClick={() => setShowBodyMap(!showBodyMap)}
          className="flex w-full items-center justify-between p-3 text-left"
          type="button"
        >
          <div>
            <div className="text-sm font-medium">Dor muscular</div>
            <div className="text-xs text-muted-foreground">
              {soreness.length === 0 ? 'Nenhuma dor marcada' : `${soreness.length} região(ões) com dor`}
            </div>
          </div>
          {showBodyMap ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showBodyMap && (
          <div className="border-t p-3">
            <p className="mb-3 text-xs text-muted-foreground">
              Toque nas regiões do corpo onde sente dor. Toque várias vezes para aumentar a intensidade.
            </p>
            <BodyMap value={soreness} onChange={setSoreness} />
          </div>
        )}
      </div>

      <Button onClick={submit} disabled={loading} className="w-full">
        {loading ? 'Salvando...' : 'Salvar check-in'}
      </Button>
    </Card>
  );
}
