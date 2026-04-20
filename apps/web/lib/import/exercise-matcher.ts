export function fuzzyMatch(
  input: string,
  candidates: { id: string; name: string }[],
): { id: string; name: string; score: number } | null {
  const normalized = input.toLowerCase().trim();

  // exact match
  for (const c of candidates) {
    if (c.name.toLowerCase() === normalized)
      return { ...c, score: 1.0 };
  }

  let bestMatch: { id: string; name: string; score: number } | null = null;

  for (const c of candidates) {
    const cNorm = c.name.toLowerCase();
    const score = similarity(normalized, cNorm);
    if (score > 0.6 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { ...c, score };
    }
  }

  return bestMatch;
}

function similarity(a: string, b: string): number {
  // Jaccard on words
  const aWords = new Set(a.split(/[\s\-_()]+/).filter(Boolean));
  const bWords = new Set(b.split(/[\s\-_()]+/).filter(Boolean));
  let intersection = 0;
  for (const w of aWords) if (bWords.has(w)) intersection++;
  const union = new Set([...aWords, ...bWords]).size;
  const jaccard = union > 0 ? intersection / union : 0;

  // Substring containment
  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;
  const containment = longer.includes(shorter)
    ? shorter.length / longer.length
    : 0;

  return Math.max(jaccard, containment);
}
