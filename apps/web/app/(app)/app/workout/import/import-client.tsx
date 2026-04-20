'use client';

import { useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileDown, Loader2, CheckCircle2, AlertCircle, Check, X } from 'lucide-react';
import { parseWorkoutFile, type ParsedRow } from '@/lib/workout-import/parse';
import { matchExercise, type Confidence } from '@/lib/workout-import/match';
import { useRouter } from 'next/navigation';

interface CatalogItem {
  id: string;
  name_pt: string;
  slug: string;
}

interface PreparedRow extends ParsedRow {
  exerciseId: string | null;
  matchName: string | null;
  confidence: Confidence;
  skip: boolean;
  overridden: boolean;
}

export function WorkoutImportClient({ catalog }: { catalog: CatalogItem[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<PreparedRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFile = async (file: File) => {
    setParsing(true);
    setParseErrors([]);
    setFileName(file.name);
    try {
      const { rows: parsed, errors } = await parseWorkoutFile(file);
      if (errors.length > 0) {
        setParseErrors(errors);
        setRows([]);
        setParsing(false);
        return;
      }
      const prepared: PreparedRow[] = parsed.map((r) => {
        const m = matchExercise(r.exerciseName, catalog);
        return {
          ...r,
          exerciseId: m.exerciseId,
          matchName: m.exerciseName,
          confidence: m.confidence,
          skip: m.confidence === 'none',
          overridden: false,
        };
      });
      setRows(prepared);
      setStep('preview');
    } catch (err: any) {
      setParseErrors([err.message || 'Erro ao ler arquivo']);
    } finally {
      setParsing(false);
    }
  };

  const override = (idx: number, exerciseId: string) => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        const cat = catalog.find((c) => c.id === exerciseId);
        return {
          ...r,
          exerciseId: exerciseId || null,
          matchName: cat?.name_pt || null,
          confidence: exerciseId ? 'high' : 'none',
          overridden: !!exerciseId,
          skip: !exerciseId,
        };
      }),
    );
  };

  const toggleSkip = (idx: number) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, skip: !r.skip } : r)));
  };

  const stats = useMemo(() => {
    const total = rows.length;
    const matched = rows.filter((r) => r.exerciseId && !r.skip).length;
    const skipped = rows.filter((r) => r.skip).length;
    const unknown = rows.filter((r) => !r.exerciseId).length;
    const workouts = new Set(rows.filter((r) => r.exerciseId && !r.skip).map((r) => r.workoutLabel)).size;
    return { total, matched, skipped, unknown, workouts };
  }, [rows]);

  const doImport = async () => {
    if (stats.matched === 0) return;
    setImporting(true);
    try {
      const payload = {
        file_name: fileName,
        rows: rows.map((r) => ({
          workoutLabel: r.workoutLabel,
          exerciseId: r.exerciseId,
          exerciseNameInput: r.exerciseName,
          sets: r.sets,
          reps: r.reps,
          weightKg: r.weightKg,
          restSeconds: r.restSeconds,
          notes: r.notes,
          skip: r.skip,
        })),
      };
      const res = await fetch('/api/workouts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setStep('done');
      } else {
        alert(`Falha: ${data.message || data.error}`);
      }
    } finally {
      setImporting(false);
    }
  };

  // Done step
  if (step === 'done') {
    return (
      <div className="space-y-4 rounded-xl border bg-card p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
        <div>
          <h2 className="text-xl font-bold">Importação concluída!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {result.workouts_created} treinos criados com {result.exercises_created} exercícios
            {result.skipped > 0 && ` · ${result.skipped} linhas puladas`}
          </p>
        </div>
        <div className="flex justify-center gap-2">
          <Button onClick={() => router.push('/app/workout/templates')}>Ver meus treinos</Button>
          <Button
            variant="outline"
            onClick={() => {
              setStep('upload');
              setRows([]);
              setResult(null);
            }}
          >
            Importar outro
          </Button>
        </div>
      </div>
    );
  }

  // Preview step
  if (step === 'preview') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <StatBox label="Total" value={stats.total} />
          <StatBox label="Reconhecidos" value={stats.matched} accent="green" />
          <StatBox label="Não encontrados" value={stats.unknown} accent="red" />
          <StatBox label="Treinos" value={stats.workouts} accent="blue" />
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase">
              <tr>
                <th className="p-2 text-left">Linha</th>
                <th className="p-2 text-left">Treino</th>
                <th className="p-2 text-left">Planilha</th>
                <th className="p-2 text-left">Match</th>
                <th className="p-2 text-left">Sets x Reps</th>
                <th className="p-2 text-left">Peso</th>
                <th className="p-2 text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className={`border-t ${r.skip ? 'opacity-40' : ''}`}>
                  <td className="p-2 font-mono text-xs text-muted-foreground">{r.rowIndex}</td>
                  <td className="max-w-[120px] truncate p-2 text-xs">{r.workoutLabel}</td>
                  <td className="p-2">{r.exerciseName}</td>
                  <td className="space-y-1 p-2">
                    <ConfidenceBadge confidence={r.confidence} override={r.overridden} />
                    <select
                      value={r.exerciseId || ''}
                      onChange={(e) => override(i, e.target.value)}
                      className="w-full max-w-[220px] rounded border bg-background px-1.5 py-0.5 text-xs"
                    >
                      <option value="">— escolher —</option>
                      {catalog.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name_pt}
                        </option>
                      ))}
                    </select>
                    {r.matchName && !r.overridden && (
                      <p className="text-[11px] text-muted-foreground">→ {r.matchName}</p>
                    )}
                  </td>
                  <td className="p-2 font-mono text-xs">
                    {r.sets}×{r.reps}
                  </td>
                  <td className="p-2 text-xs">{r.weightKg ? `${r.weightKg}kg` : '—'}</td>
                  <td className="p-2 text-right">
                    <Button
                      size="sm"
                      variant={r.skip ? 'outline' : 'ghost'}
                      onClick={() => toggleSkip(i)}
                      className="h-7 px-2"
                    >
                      {r.skip ? 'Incluir' : 'Pular'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sticky bottom-4 flex items-center justify-between rounded-lg border bg-background/80 p-3 backdrop-blur">
          <p className="text-sm">
            {stats.matched} de {stats.total} serão importados em {stats.workouts} treino(s)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setStep('upload');
                setRows([]);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={doImport} disabled={stats.matched === 0 || importing}>
              {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Importar {stats.matched} linhas
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Upload step
  return (
    <div className="space-y-4">
      <a
        href="/templates/template-importacao-treinos.csv"
        download
        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        <FileDown className="h-4 w-4" /> Baixar template (.csv)
      </a>

      <div
        className="cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors hover:bg-muted/30"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <p className="font-medium">Clique para escolher arquivo</p>
        <p className="mt-1 text-xs text-muted-foreground">ou arraste um .xlsx ou .csv aqui</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      {parsing && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Lendo arquivo...
        </div>
      )}

      {parseErrors.length > 0 && (
        <div className="space-y-1 rounded-lg border border-destructive/50 bg-destructive/5 p-3">
          <p className="flex items-center gap-1 text-sm font-semibold text-destructive">
            <AlertCircle className="h-4 w-4" /> Problemas no arquivo:
          </p>
          {parseErrors.map((e, i) => (
            <p key={i} className="text-xs text-destructive">
              • {e}
            </p>
          ))}
        </div>
      )}

      <div className="space-y-2 rounded-lg border bg-muted/20 p-4 text-xs">
        <p className="font-semibold">Formato esperado:</p>
        <p>Primeira linha = cabeçalho. Colunas reconhecidas (em qualquer ordem):</p>
        <ul className="ml-4 space-y-0.5">
          <li>
            • <strong>Treino</strong>: rótulo tipo &quot;Treino A&quot;, &quot;Push Day&quot;
          </li>
          <li>
            • <strong>Exercicio</strong> (obrigatória): nome do movimento
          </li>
          <li>
            • <strong>Series</strong> (obrigatória): número (ex: 4)
          </li>
          <li>
            • <strong>Repeticoes</strong> (obrigatória): pode ser &quot;10&quot; ou &quot;8-12&quot; ou
            &quot;AMRAP&quot;
          </li>
          <li>
            • <strong>Peso (kg)</strong> (opcional)
          </li>
          <li>
            • <strong>Descanso (s)</strong> (opcional)
          </li>
          <li>
            • <strong>Observacoes</strong> (opcional)
          </li>
        </ul>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: 'green' | 'red' | 'blue';
}) {
  const colors = {
    green: 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400',
  };
  return (
    <div className={`rounded-lg border p-3 ${accent ? colors[accent] : ''}`}>
      <p className="text-xs opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function ConfidenceBadge({ confidence, override }: { confidence: Confidence; override: boolean }) {
  if (override) {
    return (
      <span className="inline-flex items-center rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
        <Check className="mr-0.5 h-3 w-3" /> Manual
      </span>
    );
  }
  switch (confidence) {
    case 'high':
      return (
        <span className="inline-flex items-center rounded bg-green-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
          <Check className="mr-0.5 h-3 w-3" /> Alta
        </span>
      );
    case 'medium':
      return (
        <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
          Média
        </span>
      );
    case 'low':
      return (
        <span className="inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium">
          Baixa
        </span>
      );
    case 'none':
      return (
        <span className="inline-flex items-center rounded bg-destructive px-1.5 py-0.5 text-[10px] font-medium text-destructive-foreground">
          <X className="mr-0.5 h-3 w-3" /> Não achou
        </span>
      );
  }
}
