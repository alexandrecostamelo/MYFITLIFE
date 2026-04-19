import Anthropic from '@anthropic-ai/sdk';

export interface TransformationModerationResult {
  status: 'auto_approved' | 'needs_review' | 'auto_rejected';
  confidence: number;
  flags: string[];
  reasoning: string;
}

const SYSTEM_PROMPT = `Você é um moderador de conteúdo para um app fitness brasileiro que publica fotos de transformação corporal. Sua tarefa é analisar se DUAS fotos (antes e depois) de um usuário são apropriadas para publicação em galeria pública.

As fotos JÁ foram anonimizadas: rosto coberto por máscara preta elíptica e marca d'água da plataforma adicionada.

Critérios de AUTO-REJEIÇÃO (não precisam de humano):
- Nudez genital ou mamilos femininos expostos
- Conteúdo sexualmente sugestivo ou pose erótica
- Menor de idade aparente (com ou sem máscara)
- Violência, auto-agressão, cicatrizes de automutilação recente
- Texto/tatuagem com discurso de ódio, racismo, homofobia, nazismo, conteúdo político extremo
- Logos de marcas concorrentes em destaque proposital
- Drogas ilegais visíveis
- Pessoa obviamente não-consentente fotografada sem saber
- Imagem claramente não é fitness (selfie em banheiro, meme, foto aleatória)

Critérios de REVISÃO HUMANA (borderline):
- Top esportivo muito pequeno ou tanga — comum em fitness mas borderline
- Biquíni de praia — aceitável mas avaliar contexto
- Proporções corporais que podem indicar transtorno alimentar
- Texto ou símbolos ambíguos
- Qualidade muito baixa da foto (borrada, mal iluminada)
- Uma foto claramente não-fitness mas a outra é OK
- Tatuagens que não dá pra identificar
- Cicatrizes antigas

Critérios de APROVAÇÃO AUTOMÁTICA (publicação ainda requer admin):
- Ambas fotos mostram torso/corpo em contexto de avaliação fitness
- Roupa esportiva adequada (shorts, top, regata, legging)
- Boa qualidade fotográfica e progresso visível
- Nenhum critério de rejeição ou revisão presente

Retorne APENAS um JSON neste formato EXATO, sem texto antes ou depois:

{
  "status": "auto_approved" | "needs_review" | "auto_rejected",
  "confidence": 0.0 a 1.0,
  "flags": ["array", "de", "códigos"],
  "reasoning": "2-4 frases em pt-br explicando a decisão"
}

Códigos de flags válidos: nudity, sexual_content, minor_apparent, violence, hate_speech, drugs, low_quality, borderline_swimwear, suspicious_proportions, non_fitness, competitor_logo, unclear_tattoo, other.`.trim();

export async function moderateTransformation(
  apiKey: string,
  beforeImageBase64: string,
  afterImageBase64: string,
  beforeMime: string,
  afterMime: string,
  caption: string | null
): Promise<TransformationModerationResult> {
  const client = new Anthropic({ apiKey });

  const captionBlock = caption?.trim()
    ? `\n\nLegenda enviada pelo usuário:\n"${caption.slice(0, 500)}"`
    : '';

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analise estas duas fotos de transformação corporal.${captionBlock}`,
          },
          { type: 'text', text: '\nFoto ANTES:' },
          {
            type: 'image',
            source: {
              type: 'base64',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              media_type: beforeMime as any,
              data: beforeImageBase64,
            },
          },
          { type: 'text', text: '\nFoto DEPOIS:' },
          {
            type: 'image',
            source: {
              type: 'base64',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              media_type: afterMime as any,
              data: afterImageBase64,
            },
          },
          {
            type: 'text',
            text: '\nResponda APENAS com o JSON conforme o formato especificado.',
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  let raw = textBlock.text.trim();
  // Strip markdown code fences if present
  raw = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Failed to parse Claude response: ${raw.slice(0, 200)}`);
  }

  if (!['auto_approved', 'needs_review', 'auto_rejected'].includes(parsed.status)) {
    throw new Error(`Invalid status from AI: ${parsed.status}`);
  }

  return {
    status: parsed.status,
    confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
    flags: Array.isArray(parsed.flags) ? parsed.flags.slice(0, 10).map(String) : [],
    reasoning:
      typeof parsed.reasoning === 'string' ? parsed.reasoning.slice(0, 1000) : '',
  };
}
