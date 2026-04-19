'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, FileText, FileSpreadsheet, Share2, Dumbbell, Utensils, Scale, Activity } from 'lucide-react';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function ReportsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/reports/monthly?year=${year}&month=${month}`);
    setData(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [year, month]);

  function downloadCSV() {
    window.location.href = `/api/reports/monthly/csv?year=${year}&month=${month}`;
  }

  async function downloadPDF() {
    setDownloadingPdf(true);
    try {
      const res = await fetch(`/api/reports/monthly/pdf?year=${year}&month=${month}`);
      const blob = await res.blob();
      triggerDownload(blob, `myfitlife-${year}-${String(month).padStart(2, '0')}.pdf`);
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function sharePDF() {
    setDownloadingPdf(true);
    try {
      const res = await fetch(`/api/reports/monthly/pdf?year=${year}&month=${month}`);
      const blob = await res.blob();
      const file = new File([blob], `myfitlife-${year}-${month}.pdf`, { type: 'application/pdf' });
      if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Relatório ${MONTH_NAMES[month - 1]} ${year}`,
          text: 'Meu relatório mensal do MyFitLife',
        });
      } else {
        triggerDownload(blob, `myfitlife-${year}-${String(month).padStart(2, '0')}.pdf`);
      }
    } catch {
      // user cancelled share
    } finally {
      setDownloadingPdf(false);
    }
  }

  function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/profile" className="rounded p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <FileText className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Relatórios mensais</h1>
      </header>

      {/* Seletor de período */}
      <Card className="mb-4 p-3">
        <div className="grid grid-cols-2 gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="rounded-md border border-input bg-transparent px-3 py-1.5 text-sm"
          >
            {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="rounded-md border border-input bg-transparent px-3 py-1.5 text-sm"
          >
            {Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </Card>

      {loading ? (
        <div className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : !data ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">Sem dados</Card>
      ) : (
        <>
          <Card className="mb-4 p-4">
            <h2 className="mb-3 text-lg font-bold">{data.period?.month_label}</h2>

            <div className="grid grid-cols-2 gap-2 text-center">
              <Card className="p-3">
                <Dumbbell className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                <div className="text-2xl font-bold">{data.summary?.workouts_count ?? 0}</div>
                <div className="text-xs text-muted-foreground">treinos</div>
              </Card>
              <Card className="p-3">
                <Utensils className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                <div className="text-2xl font-bold">{data.summary?.meals_count ?? 0}</div>
                <div className="text-xs text-muted-foreground">refeições</div>
              </Card>
              <Card className="p-3">
                <Activity className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                <div className="text-2xl font-bold">{data.summary?.workouts_total_minutes ?? 0}</div>
                <div className="text-xs text-muted-foreground">minutos</div>
              </Card>
              <Card className="p-3">
                <Scale className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                <div className="text-2xl font-bold">
                  {data.summary?.weight_change_kg != null
                    ? `${data.summary.weight_change_kg > 0 ? '+' : ''}${data.summary.weight_change_kg}`
                    : '—'}
                </div>
                <div className="text-xs text-muted-foreground">kg no mês</div>
              </Card>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 border-t pt-3 text-center text-xs">
              <div>
                <div className="font-bold text-sm">{data.summary?.avg_calories_per_day ?? 0}</div>
                <div className="text-muted-foreground">média kcal/dia</div>
              </div>
              <div>
                <div className="font-bold text-sm">{data.summary?.xp_gained ?? 0}</div>
                <div className="text-muted-foreground">XP ganho</div>
              </div>
              <div>
                <div className="font-bold text-sm">{data.summary?.new_skills_mastered ?? 0}</div>
                <div className="text-muted-foreground">skills</div>
              </div>
            </div>

            {data.checkins_summary?.count > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2 border-t pt-3 text-center text-xs">
                <div>
                  <div className="font-bold text-sm">{data.checkins_summary.avg_sleep}</div>
                  <div className="text-muted-foreground">sono (0-10)</div>
                </div>
                <div>
                  <div className="font-bold text-sm">{data.checkins_summary.avg_energy}</div>
                  <div className="text-muted-foreground">energia</div>
                </div>
                <div>
                  <div className="font-bold text-sm">{data.checkins_summary.avg_mood}</div>
                  <div className="text-muted-foreground">humor</div>
                </div>
              </div>
            )}
          </Card>

          {/* Botões de exportação */}
          <div className="mb-3 grid grid-cols-2 gap-2">
            <Button onClick={downloadCSV} variant="outline" className="w-full">
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Baixar CSV
            </Button>
            <Button onClick={downloadPDF} disabled={downloadingPdf} className="w-full">
              {downloadingPdf
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <><FileText className="mr-2 h-4 w-4" /> Baixar PDF</>}
            </Button>
          </div>

          <Button onClick={sharePDF} disabled={downloadingPdf} variant="outline" className="mb-4 w-full">
            <Share2 className="mr-2 h-4 w-4" /> Compartilhar PDF
          </Button>

          <Card className="p-3 text-xs">
            <div className="mb-1 font-medium">Conteúdo do relatório</div>
            <ul className="space-y-0.5 text-muted-foreground">
              <li>• Resumo do mês (KPIs)</li>
              <li>• Todos os treinos com duração e esforço</li>
              <li>• Macronutrientes e calorias por dia</li>
              <li>• Histórico de peso</li>
              <li>• Biomarcadores (se houve exame no período)</li>
            </ul>
            <p className="mt-2 text-muted-foreground">
              O PDF é ideal pra levar ao nutricionista ou médico.
              O CSV abre no Excel / Google Sheets.
            </p>
          </Card>
        </>
      )}
    </main>
  );
}
