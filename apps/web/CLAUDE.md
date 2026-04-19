# apps/web — Next.js PWA

## Estrutura de pastas

```
app/
  (app)/              Route group autenticado (tem BottomNav, PushBootstrap)
    app/              Páginas do app (/app/*, /app/admin/*, etc.)
    layout.tsx        Verifica auth, redireciona se não logado
  api/                Route handlers
    cron/             Jobs agendados (protegidos por CRON_SECRET)
    health/           Health checks (excluídos do middleware de auth)
    admin/            Endpoints admin
  layout.tsx          Root layout (ThemeProvider, meta PWA)
  login/, signup/...  Páginas públicas de auth

components/
  ui/                 shadcn/ui primitives (Card, Button, Dialog, etc.)
  bottom-nav.tsx      Navegação principal
  push-bootstrap.tsx  Registra push tokens no mount

lib/
  supabase/           server.ts (SSR cookies) + client.ts (browser)
  monitoring/         heartbeat.ts (Better Stack)
  push/               Firebase Admin + send + register-device + events
  email/              Resend + templates HTML
```

## Route Handlers — padrões

### Endpoints autenticados (maioria):
```typescript
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  // ...
}
```

### Cron jobs (service role, sem cookies):
```typescript
import { createClient } from '@supabase/supabase-js';
import { withHeartbeat } from '@/lib/monitoring/heartbeat';

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  return withHeartbeat('nome_do_job', async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    // ... lógica
    return NextResponse.json({ resultado });
  });
}
```

Ao criar novos cron jobs:
1. Autenticar com `CRON_SECRET` via Bearer token
2. Usar `createClient` do `@supabase/supabase-js` com service role (não o de cookies)
3. Envolver em `withHeartbeat()` com nome único
4. Adicionar o tipo do job em `lib/monitoring/heartbeat.ts` (type `HeartbeatJob`)
5. Configurar env var `HEARTBEAT_<NOME>_URL` no Better Stack

## Middleware

O matcher do middleware exclui:
- `_next/static`, `_next/image`, assets estáticos
- `/api/health` e `/api/cron` — não passam por auth check

Se criar novas rotas públicas de API, adicionar ao matcher em `middleware.ts`.

## Testes

### Unitários (Vitest + MSW + Testing Library):
```
tests/
  setup.ts            MSW server lifecycle, browser stubs, env vars
  msw/
    server.ts         setupServer(handlers)
    supabase-handlers.ts  Mock REST Supabase + auth
    anthropic-handlers.ts Mock Claude API (3 modos)
  unit/               Testes de integração MSW
components/__tests__/ Testes de componentes React
```

- Environment: jsdom (não happy-dom — necessário para MSW)
- Mocks comuns: `next/navigation` (usePathname, useRouter, useSearchParams), `next/link`
- `@xyflow/react` mock: `{ Handle: () => null, Position: { Top: 'top', Bottom: 'bottom' } }`

### E2E (Playwright):
```
tests/e2e/
  public.spec.ts      Páginas públicas
  auth.spec.ts         Fluxos autenticados (precisa E2E_TEST_EMAIL/PASSWORD)
  visual/              Visual regression (3 projetos: desktop-light, desktop-dark, mobile-light)
    helpers.ts         stabilizeForScreenshot(), mockDateToFixed()
```

Visual snapshots devem ser gerados no CI (Linux) — fontes diferem do Windows.

## Push Notifications

Firebase Admin SDK singleton em `lib/push/firebase-admin.ts`. Para enviar:

```typescript
import { sendPushToUser } from '@/lib/push/send';
// fire-and-forget:
sendPushToUser(supabase, userId, { title, body, url, tag }).catch(console.error);
```

Respeita quiet hours, preferências do usuário, e limpa tokens expirados.

## Variáveis de ambiente necessárias

Obrigatórias: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`

Crons: `CRON_SECRET`

Push: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

Monitoring: `HEALTH_CHECK_TOKEN`, `HEARTBEAT_*_URL` (4 crons)

Email: `RESEND_API_KEY`

Payments: `STRIPE_SECRET_KEY`, `PAGARME_API_KEY`
