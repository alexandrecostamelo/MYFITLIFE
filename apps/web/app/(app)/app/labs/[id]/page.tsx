'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Trash2, ExternalLink } from 'lucide-react';

type Biomarker = {
  id: string;
  marker_name: string;
  value: number;
  unit: string;
  reference_min: number | null;
  reference_max: number | null;
  status: 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high' | null;
};

type Exam = { id: string; title: string; exam_date: string | null; lab_name: string | null; processed: boolean; processing_error: string | null };

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  normal: { label: 'Normal', cls: 'border-green-300 bg-green-50 text-green-700' },
  low: { label: 'Baixo', cls: 'border-amber-300 bg-amber-50 text-amber-700' },
  high: { label: 'Alto', cls: 'border-amber-300 bg-amber-50 text-amber-700' },
  critical_low: { label: 'Crítico baixo', cls: 'border-red-400 bg-red-50 text-red-700' },
  critical_high: { label: 'Crítico alto', cls: 'border-red-400 bg-red-50 text-red-700' },
};

function statusOrder(s: string | null) {
  if (s === 'critical_low' || s === 'critical_high') return 0;
  if (s === 'low' || s === 'high') return 1;
  return 2;
}

export default function LabDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [biomarkers, setBiomarkers] = useState<Biomarker[]>([]);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/lab-exams/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setExam(d.exam);
        setBiomarkers((d.biomarkers || []).sort((a: Biomarker, b: Biomarker) => statusOrder(a.status) - statusOrder(b.status)));
        setFileUrl(d.file_url || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function deleteExam() {
    if (!confirm('Excluir este exame? Esta ação não pode ser desfeita.')) return;
    setDeleting(true);
    await fetch(`/api/lab-exams/${id}`, { method: 'DELETE' });
    router.push('/app/labs');
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!exam) return <div className="py-20 text-center text-sm text-muted-foreground">Exame não encontrado.</div>;

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="truncate text-lg font-bold">{exam.title}</h1>
          <p className="text-xs text-muted-foreground">
            {exam.lab_name && <span>{exam.lab_name} · </span>}
            {exam.exam_date || '—'}
          </p>
        </div>
        {fileUrl && (
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="icon"><ExternalLink className="h-4 w-4" /></Button>
          </a>
        )}
        <Button variant="ghost" size="icon" className="text-destructive" onClick={deleteExam} disabled={deleting}>
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
      </div>

      {exam.processing_error && (
        <Card className="border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Não foi possível extrair biomarcadores deste exame. Você ainda pode visualizá-lo pelo ícone de link.
        </Card>
      )}

      {biomarkers.length === 0 && !exam.processing_error && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {exam.processed ? 'Nenhum biomarcador encontrado.' : 'Exame ainda sendo processado...'}
        </p>
      )}

      {biomarkers.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {biomarkers.length} biomarcadores
          </h2>
          {biomarkers.map((b) => {
            const badge = b.status ? STATUS_BADGE[b.status] : null;
            const hasRef = b.reference_min !== null && b.reference_max !== null;
            const pct = hasRef ? Math.min(100, Math.max(0, ((b.value - b.reference_min!) / (b.reference_max! - b.reference_min!)) * 100)) : null;

            return (
              <Card key={b.id} className="px-4 py-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm">{b.marker_name}</span>
                  {badge && (
                    <span className={`shrink-0 rounded border px-1.5 py-0.5 text-xs ${badge.cls}`}>{badge.label}</span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold">{b.value}</span>
                  <span className="text-xs text-muted-foreground">{b.unit}</span>
                  {hasRef && <span className="ml-2 text-xs text-muted-foreground">ref: {b.reference_min}–{b.reference_max}</span>}
                </div>
                {pct !== null && (
                  <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div className={`h-full rounded-full ${(b.status === 'critical_low' || b.status === 'critical_high') ? 'bg-red-500' : (b.status === 'low' || b.status === 'high') ? 'bg-amber-400' : 'bg-green-500'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
