'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2, Trophy, Dumbbell, Zap, Scale, Image, Activity } from 'lucide-react';

const TOGGLES = [
  { key: 'share_stats', label: 'Estatísticas de gamificação', description: 'Nível, XP, streak', icon: Trophy },
  { key: 'share_workouts', label: 'Treinos', description: 'Quantidade e minutos no período', icon: Dumbbell },
  { key: 'share_skills', label: 'Árvore de habilidades', description: 'Habilidades dominadas', icon: Zap },
  { key: 'share_weight', label: 'Peso atual', description: 'Seu peso mais recente registrado', icon: Scale },
  { key: 'share_progress_photos', label: 'Fotos de progresso', description: 'Fotos corporais de evolução', icon: Image },
  { key: 'share_biomarkers', label: 'Biomarcadores', description: 'Exames e métricas de saúde', icon: Activity },
] as const;

type PrefsKey = typeof TOGGLES[number]['key'];
type Prefs = Record<PrefsKey, boolean>;

const DEFAULTS: Prefs = {
  share_stats: true,
  share_workouts: true,
  share_skills: true,
  share_weight: false,
  share_progress_photos: false,
  share_biomarkers: false,
};

export default function ComparisonPrivacyPage() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/me/comparison-prefs').then((r) => r.json()).then((d) => {
      if (d.prefs) {
        setPrefs({
          share_stats: d.prefs.share_stats ?? true,
          share_workouts: d.prefs.share_workouts ?? true,
          share_skills: d.prefs.share_skills ?? true,
          share_weight: d.prefs.share_weight ?? false,
          share_progress_photos: d.prefs.share_progress_photos ?? false,
          share_biomarkers: d.prefs.share_biomarkers ?? false,
        });
      }
      setLoading(false);
    });
  }, []);

  async function toggle(key: PrefsKey) {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setSaving(true);
    setSaved(false);
    await fetch('/api/me/comparison-prefs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/profile" className="rounded p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Privacidade de comparação</h1>
          <p className="text-xs text-muted-foreground">Escolha o que seus amigos podem ver ao comparar com você</p>
        </div>
      </header>

      <Card className="divide-y">
        {TOGGLES.map(({ key, label, description, icon: Icon }) => (
          <div key={key} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">{label}</div>
                <div className="text-xs text-muted-foreground">{description}</div>
              </div>
            </div>
            <button
              role="switch"
              aria-checked={prefs[key]}
              onClick={() => toggle(key)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                prefs[key] ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  prefs[key] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </Card>

      <div className="mt-4 text-center text-xs text-muted-foreground">
        {saving && <span className="flex items-center justify-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Salvando…</span>}
        {saved && <span className="text-green-600">Preferências salvas</span>}
        {!saving && !saved && <span>As alterações são salvas automaticamente</span>}
      </div>
    </main>
  );
}
