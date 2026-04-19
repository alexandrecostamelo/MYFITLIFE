const INJECTION_PATTERNS = [
  /ignore\s+(all|previous|above|prior)\s+(instructions|prompts|rules)/i,
  /disregard\s+(all|previous|above|prior)\s+(instructions|prompts|rules)/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /system\s*:\s*/i,
  /\[\s*system\s*\]/i,
  /<\s*system\s*>/i,
  /\bpretend\s+(you're|you\s+are|to\s+be)\b/i,
  /\bact\s+as\s+if\b/i,
  /\bnew\s+instructions\b/i,
  /esque[çc]a\s+(todas|as)?\s*(as\s+)?(instru[çc][õo]es|regras)/i,
  /ignore\s+(todas|as)?\s*(as\s+)?(instru[çc][õo]es|regras)/i,
  /\bvoc[êe]\s+(agora\s+)?[ée]\s+um[a]?\s+/i,
  /\bfinja\s+(ser|que)/i,
];

export type SafetyResult = {
  safe: boolean;
  reason: string | null;
  sanitized: string;
};

export function checkPromptSafety(text: string): SafetyResult {
  if (text.length > 5000) {
    return {
      safe: false,
      reason: 'input_too_long',
      sanitized: text.slice(0, 5000),
    };
  }

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return {
        safe: false,
        reason: 'injection_attempt',
        sanitized: text.replace(pattern, '[conteúdo removido]'),
      };
    }
  }

  return { safe: true, reason: null, sanitized: text };
}
