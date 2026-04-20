interface ExerciseRow {
  id: string;
  name_pt: string;
  slug: string;
}

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalize(s: string): string {
  return stripDiacritics(s.toLowerCase().trim())
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(s: string): Set<string> {
  return new Set(normalize(s).split(' ').filter((t) => t.length > 1));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  const inter = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);
  return inter.size / union.size;
}

export type Confidence = 'high' | 'medium' | 'low' | 'none';

export interface MatchResult {
  exerciseId: string | null;
  exerciseName: string | null;
  score: number;
  confidence: Confidence;
}

export function matchExercise(
  input: string,
  catalog: ExerciseRow[],
): MatchResult {
  if (!input || !catalog.length) {
    return { exerciseId: null, exerciseName: null, score: 0, confidence: 'none' };
  }

  const inputNorm = normalize(input);
  const inputTokens = tokenSet(input);

  let best = { id: '', name: '', score: 0 };

  for (const ex of catalog) {
    const candidates = [ex.name_pt, ex.slug.replace(/-/g, ' ')];
    for (const cand of candidates) {
      const candNorm = normalize(cand);

      // Exact match
      if (candNorm === inputNorm) {
        return { exerciseId: ex.id, exerciseName: ex.name_pt, score: 1, confidence: 'high' };
      }

      // Contains match
      if (candNorm.includes(inputNorm) || inputNorm.includes(candNorm)) {
        const containsScore = 0.85;
        if (containsScore > best.score) {
          best = { id: ex.id, name: ex.name_pt, score: containsScore };
        }
      }

      // Jaccard similarity
      const jac = jaccard(inputTokens, tokenSet(cand));
      if (jac > best.score) {
        best = { id: ex.id, name: ex.name_pt, score: jac };
      }
    }
  }

  if (best.score >= 0.75) return { exerciseId: best.id, exerciseName: best.name, score: best.score, confidence: 'high' };
  if (best.score >= 0.55) return { exerciseId: best.id, exerciseName: best.name, score: best.score, confidence: 'medium' };
  if (best.score >= 0.35) return { exerciseId: best.id, exerciseName: best.name, score: best.score, confidence: 'low' };
  return { exerciseId: null, exerciseName: null, score: best.score, confidence: 'none' };
}
