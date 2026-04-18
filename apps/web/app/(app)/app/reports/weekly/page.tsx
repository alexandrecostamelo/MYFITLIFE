'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Dumbbell, Utensils, Sunrise, Zap, Scale } from 'lucide-react';

export default function WeeklyReportPage() {
  const [offset, setOffset] = useState(0);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/weekly?offset=${offset}`).then((r) => r.json()).then((d) => {
      setReport(d.report);
      setLoading(false);
    });
  }, [offset]);

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Sua semana</h1>
      </header>

      <div className="mb-4 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => setOffset(offset + 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          {offset === 0 ? 'Esta semana' : offset === 1 ? 'Semana passada' : `${offset} semanas atrás`}
        </span>
        <Button variant="outline" size="sm" onClick={() => setOffset(Math.max(0, offset - 1))} disabled={offset === 0}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : !report ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">Sem dados.</Card>
      ) : (
        <>
          <Card className="mb-4 bg-primary/5 p-4">
            <p className="text-center text-sm font-medium">{report.highlight}</p>
          </Card>

          <div className="mb-4 grid grid-cols-2 gap-2">
            <StatCard icon={Dumbbell} label="Treinos" value={report.workouts_count} sub={`${report.workouts_minutes} min`} />
            <StatCard icon={Zap} label="XP ganho" value={report.xp_earned} sub="pontos" />
            <StatCard icon={Utensils} label="Refeições" value={report.meals_count} sub={`${report.total_calories} kcal`} />
            <StatCard icon={Sunrise} label="Check-ins" value={report.checkins_count} sub={`sono ${report.avg_sleep}/10`} />
          </div>

          {report.weight_change_kg !== null && (
            <Card className="mb-4 p-4">
              <div className="flex items-center gap-3">
                <Scale className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Variação de peso</div>
                  <div className="text-lg font-bold">
                    {report.weight_change_kg > 0 ? '+' : ''}{report.weight_change_kg} kg
                  </div>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-4 text-sm">
            <div className="space-y-1 text-muted-foreground">
              <div>Semana: {new Date(report.week_start).toLocaleDateString('pt-BR')} a {new Date(report.week_end).toLocaleDateString('pt-BR')}</div>
              <div>Proteína total: {report.total_protein_g} g</div>
              <div>Energia média no check-in: {report.avg_energy}/10</div>
              {report.avg_perceived_effort > 0 && <div>Esforço médio: {report.avg_perceived_effort}/10</div>}
            </div>
          </Card>
        </>
      )}
    </main>
  );
}

function StatCard({ icon: Icon, label, value, sub }: any) {
  return (
    <Card className="p-3">
      <div className="mb-1 flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </Card>
  );
}
