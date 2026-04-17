'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function MorningCheckin({ onDone }: { onDone: () => void }) {
  const [sleep, setSleep] = useState(7);
  const [energy, setEnergy] = useState(7);
  const [mood, setMood] = useState(7);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sleep_quality: sleep, energy_level: energy, mood }),
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

      <div className="mb-4">
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-muted-foreground">Humor</span>
          <span className="font-medium">{mood}/10</span>
        </div>
        <input type="range" min="1" max="10" value={mood} onChange={(e) => setMood(+e.target.value)} className="w-full" />
      </div>

      <Button onClick={submit} disabled={loading} className="w-full">
        {loading ? 'Salvando...' : 'Salvar check-in'}
      </Button>
    </Card>
  );
}
