const PT_STOPWORDS = new Set([
  'a', 'o', 'as', 'os', 'um', 'uma', 'uns', 'umas',
  'de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'nos', 'nas',
  'por', 'para', 'com', 'sem', 'sobre',
  'que', 'qual', 'quais', 'quem', 'quando', 'onde', 'como', 'porque', 'porque',
  'eu', 'voce', 'voce', 'tu', 'ele', 'ela', 'nos', 'nos',
  'e', 'sou', 'sao', 'foi', 'ser', 'tem', 'tenho', 'pode', 'posso',
  'e', 'ou', 'mas', 'se', 'mesmo', 'ja', 'ja', 'ainda',
  'muito', 'pouco', 'mais', 'menos', 'tao', 'tao',
  'oi', 'ola', 'ola', 'ei',
]);

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function normalizeQuery(raw: string): string {
  if (!raw) return '';
  let s = raw.toLowerCase().trim();
  s = stripDiacritics(s);
  s = s.replace(/[^\w\s]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  const tokens = s.split(' ').filter((t) => t.length > 0 && !PT_STOPWORDS.has(t));
  tokens.sort();
  return tokens.join(' ');
}

export function hasPersonalData(raw: string): boolean {
  const lower = stripDiacritics(raw.toLowerCase());
  const markers = [
    'meu peso', 'minha altura', 'meu treino', 'minha dieta',
    'meu nome', 'minha idade', 'meu email',
    'eu pesava', 'eu pesei', 'eu treinei', 'eu comi',
    'ontem eu', 'hoje eu', 'amanha eu', 'amanha eu',
    'minha academia', 'meu personal', 'meu coach',
  ];
  return markers.some((m) => lower.includes(m));
}

export function isCacheable(raw: string, minLength = 15, maxLength = 400): boolean {
  if (!raw || raw.length < minLength || raw.length > maxLength) return false;
  if (hasPersonalData(raw)) return false;
  const tokens = normalizeQuery(raw).split(' ').filter(Boolean);
  if (tokens.length < 2) return false;
  return true;
}
