# MyFitLife

App fitness com IA como coach pessoal. Monorepo Turborepo.

## Estrutura

```
apps/web          Next.js 15 PWA (App Router) — o app principal
packages/types    Tipos Supabase (placeholder — ver Supabase abaixo)
packages/ai       Cliente Anthropic + system prompts
packages/core     Lógica de negócio (nutrição, workout splits)
packages/db       Seeds (alimentos TACO, exercícios)
```

## Comandos

```bash
pnpm dev              # dev server (turbo)
pnpm build            # build tudo
pnpm type-check       # tsc --noEmit em todos os packages
pnpm lint             # eslint
pnpm db:types         # regenera tipos Supabase → packages/types/src/supabase.ts

# Dentro de apps/web:
pnpm test             # vitest run
pnpm test:coverage    # vitest com coverage (thresholds: 45/45/40/45)
pnpm test:e2e         # playwright (funcional)
pnpm test:visual      # playwright (visual regression — desktop-light/dark, mobile-light)
```

Antes de commitar, sempre rodar `pnpm type-check` e `pnpm build` (na raiz).

## Supabase — tipos placeholder

Os tipos em `packages/types` são placeholder. Quando o Supabase client pede generics de Insert/Update:

```typescript
// CERTO — usar Record<string, unknown>
const { error } = await supabase
  .from('tabela')
  .insert({ campo: valor } as Record<string, unknown>);

// ERRADO — não usar Database['public']['Tables']['tabela']['Insert']
// Isso gera `never` porque os tipos são placeholder
```

Para joins do Supabase que retornam arrays em vez de objeto:
```typescript
// O select com join pode retornar array
const profArr = row.professionals as { user_id: string }[] | { user_id: string } | null;
const userId = Array.isArray(profArr) ? profArr[0]?.user_id : profArr?.user_id;
```

## Supabase clients — 3 formas

1. **Server Components / Route Handlers com auth do user:** `import { createClient } from '@/lib/supabase/server'` (usa cookies)
2. **Client Components:** `import { createClient } from '@/lib/supabase/client'` (browser client)
3. **Cron jobs / service role (sem auth do user):** `createClient(URL, SERVICE_ROLE_KEY)` direto do `@supabase/supabase-js`

## Idioma

- Todo o código (variáveis, funções, componentes, commits) em **inglês**
- Textos da UI, strings exibidas ao usuário e mensagens de commit em **português (PT-BR)**

## Estilo de código

- TypeScript strict, sem `any` desnecessário (usar em dados Supabase sem tipo é OK)
- React 19 — Server Components por padrão, `'use client'` só quando necessário
- Tailwind CSS + shadcn/ui (`@/components/ui/*`)
- Imports com `@/` (alias para apps/web root)
- Imports de monorepo: `@myfitlife/types`, `@myfitlife/ai/*`, `@myfitlife/core/*`

## Padrões de JSX com dados Supabase

Dados Supabase sem tipo são `unknown`. No JSX:

```typescript
// ERRADO — {data?.field && <span>{data.field}</span>}  → tipo unknown
// CERTO  — extrair para variável tipada antes do return:
const name = String(data?.field ?? '');
const hasFlag = !!data?.flag;
```

## Tabelas — escopo

- `profiles` — dados de auth/identidade: email, full_name, gender, birth_date, avatar, subscription_tier, cached_*_score
- `user_profiles` — perfil fitness/nutrição: height, weight, goals, diet, equipment, experience_level, coach_tone
- Ambas são canônicas. `profiles.id` = `auth.users.id`, `user_profiles.user_id` = `auth.users.id`
- `ai_usage_log` — tabela única de rate limiting AI (singular, sem 's')

## Git

- Commits em português, estilo convencional: `feat:`, `fix:`, `test:`, `chore:`
- Nunca commitar `.env*`, credentials, ou chaves de API
