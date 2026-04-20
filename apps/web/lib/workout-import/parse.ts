import * as XLSX from 'xlsx';

export interface ParsedRow {
  workoutLabel: string;
  exerciseName: string;
  sets: number;
  reps: string;
  weightKg: number | null;
  restSeconds: number | null;
  notes: string;
  rowIndex: number;
}

const COLUMN_ALIASES: Record<keyof Omit<ParsedRow, 'rowIndex'>, string[]> = {
  workoutLabel: ['treino', 'workout', 'dia', 'day', 'divisao', 'bloco'],
  exerciseName: ['exercicio', 'exercise', 'nome', 'movimento'],
  sets: ['series', 'sets', 'sets/series'],
  reps: ['repeticoes', 'reps', 'rep', 'repeticao'],
  weightKg: ['peso', 'weight', 'carga', 'kg', 'peso kg'],
  restSeconds: ['descanso', 'rest', 'intervalo', 'descanso s'],
  notes: ['observacoes', 'observacao', 'notas', 'notes', 'obs'],
};

function normHeader(s: string): string {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveColumn(
  headers: string[],
  field: keyof typeof COLUMN_ALIASES,
): number {
  const normHeaders = headers.map(normHeader);
  for (const alias of COLUMN_ALIASES[field]) {
    const idx = normHeaders.indexOf(alias);
    if (idx >= 0) return idx;
  }
  for (let i = 0; i < normHeaders.length; i++) {
    for (const alias of COLUMN_ALIASES[field]) {
      if (normHeaders[i].includes(alias)) return i;
    }
  }
  return -1;
}

function parseNumber(v: any): number | null {
  if (v === null || v === undefined || v === '') return null;
  const cleaned = String(v).replace(',', '.').replace(/[^\d.-]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseInt10(v: any): number {
  const n = parseNumber(v);
  return n === null ? 0 : Math.round(n);
}

export async function parseWorkoutFile(file: File): Promise<{
  rows: ParsedRow[];
  headers: string[];
  errors: string[];
}> {
  const errors: string[] = [];
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    return { rows: [], headers: [], errors: ['Planilha sem abas'] };
  }
  const sheet = wb.Sheets[sheetName];
  const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (raw.length < 2) {
    return { rows: [], headers: [], errors: ['Planilha precisa ter header + ao menos 1 linha'] };
  }

  const headers = raw[0].map((h: any) => String(h || ''));
  const idxWorkout = resolveColumn(headers, 'workoutLabel');
  const idxName = resolveColumn(headers, 'exerciseName');
  const idxSets = resolveColumn(headers, 'sets');
  const idxReps = resolveColumn(headers, 'reps');
  const idxWeight = resolveColumn(headers, 'weightKg');
  const idxRest = resolveColumn(headers, 'restSeconds');
  const idxNotes = resolveColumn(headers, 'notes');

  if (idxName < 0) errors.push('Coluna "Exercicio" não encontrada');
  if (idxSets < 0) errors.push('Coluna "Series" não encontrada');
  if (idxReps < 0) errors.push('Coluna "Repeticoes" não encontrada');

  if (errors.length > 0) return { rows: [], headers, errors };

  const rows: ParsedRow[] = [];
  for (let i = 1; i < raw.length; i++) {
    const r = raw[i];
    const name = String(r[idxName] || '').trim();
    if (!name) continue;
    rows.push({
      workoutLabel: idxWorkout >= 0 ? String(r[idxWorkout] || 'Treino A').trim() : 'Treino A',
      exerciseName: name,
      sets: parseInt10(r[idxSets]) || 3,
      reps: String(r[idxReps] || '10').trim(),
      weightKg: idxWeight >= 0 ? parseNumber(r[idxWeight]) : null,
      restSeconds: idxRest >= 0 ? parseInt10(r[idxRest]) || null : null,
      notes: idxNotes >= 0 ? String(r[idxNotes] || '').trim() : '',
      rowIndex: i + 1,
    });
  }

  return { rows, headers, errors };
}
