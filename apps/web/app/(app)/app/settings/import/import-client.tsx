'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Upload,
  FileText,
  Check,
  AlertTriangle,
  Loader2,
  HelpCircle,
} from 'lucide-react';

const SOURCE_LABELS: Record<string, string> = {
  strong: 'Strong',
  hevy: 'Hevy',
  strava: 'Strava (GPX)',
  csv: 'CSV Genérico',
  excel: 'Excel',
};

interface Preview {
  source: string;
  total_workouts: number;
  total_sets: number;
  unique_exercises: number;
  date_range: { start: string; end: string };
  sample: { date: string; name: string; exercises: number; sets: number }[];
  error?: string;
}

interface ImportResult {
  imported_workouts: number;
  imported_sets: number;
  skipped: number;
  total: number;
  source: string;
}

interface Props {
  history: Record<string, unknown>[];
}

export function ImportClient({ history }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const loadPreview = async (f: File) => {
    setFile(f);
    setResult(null);
    setPreview(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', f);
      fd.append('action', 'preview');
      const res = await fetch('/api/import/workouts', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (res.ok) setPreview(data);
      else setPreview({ error: data.error } as Preview);
    } finally {
      setLoading(false);
    }
  };

  const doImport = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('action', 'import');
      const res = await fetch('/api/import/workouts', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      setResult(data);
      setPreview(null);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-lg px-4 py-6 pb-24 space-y-5">
      <div>
        <h1 className="display-title">Importar treinos</h1>
        <p className="text-sm text-muted-foreground">
          Strong, Hevy ou Strava (GPX)
        </p>
      </div>

      {/* Upload area */}
      <section className="glass-card p-6 text-center space-y-3">
        <Upload className="h-10 w-10 mx-auto text-accent" />
        <p className="text-sm">
          Selecione seu arquivo de exportação (.csv ou .gpx)
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.gpx"
          className="hidden"
          onChange={(e) =>
            e.target.files?.[0] && loadPreview(e.target.files[0])
          }
        />
        <Button onClick={() => fileRef.current?.click()} variant="outline">
          Selecionar arquivo
        </Button>
        {file && (
          <p className="text-xs text-muted-foreground">
            {file.name} ({(file.size / 1024).toFixed(0)} KB)
          </p>
        )}
      </section>

      {/* Preview */}
      {loading && !preview && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      )}

      {preview && !preview.error && (
        <section className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold">
              Preview — {SOURCE_LABELS[preview.source] || preview.source}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="glass-card p-2 text-center">
              <p className="metric-number text-xl">
                {preview.total_workouts}
              </p>
              <p className="metric-label">Treinos</p>
            </div>
            <div className="glass-card p-2 text-center">
              <p className="metric-number text-xl">{preview.total_sets}</p>
              <p className="metric-label">Séries</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {preview.unique_exercises} exercícios ·{' '}
            {preview.date_range.start} a {preview.date_range.end}
          </p>
          {preview.sample?.map((s, i) => (
            <div key={i} className="text-xs text-muted-foreground">
              {s.date} — {s.name} ({s.exercises} exercícios, {s.sets} séries)
            </div>
          ))}
          <Button onClick={doImport} disabled={loading} className="w-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Importar {preview.total_workouts} treinos
          </Button>
        </section>
      )}

      {preview?.error && (
        <div className="glass-card p-4 border border-destructive/40 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <p className="text-sm">
            Não foi possível ler o arquivo. Verifique o formato.
          </p>
        </div>
      )}

      {/* Result */}
      {result && (
        <section className="glass-card p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold">Importação concluída</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {result.imported_workouts} treinos importados ·{' '}
            {result.imported_sets} séries
            {result.skipped > 0 &&
              ` · ${result.skipped} ignorados (já existiam)`}
          </p>
        </section>
      )}

      {/* Help */}
      <button
        onClick={() => setShowHelp(!showHelp)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <HelpCircle className="h-3 w-3" />
        Como exportar dos outros apps?
      </button>
      {showHelp && (
        <section className="glass-card p-4 space-y-3 text-sm">
          <div>
            <p className="font-semibold">Strong</p>
            <p className="text-xs text-muted-foreground">
              Configurações → Exportar dados → CSV → envie pra si mesmo
            </p>
          </div>
          <div>
            <p className="font-semibold">Hevy</p>
            <p className="text-xs text-muted-foreground">
              Configurações → Dados → Exportar treinos → CSV
            </p>
          </div>
          <div>
            <p className="font-semibold">Strava</p>
            <p className="text-xs text-muted-foreground">
              Configurações → Minha conta → Dados → Solicitar download → Baixa
              ZIP com arquivos .gpx
            </p>
          </div>
        </section>
      )}

      {/* History */}
      {history.length > 0 && (
        <section className="space-y-2">
          <h2 className="section-title">Histórico</h2>
          {history.map((h) => {
            const src = String(h.source || '');
            const status = String(h.status || '');
            return (
              <div
                key={String(h.id)}
                className="glass-card p-3 flex items-center justify-between text-sm"
              >
                <div>
                  <p className="font-medium">
                    {SOURCE_LABELS[src] || src}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(
                      String(h.created_at),
                    ).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs">
                    {Number(h.imported_workouts)}/{Number(h.total_workouts)}{' '}
                    treinos
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {status}
                  </p>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
}
