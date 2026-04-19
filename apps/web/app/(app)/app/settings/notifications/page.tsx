'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PushToggle } from '@/components/push-toggle';
import { ArrowLeft, Loader2 } from 'lucide-react';

type Prefs = {
  email_enabled: boolean;
  workout_reminder: boolean;
  meal_reminder: boolean;
  water_reminder: boolean;
  sleep_reminder: boolean;
  weekly_summary_email: boolean;
  churn_recovery_email: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
};

const DEFAULT_PREFS: Prefs = {
  email_enabled: true,
  workout_reminder: true,
  meal_reminder: false,
  water_reminder: false,
  sleep_reminder: false,
  weekly_summary_email: true,
  churn_recovery_email: true,
  quiet_hours_start: '22:00',
  quiet_hours_end: '07:00',
};

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/me/notification-prefs')
      .then((r) => r.json())
      .then((d) => {
        if (d.prefs) setPrefs((p) => ({ ...p, ...d.prefs }));
        setLoading(false);
      });
  }, []);

  async function save() {
    setSaving(true);
    await fetch('/api/me/notification-prefs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs),
    });
    setSaving(false);
  }

  function toggle(key: keyof Prefs) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  }

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/profile" className="rounded p-2 hover:bg-muted"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Notificações</h1>
      </header>

      <Card className="mb-4 p-4">
        <h2 className="mb-2 text-sm font-medium">Notificações push</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Receba lembretes e mensagens do coach diretamente no seu navegador.
        </p>
        <PushToggle />
      </Card>

      <Card className="mb-4 p-4">
        <h2 className="mb-3 text-sm font-medium">Email</h2>
        <Toggle label="Emails gerais" checked={prefs.email_enabled} onChange={() => toggle('email_enabled')} />
        <Toggle label="Resumo semanal (segunda-feira)" checked={prefs.weekly_summary_email} onChange={() => toggle('weekly_summary_email')} disabled={!prefs.email_enabled} />
        <Toggle label="Convite para voltar quando sumir por muito tempo" checked={prefs.churn_recovery_email} onChange={() => toggle('churn_recovery_email')} disabled={!prefs.email_enabled} />
      </Card>

      <Card className="mb-4 p-4">
        <h2 className="mb-3 text-sm font-medium">Lembretes (push)</h2>
        <Toggle label="Lembrete de treino" checked={prefs.workout_reminder} onChange={() => toggle('workout_reminder')} />
        <Toggle label="Lembrete de refeição" checked={prefs.meal_reminder} onChange={() => toggle('meal_reminder')} />
        <Toggle label="Beber água" checked={prefs.water_reminder} onChange={() => toggle('water_reminder')} />
        <Toggle label="Hora de dormir" checked={prefs.sleep_reminder} onChange={() => toggle('sleep_reminder')} />
      </Card>

      <Card className="mb-4 p-4">
        <h2 className="mb-3 text-sm font-medium">Horário de silêncio</h2>
        <p className="mb-3 text-xs text-muted-foreground">Nenhum push será enviado entre esses horários.</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Início</Label>
            <Input type="time" value={prefs.quiet_hours_start} onChange={(e) => setPrefs((p) => ({ ...p, quiet_hours_start: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Fim</Label>
            <Input type="time" value={prefs.quiet_hours_end} onChange={(e) => setPrefs((p) => ({ ...p, quiet_hours_end: e.target.value }))} />
          </div>
        </div>
      </Card>

      <Button onClick={save} disabled={saving} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar preferências'}
      </Button>
    </main>
  );
}

function Toggle({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <label className={`flex cursor-pointer items-center justify-between py-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <span className="text-sm">{label}</span>
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={onChange} disabled={disabled} />
      <div className="relative h-6 w-11 flex-shrink-0 rounded-full bg-slate-300 peer-checked:bg-primary transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5 dark:bg-slate-600" />
    </label>
  );
}
