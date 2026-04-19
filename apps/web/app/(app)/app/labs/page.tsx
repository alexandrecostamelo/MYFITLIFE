'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, FlaskConical, CheckCircle, AlertCircle, Clock } from 'lucide-react';

type Exam = {
  id: string;
  title: string;
  exam_date: string | null;
  lab_name: string | null;
  processed: boolean;
  processing_error: string | null;
  created_at: string;
};

export default function LabsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadExams() {
    const d = await fetch('/api/lab-exams').then((r) => r.json());
    setExams(d.exams || []);
  }

  useEffect(() => {
    loadExams().finally(() => setLoading(false));
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/lab-exams', { method: 'POST', body: fd });
    const data = await res.json();

    if (res.status === 429) {
      alert('Limite diário de 5 envios atingido. Tente novamente amanhã.');
      setUploading(false);
      return;
    }

    if (data.error && data.error !== 'no_json_extracted') {
      alert(`Erro: ${data.error}`);
    } else {
      await loadExams();
    }
    setUploading(false);
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-blue-600" />
          <h1 className="text-xl font-bold">Exames Laboratoriais</h1>
        </div>
        <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Enviar exame
        </Button>
        <input ref={fileRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleUpload} />
      </div>

      <Card className="border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        Envie PDFs ou fotos dos seus exames. O coach extrai os biomarcadores automaticamente. Limite: 5 por dia.
      </Card>

      {exams.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">Nenhum exame enviado ainda.</p>
      )}

      <div className="space-y-3">
        {exams.map((exam) => (
          <Link key={exam.id} href={`/app/labs/${exam.id}`}>
            <Card className="flex items-center gap-3 px-4 py-3 transition hover:shadow-sm cursor-pointer">
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-sm">{exam.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {exam.lab_name && <span>{exam.lab_name} · </span>}
                  {exam.exam_date || new Date(exam.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              {!exam.processed ? (
                <span className="flex shrink-0 items-center gap-1 rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                  <Clock className="h-3 w-3" /> Processando
                </span>
              ) : exam.processing_error ? (
                <span className="flex shrink-0 items-center gap-1 rounded border border-red-300 bg-red-50 px-2 py-0.5 text-xs text-red-700">
                  <AlertCircle className="h-3 w-3" /> Erro
                </span>
              ) : (
                <span className="flex shrink-0 items-center gap-1 rounded border border-green-300 bg-green-50 px-2 py-0.5 text-xs text-green-700">
                  <CheckCircle className="h-3 w-3" /> Processado
                </span>
              )}
            </Card>
          </Link>
        ))}
      </div>

      {exams.length > 0 && (
        <div className="text-center">
          <Link href="/app/labs/markers" className="text-sm text-primary underline">
            Ver todos os biomarcadores →
          </Link>
        </div>
      )}
    </div>
  );
}
