import { describe, it, expect } from 'vitest';

const ANTHROPIC = 'https://api.anthropic.com/v1/messages';
const HEADERS = { 'Content-Type': 'application/json', 'x-api-key': 'test' };

describe('MSW — Claude API mock', () => {
  it('retorna resposta de texto padrão', async () => {
    const res = await fetch(ANTHROPIC, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 100,
        messages: [{ role: 'user', content: 'oi coach' }],
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json() as { content: { type: string; text: string }[] };
    expect(data.content[0].type).toBe('text');
    expect(data.content[0].text).toContain('mock');
  });

  it('retorna JSON estruturado pra food recognition com imagem', async () => {
    const res = await fetch(ANTHROPIC, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Identifique os alimentos' },
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'aGVsbG8=' } },
            ],
          },
        ],
      }),
    });
    const data = await res.json() as { content: { text: string }[] };
    const parsed = JSON.parse(data.content[0].text) as { items: unknown[]; estimated_calories: number };
    expect(parsed.items).toHaveLength(2);
    expect(parsed.estimated_calories).toBeGreaterThan(0);
  });

  it('retorna auto_approved pra moderação com imagem', async () => {
    const res = await fetch(ANTHROPIC, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: 'Você é um moderador de conteúdo',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analise estas fotos' },
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'aGVsbG8=' } },
            ],
          },
        ],
      }),
    });
    const data = await res.json() as { content: { text: string }[] };
    const parsed = JSON.parse(data.content[0].text) as { status: string; confidence: number; flags: string[] };
    expect(parsed.status).toBe('auto_approved');
    expect(parsed.confidence).toBeGreaterThan(0.8);
    expect(parsed.flags).toHaveLength(0);
  });
});
