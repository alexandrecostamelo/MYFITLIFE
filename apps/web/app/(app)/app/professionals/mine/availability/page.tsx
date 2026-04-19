'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WEEKDAY_LABELS_LONG } from '@myfitlife/core/scheduling';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';

export default function AvailabilityPage() {
  const [availability, setAvailability] = useState<any[]>([]);
  const [blockedDates, setBlockedDates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekday, setWeekday] = useState(1);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');
  const [duration, setDuration] = useState(60);
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [blockReason, setBlockReason] = useState('');

  async function load() {
    const res = await fetch('/api/professionals/mine/availability');
    const data = await res.json();
    setAvailability(data.availability || []);
    setBlockedDates(data.blocked_dates || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addRule() {
    await fetch('/api/professionals/mine/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weekday,
        start_time: startTime,
        end_time: endTime,
        slot_duration_min: duration,
      }),
    });
    await load();
  }

  async function removeRule(id: string) {
    await fetch(`/api/professionals/mine/availability/${id}`, { method: 'DELETE' });
    await load();
  }

  async function addBlocked() {
    if (!newBlockedDate) return;
    await fetch('/api/professionals/mine/blocked-dates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocked_date: newBlockedDate, reason: blockReason || undefined }),
    });
    setNewBlockedDate('');
    setBlockReason('');
    await load();
  }

  async function removeBlocked(id: string) {
    await fetch(`/api/professionals/mine/blocked-dates/${id}`, { method: 'DELETE' });
    await load();
  }

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const byWeekday: Record<number, any[]> = {};
  availability.forEach((a) => {
    if (!byWeekday[a.weekday]) byWeekday[a.weekday] = [];
    byWeekday[a.weekday].push(a);
  });

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/professionals/mine" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Minha agenda</h1>
      </header>

      <Card className="mb-4 p-4">
        <h2 className="mb-3 text-sm font-medium">Adicionar horário de atendimento</h2>
        <div className="space-y-3">
          <div>
            <Label>Dia da semana</Label>
            <select value={weekday} onChange={(e) => setWeekday(Number(e.target.value))} className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm">
              {WEEKDAY_LABELS_LONG.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>Início</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <Label>Fim</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div>
              <Label>Duração (min)</Label>
              <Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min={15} max={240} step={15} />
            </div>
          </div>
          <Button onClick={addRule} className="w-full">
            <Plus className="mr-2 h-4 w-4" /> Adicionar
          </Button>
        </div>
      </Card>

      <Card className="mb-4 p-4">
        <h3 className="mb-2 text-sm font-medium">Horários configurados</h3>
        {availability.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum horário configurado ainda.</p>
        ) : (
          <div className="space-y-2">
            {Object.keys(byWeekday).sort().map((wd) => (
              <div key={wd}>
                <div className="mb-1 text-xs font-medium text-muted-foreground">{WEEKDAY_LABELS_LONG[Number(wd)]}</div>
                {byWeekday[Number(wd)].map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded border p-2 text-sm">
                    <span>{a.start_time.slice(0, 5)} - {a.end_time.slice(0, 5)} · {a.slot_duration_min} min/slot</span>
                    <button onClick={() => removeRule(a.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="mb-4 p-4">
        <h2 className="mb-3 text-sm font-medium">Datas bloqueadas (feriado, férias)</h2>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <Input type="date" value={newBlockedDate} onChange={(e) => setNewBlockedDate(e.target.value)} />
          <Input placeholder="Motivo (opcional)" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} />
        </div>
        <Button size="sm" variant="outline" onClick={addBlocked} disabled={!newBlockedDate} className="mb-3 w-full">Bloquear data</Button>

        {blockedDates.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma data bloqueada.</p>
        ) : (
          <div className="space-y-1">
            {blockedDates.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded border p-2 text-sm">
                <div>
                  <span>{new Date(b.blocked_date + 'T00:00').toLocaleDateString('pt-BR')}</span>
                  {b.reason && <span className="ml-2 text-xs text-muted-foreground">({b.reason})</span>}
                </div>
                <button onClick={() => removeBlocked(b.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </main>
  );
}
