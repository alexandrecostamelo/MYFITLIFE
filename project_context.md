# MyFitLife — Contexto do Projeto

> Extraído de: README.md, SETUP.md, CLAUDE.md, apps/web/CLAUDE.md, store-metadata/*, native/README.md, memory/*, packages/ai/src/prompts/*, packages/core/src/*, lib/billing/plans.ts, lib/subscription.ts, lib/prompt-safety.ts, tests/e2e/visual/README.md, project_snapshot.md

---

## 1. Objetivo Original do Projeto

O MyFitLife foi concebido como um **"sistema operacional de saúde"** — um aplicativo fitness completo com inteligência artificial como coach pessoal, voltado exclusivamente para o público brasileiro.

O projeto é de autoria de **Alexandre Costa Melo** (Presidente Prudente, SP), construído do zero como projeto pessoal/comercial com stack moderna. O objetivo é criar uma plataforma que substitua múltiplos apps (treino, nutrição, coaching, wearables, social fitness) por uma única experiência integrada, onde a IA atua como elo de ligação entre todas as áreas da saúde do usuário.

A visão central é que a IA não seja um chatbot genérico, mas sim um **coach contextual** — que sabe o que o usuário comeu, como dormiu, o que treinou, quais equipamentos tem disponíveis na academia, e gera recomendações personalizadas a partir desse contexto completo.

O app é 100% em português brasileiro na interface, com código fonte em inglês. Desde o início, foi projetado como **PWA + apps nativos via Capacitor**, com publicação planejada na Play Store e App Store.

**Fonte:** README.md ("Sistema operacional de saúde"), memory/project_myfitlife.md, memory/user_profile.md, store-metadata/play-store.md ("Desenvolvido em Presidente Prudente, SP").

---

## 2. Funcionalidades Planejadas

O projeto foi construído ao longo de **88 commits e 89+ prompts** de desenvolvimento sequencial. Abaixo, todas as funcionalidades planejadas e implementadas, conforme documentado nos metadados de loja e no código:

### Core Fitness
- **Autopilot diário:** IA gera treino + cardápio personalizados todo dia, respeitando metas calóricas, restrições alimentares, lesões, sono e energia do check-in matinal
- **Reconhecimento de alimentos por foto:** Claude Vision analisa foto do prato, identifica alimentos brasileiros (base TACO/Unicamp) e estima porções em gramas
- **Reconhecimento de equipamentos de academia:** fotografa aparelhos, IA identifica e monta treino adaptado exclusivamente com os equipamentos disponíveis
- **Modo Academia Nova:** scan multi-foto dos aparelhos + treino adaptativo gerado pela IA
- **3 coaches IA com personalidades:** Leo (motivador), Sofia (técnica), Rafa (descontraído)
- **140+ exercícios com vídeos e análise de forma em tempo real** via MediaPipe
- **GPS tracking de corrida** com mapa, pace e splits
- **Anatomia 3D interativa** com Three.js e heatmap muscular
- **Treinos contextuais:** acordar, escritório, pré-sono, sem tempo
- **Warm-up sugerido automaticamente** baseado no readiness
- **Importação de treinos** de Strong, Hevy, Strava e planilhas Excel/CSV
- **Supersets visuais** e preview editável do treino

### Nutrição Brasileira
- **150 alimentos da tabela TACO** (Unicamp)
- **50 receitas fitness regionais** (nordestina, mineira, gaúcha, baiana)
- **Lista de compras automática** gerada pela IA a partir do cardápio
- **Substituição inteligente de alimentos** via IA

### Saúde e Acompanhamento
- **Check-in matinal:** sono, humor, energia, dor (mapa corporal)
- **Readiness score:** detecta overtraining via HRV, FC repouso, sono, volume
- **Sleep Fitness score**
- **Composição corporal** (InBody/bioimpedância) com ring chart SVG
- **Biomarcadores** com classificação automática e alertas
- **Importação de exames laboratoriais em PDF** (extração via Claude Vision)
- **Predição de metas** com regressão linear ("Você atinge 70kg em 94 dias")
- **Ciclo menstrual** com ajustes no treino por fase
- **Detecção de overtraining**

### Gamificação
- **XP, níveis e streaks** com coringas mensais (2 freezes/mês)
- **29 conquistas** (common, rare, epic, legendary)
- **Árvore de habilidades** com 40+ movimentos (ReactFlow + Dagre)
- **Quests diárias** geradas por IA
- **Desafios** pessoais e de comunidade com leaderboard ao vivo
- **Mini-desafios** rápidos
- **Rankings** por academia, cidade e estado (com privacidade configurável)
- **Trilhas guiadas** 21/30/60 dias com fotos de progresso
- **Wrapped anual** estilo Spotify

### Social e Comunidade
- **Feed social** com posts automáticos (milestones de treino, PRs, conquistas)
- **Reações** e **comentários**
- **Grupos por interesse** com aprovação admin
- **Comparação VS entre amigos** (stats, skills, fotos)
- **Galeria pública de transformações** antes/depois
- **Moderação híbrida** IA + humana com trust score
- **Cópia de treinos** entre usuários

### Marketplace de Profissionais
- **Nutricionistas, personal trainers e fisioterapeutas verificados** (CRN/CREF/CREFITO)
- **Agendamento** com disponibilidade e bloqueio de datas
- **Videoconferência embutida** (Daily.co)
- **Chat assíncrono** em tempo real (Supabase Realtime)
- **Histórico compartilhado** entre profissional e cliente
- **Plano Premium com consultoria humana** e pool de profissionais

### Academias e Geolocalização
- **Base colaborativa de academias** com mapa Leaflet
- **Check-in por GPS**
- **Reivindicação de academia** (claim de propriedade)
- **Painel B2B** para donos (analytics agregados)
- **Aulas coletivas** com vagas e lista de espera

### Wearables
- **Apple Health e Google Fit** (Capacitor)
- **Fitbit, WHOOP, Garmin, Zepp/Mi Band** (OAuth)
- **Sync automático** via cron

### Plataforma Nativa
- **Widgets iOS** (WidgetKit) e **Android** (AppWidgetProvider) — streak, readiness, treino
- **Siri Shortcuts** e **Google Assistant App Actions** (5 ações rápidas)
- **Apple Watch complications** (streak, readiness gauge, treino do dia)
- **Apple Watch app** básico
- **Chromecast Custom Receiver** + **TV bridge** para segunda tela
- **Push notifications** (FCM, APNs, Web Push)
- **Deep links** (11 rotas)

### Pagamentos e Fiscal
- **3 tiers:** Free, Pro (R$ 29,90/mês ou R$ 249,90/ano), Premium (R$ 99,90/mês ou R$ 999,90/ano)
- **Stripe** (cartão internacional) + **PagarMe** (Pix, boleto, cartão tokenizado)
- **NFSe automática** via Focus NFe
- **Cancelamento com retenção** 5 etapas + ofertas contextuais
- **Win-back email** automático

### Observabilidade e Admin
- **Sentry** error tracking
- **PostHog** analytics
- **Better Stack** uptime (health endpoints + 9 heartbeats)
- **18 páginas admin** (moderação, IA, fiscal, profissionais, feature flags)
- **Relatórios** mensais em PDF e CSV

### LGPD e Compliance
- **Política de privacidade** e **termos de uso** publicados
- **Exportação e exclusão de dados pessoais**
- **Consentimento de gravação** em consultas
- **Anonimização facial** (MediaPipe) na galeria
- **Data safety** (Play Store) e **privacy labels** (App Store) documentados

**Fonte:** store-metadata/play-store.md, store-metadata/app-store.md, memory/project_myfitlife.md, project_snapshot.md.

---

## 3. Decisões Técnicas Tomadas

### Arquitetura
- **Monorepo Turborepo + pnpm 9.12:** separação em packages (ai, core, db, fiscal, types) para reuso e builds independentes
- **Next.js 15 App Router:** Server Components por padrão, `'use client'` apenas quando necessário (React 19)
- **Supabase como backend completo:** auth, banco (Postgres), storage (fotos, vídeos), Realtime (chat profissional) — sem backend próprio, sem Express/Fastify
- **Route handlers como API:** os 216 endpoints vivem em `app/api/`, sem servidor separado
- **Capacitor para nativo:** PWA + bridge nativo iOS/Android, sem React Native — código web reutilizado no mobile
- **Tipos Supabase placeholder:** decisão consciente de usar `Record<string, unknown>` para inserts em vez de tipos reais, até rodar `pnpm db:types` com CLI conectado ao Supabase real

### IA
- **Claude Opus 4.7 como modelo primário**, Claude Haiku como fallback automático em caso de 429/5xx
- **`callWithRetry()`**: retry com fallback integrado no client
- **Cache de respostas comuns:** normalização de queries (SHA256), TTL por feature (1-30 dias), stored no Supabase
- **Rate limiting por tier:** Free 5 msgs/dia, Pro 30, Elite 100
- **Prompt safety:** detecção de injection em PT-BR e EN com 14 regex patterns
- **13 system prompts especializados** em `packages/ai/src/prompts/`

### Design
- **Dark-first:** bg `#0A0A0A`, surface `#141414`, accent `#00D9A3` (verde neon)
- **shadcn/ui customizado:** 20 primitives + componentes de domínio
- **Tailwind CSS 3.4** com class-based dark mode
- **Fontes:** Inter (sans), JetBrains Mono (mono), Bricolage Grotesque (display)

### Testes
- **Vitest + MSW + Testing Library** para unitários (jsdom, não happy-dom — necessário para MSW)
- **Playwright** para E2E funcional + visual regression (3 viewports: desktop-light, desktop-dark, mobile-light)
- **Snapshots visuais gerados no CI (Linux)** — fontes diferem do Windows
- **Coverage thresholds:** 45% lines/functions/statements, 40% branches

### Pagamentos
- **Dual gateway:** Stripe (internacional) + PagarMe (BR) — decisão para suportar Pix e boleto, métodos de pagamento brasileiros não suportados pelo IAP (In-App Purchase)
- **Nota para revisão Apple:** "usa web-based billing porque oferece Pix e Boleto, métodos brasileiros não suportados pelo IAP"
- **NFSe via Focus NFe** em homologação, com config fiscal por profissional

### Monitoramento
- **Better Stack heartbeats** em todos os cron jobs (9 heartbeats configurados)
- **Health checks:** `/api/health` (básico) e `/api/health/deep` (4 checks com token auth)
- **Middleware exclui** `/api/health` e `/api/cron` do auth check

### Git e CI
- **Commits em português** estilo convencional (`feat:`, `fix:`, `test:`, `chore:`)
- **Nunca commitar** `.env*`, credentials ou chaves de API
- **Sempre rodar** `pnpm type-check` e `pnpm build` antes de commitar
- **CI GitHub Actions:** build + lint + type-check + unit tests + E2E + visual regression
- **Visual regression bloqueante** em PRs

**Fonte:** CLAUDE.md, apps/web/CLAUDE.md, packages/ai/src/client.ts, memory/feedback_supabase_types.md, tests/e2e/visual/README.md, store-metadata/CHECKLIST.md.

---

## 4. Integrações Planejadas

| Integração | Status | Propósito | Detalhes de Configuração |
|------------|--------|-----------|--------------------------|
| **Anthropic Claude** | Implementado | Coach IA, Vision, moderação, autopilot, quests | `ANTHROPIC_API_KEY`, modelo primário `claude-opus-4-7`, fallback `claude-haiku-4-5-20251001` |
| **Supabase** | Implementado | DB, Auth, Storage, Realtime | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, 3 padrões de client (server/client/service-role) |
| **Stripe** | Implementado | Pagamento cartão internacional | `STRIPE_SECRET_KEY`, `STRIPE_PRICE_*` (4 IDs), webhook em `/api/webhooks/stripe` |
| **PagarMe** | Implementado | Pix, boleto, cartão BR | `PAGARME_API_KEY`, `PAGARME_PLAN_*` (4 IDs), webhook em `/api/webhooks/pagarme` |
| **Focus NFe** | Implementado | NFSe automática | `FOCUSNFE_TOKEN`, webhook em `/api/webhooks/focusnfe`, env vars fiscais (`MYFITLIFE_CNPJ`, `MYFITLIFE_LEGAL_NAME`, etc.) |
| **Resend** | Implementado | Email transacional | `RESEND_API_KEY`, `RESEND_FROM`, 8 templates React Email, SMTP customizado no Supabase |
| **Firebase Admin** | Implementado | Push FCM/APNs | `FIREBASE_SERVICE_ACCOUNT_BASE64`, singleton em `lib/push/firebase-admin.ts` |
| **Web Push** | Implementado | Push web VAPID | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` |
| **Sentry** | Implementado | Error tracking | `@sentry/nextjs`, traces 10% client / 5% server, replays on error 100% |
| **PostHog** | Implementado | Analytics | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` |
| **Better Stack** | Implementado | Uptime + heartbeats | `HEALTH_CHECK_TOKEN`, 9 `HEARTBEAT_*_URL` |
| **Daily.co** | Implementado | Videoconferência | `DAILY_API_KEY`, salas de vídeo para consultas |
| **MediaPipe** | Implementado | Pose estimation + face detection | Client-side, `@mediapipe/tasks-vision` |
| **Leaflet** | Implementado | Mapas (academias) | Client-side, sem API key |
| **Three.js** | Implementado | Anatomia 3D | Client-side |
| **ReactFlow** | Implementado | Grafo de habilidades | `@xyflow/react` + Dagre |
| **Fitbit** | Implementado | Wearable OAuth | `FITBIT_CLIENT_ID`, `FITBIT_CLIENT_SECRET` |
| **WHOOP** | Implementado | Wearable OAuth | `WHOOP_CLIENT_ID`, `WHOOP_CLIENT_SECRET` |
| **Garmin** | Parcial | Wearable OAuth | Mencionado no código mas sem implementação completa (requer programa de parceria) |
| **Zepp/Mi Band** | Implementado | Wearable OAuth | `ZEPP_CLIENT_ID`, `ZEPP_CLIENT_SECRET` |
| **Apple Health** | Implementado | Health sync iOS | `@capgo/capacitor-health` |
| **Google Fit** | Implementado | Health sync Android | `@capgo/capacitor-health` |
| **Chromecast** | Implementado | TV workout | CAF Custom Receiver, namespace `urn:x-cast:app.myfitlife` |
| **ElevenLabs** | Implementado | TTS para pose estimation | Endpoint `/api/tts/elevenlabs`, env var não documentada |

**Domínio planejado:** `myfitlife.app` (principal), `myfitlife.com.br` (redirect).
**Deploy planejado:** Vercel (ainda não feito — instruções em DOMAIN-SETUP.md).

**Fonte:** store-metadata/DOMAIN-SETUP.md, apps/web/CLAUDE.md, lib/wearables/providers.ts, memory/reference_supabase.md, packages/ai/src/client.ts.

---

## 5. Regras de Negócio Descritas

### 5.1 Nutrição — Cálculo de Metas

**Fórmula BMR:** Mifflin-St Jeor
```
Homem: 10 × peso(kg) + 6.25 × altura(cm) - 5 × idade + 5
Mulher: 10 × peso(kg) + 6.25 × altura(cm) - 5 × idade - 161
```

**Multiplicadores de atividade (TDEE):**
- Sedentário: 1.2, Leve: 1.375, Moderado: 1.55, Ativo: 1.725, Muito ativo: 1.9

**Ajuste calórico por objetivo:**
- Perder gordura: −400 kcal | Ganhar massa: +300 kcal | Manter: 0 | Performance: +200 kcal
- Mínimo absoluto: 1.200 kcal/dia

**Proteína por objetivo:**
- Ganhar massa: 2.0 g/kg | Perder gordura: 2.2 g/kg | Outros: 1.8 g/kg

**Gordura:** 25% das calorias (÷9 para gramas)
**Carboidratos:** restante das calorias (mínimo 50g/dia)
**Água:** 35 ml/kg de peso corporal

**Fonte:** packages/core/src/nutrition/index.ts.

### 5.2 Treino — Splits e Parâmetros

**Sugestão de split por frequência e nível:**
| Dias/semana | Iniciante | Intermediário | Avançado |
|-------------|-----------|---------------|----------|
| 1-2 | Full body | Full body | Full body |
| 3 | Full body | PPL | PPL |
| 4 | Upper/lower | Upper/lower | Upper/lower |
| 5 | ABCDE | ABCDE | PPL |
| 6+ | PPL | PPL | PPL |

**Repetições por objetivo:**
- Ganhar massa: 8-12 | Perder gordura: 10-15 | Performance/Força: 3-6

**Descanso por objetivo:**
- Ganhar massa: 90s | Perder gordura: 60s | Performance/Força: 180s

**Estimativa de 1RM:** Fórmula Epley → `peso × (1 + reps ÷ 30)`

**Máximo de exercícios por treino (Autopilot):** 8

**Fonte:** packages/core/src/workout/index.ts, packages/ai/src/prompts/autopilot.ts.

### 5.3 Gamificação — XP e Streaks

**Recompensas de XP:**
| Evento | XP | Dimensão |
|--------|-----|----------|
| Treino completo | 50 | Strength |
| Série registrada | 5 | Strength |
| Refeição registrada | 10 | Nutrition |
| Foto de refeição | 15 | Nutrition |
| Check-in diário | 20 | Consistency |
| Peso registrado | 10 | Consistency |
| Dia de streak | 10 | Consistency |
| Dia de trilha | 25 | Consistency |
| Trilha completa | 500 | Consistency |
| Quest completa | 30 | Consistency |
| Scan de equipamento | 15 | Strength |
| Academia criada | 25 | Consistency |
| Foto de progresso | 20 | Consistency |

**Progressão de nível:** `XP necessário = 100 × (nível - 1)^1.5`

**Streaks:** 2 coringas (freezes) por mês, reseta no início do mês. Se perder mais de 2 dias sem freeze, streak quebra.

**5 dimensões:** Strength, Endurance, Flexibility, Consistency, Nutrition.

**Fonte:** packages/core/src/gamification/index.ts.

### 5.4 Planos e Limites

**Planos:**
| Plano | Preço | Funcionalidades |
|-------|-------|-----------------|
| **Free** | R$ 0 | Treinos básicos, registro manual de refeições, coach 5-10 msgs/dia |
| **Pro Mensal** | R$ 29,90 | Tudo do Free + Autopilot, Coach ilimitado (30 msgs/dia), Pose estimation, Reconhecimento por foto, Lab upload, Cycle tracking, Biomarkers |
| **Pro Anual** | R$ 249,90 | Tudo do Pro Mensal + 2 meses grátis |
| **Premium Mensal** | R$ 99,90 | Tudo do Pro + Consultoria humana inclusa, Revisão mensal de plano, Fila prioritária, 100 msgs IA/dia |
| **Premium Anual** | R$ 999,90 | Tudo do Premium Mensal + 2 meses grátis |

**Limites por plano:**
| Recurso | Free | Pro | Elite/Premium |
|---------|------|-----|---------------|
| Mensagens IA/dia | 5 | 30 | 100 |
| Lab uploads/dia | 0 | 5 | 20 |
| Fotos progresso/mês | 0 | 30 | 100 |

**Regra de upgrade/downgrade:** Upgrades aplicam imediatamente. Downgrades agendam para o fim do ciclo.

**Fonte:** lib/billing/plans.ts, lib/subscription.ts.

### 5.5 Coach IA — Regras Absolutas

1. **Nunca dar diagnóstico médico.** Dor forte, lesão suspeita ou sintoma sério → recomendar profissional.
2. **Saúde mental séria** (depressão, suicídio, transtorno alimentar) → acolher e recomendar profissional imediatamente.
3. **Nunca inventar dados** do usuário que não foram fornecidos.
4. **Ser específico e acionável.** Evitar respostas genéricas como "depende".
5. **Parabenizar progressos reais** quando mencionados.
6. **Sem emojis em excesso.** Um ou dois quando fizer sentido.
7. **Máximo 3-4 frases** por resposta (3 frases no modo com tom definido).
8. **Se o usuário pedir algo fora do escopo** (treino, nutrição, bem-estar), orientar de volta gentilmente.

**4 tons de coach:** Acolhedor (warm), Motivacional, Técnico, Durão (tough).

**Fonte:** packages/ai/src/prompts/coach.ts.

### 5.6 Autopilot — Regras de Geração

- Respeitar metas calóricas e macros informadas
- Respeitar restrições alimentares e lesões
- Para iniciantes, preferir exercícios básicos e máquinas (mais seguras)
- Se dormiu mal ou baixa energia, reduzir intensidade
- Máximo 8 exercícios por treino
- Usar alimentos brasileiros comuns
- Se lista de aparelhos disponíveis foi fornecida, usar **exclusivamente** esses aparelhos
- Nunca inventar aparelhos que não estão na lista
- Se dor muscular intensidade 3+/5, evitar treinar essa região no dia
- Se dor 4-5 em grupos grandes, preferir mobilidade ou descanso ativo

**Fonte:** packages/ai/src/prompts/autopilot.ts.

### 5.7 Moderação — Regras de Classificação

**Scores de moderação:**
- **Approve** (score < 0.40): post normal fitness, motivação, dúvida, celebração, receitas, rotinas
- **Review** (score 0.40-0.79): linguagem agressiva ambígua, conselhos de saúde duvidosos, dieta radical (<1.000 kcal), promoção de overtraining, possível pro-ana, links suspeitos, crítica a pessoa identificável, body shaming leve
- **Reject** (score ≥ 0.80): hate speech, ameaça, doxing, pornografia, pro-suicídio, venda de anabolizantes sem receita, golpe, assédio direto

**15 categorias de violação:** spam, harassment, hate_speech, nudity_text, violence, misinformation_health, self_harm, dangerous_advice, impersonation, off_topic_commercial, pro_ana, pro_overtraining, doping_promotion, body_shaming, eating_disorder.

**Contexto fitness:**
- "Vou quebrar tudo no treino hoje" → APPROVE (gíria positiva)
- "Dieta de 600kcal funciona?" → REVIEW (risco pro-ana)
- "Quem tem receita de oxandrolona?" → REJECT (doping sem receita)

**Fonte:** packages/ai/src/prompts/moderation.ts.

### 5.8 Reconhecimento de Alimentos — Regras

- Usar nomes de alimentos em português brasileiro, preferindo termos da base TACO (Unicamp)
- Estimar porções em gramas baseado em referências visuais (tamanho do prato, talheres)
- Ser conservador — preferir subestimar ligeiramente
- Se não conseguir identificar claramente, usar confidence baixo
- Nunca inventar valores nutricionais — apenas identificar e estimar quantidade
- Se a foto não mostrar alimentos, retornar `is_food_photo: false`
- Se houver múltiplos pratos, analisar apenas o mais proeminente

**Fonte:** packages/ai/src/prompts/food-vision.ts.

### 5.9 Onboarding — Fluxo Conversacional

O onboarding coleta 15 informações em ordem natural, sem parecer formulário:
1. Nome preferido
2. Idade
3. Altura (cm)
4. Peso atual (kg)
5. Peso desejado (kg) — pode ser null
6. Objetivo principal (5 opções)
7. Nível de experiência (3 opções)
8. Onde pretende treinar
9. Equipamentos disponíveis
10. Dias por semana (1-7)
11. Tempo por sessão (minutos)
12. Restrições alimentares
13. Lesões ou dores crônicas
14. Horas de sono por noite
15. Preferência de tom do coach

**Regras:** Uma pergunta por vez. Nunca julgar peso ou alimentação. Se o usuário não quiser responder, respeitar e seguir. Máximo 2-3 frases por turno.

**Fonte:** packages/ai/src/prompts/onboarding.ts.

### 5.10 Prompt Safety — Proteção contra Injection

14 patterns regex detectam tentativas de injection em inglês e português:
- "ignore all previous instructions"
- "esqueça todas as instruções"
- "you are now a..."
- "finja ser..."
- System prompt delimiters (`[system]`, `<system>`, `system:`)
- "pretend you're", "act as if", "new instructions"

Input limitado a 5.000 caracteres. Tentativas são sanitizadas com `[conteúdo removido]`.

**Fonte:** lib/prompt-safety.ts.

### 5.11 Push Notifications — Regras

- Respeitar quiet hours do usuário
- Respeitar preferências de notificação por tipo
- Limpar tokens expirados automaticamente
- Fire-and-forget (não bloquear fluxo principal)
- 5 eventos pré-templateados: friend request, friend workout, challenge invite, chat message, friend achievement

**Fonte:** apps/web/CLAUDE.md, lib/push/.

### 5.12 Cron Jobs — Padrão Obrigatório

Todo cron job deve:
1. Autenticar com `CRON_SECRET` via Bearer token
2. Usar `createClient` do `@supabase/supabase-js` com service role (não o de cookies)
3. Envolver lógica em `withHeartbeat()` com nome único
4. Adicionar o tipo do job em `lib/monitoring/heartbeat.ts`
5. Configurar env var `HEARTBEAT_<NOME>_URL` no Better Stack

**Fonte:** apps/web/CLAUDE.md.

---

## 6. Observações Importantes dos Desenvolvedores

### Sobre Tipos Supabase (CLAUDE.md + memory)
> "Os tipos em `packages/types` são placeholder. Usar `Record<string, unknown>` para Insert/Update. `Database['public']['Tables']['tabela']['Insert']` gera `never` porque os tipos são placeholder."

Cada tabela precisa ter `Relationships: []`. O generic `Database` foi removido do `createClient()` para evitar resolução para `never`. Quando rodar `pnpm db:types` com Supabase CLI linkado, os tipos reais substituirão o placeholder.

### Sobre Joins do Supabase (CLAUDE.md)
> "O select com join pode retornar array. Usar: `const profArr = row.professionals as { user_id: string }[] | { user_id: string } | null; const userId = Array.isArray(profArr) ? profArr[0]?.user_id : profArr?.user_id;`"

### Sobre JSX com Dados Supabase (CLAUDE.md)
> "Dados Supabase sem tipo são `unknown`. No JSX, extrair para variável tipada antes do return: `const name = String(data?.field ?? '');`"

### Sobre Visual Regression (tests/e2e/visual/README.md)
> "Snapshots gerados no Windows podem divergir no CI (Ubuntu) por diferenças de anti-aliasing de fontes. O baseline deve ser sempre Linux. Nunca commitar `--update-snapshots` sem olhar os diffs."

### Sobre Billing com Apple (store-metadata/CHECKLIST.md)
> "In-App Purchases: NÃO (usamos web billing, não IAP). Se Apple rejeitar: implementar IAP como alternativa. Justificativa: oferece Pix e Boleto como métodos de pagamento brasileiros não suportados pelo IAP."

### Sobre Apple Watch (native/README.md)
> "Complications.swift tem `@main` via `WidgetBundle`. MyFitLifeWatchApp.swift também tem `@main`. Escolha apenas um como entry point e remova `@main` do outro, ou use targets separados (Watch App vs Watch Widget Extension)."

### Sobre Preferência de Execução (memory/feedback_execucao.md)
> "Execute tudo de uma vez sem parar para confirmar entre etapas. O usuário envia prompts grandes com múltiplos passos e espera que tudo seja feito em sequência, com commit e push ao final."

### Sobre Deploy (memory/reference_supabase.md)
> "Vercel: Deploy ainda não feito. Rodar `cd apps/web && pnpm dlx vercel`"
> "Supabase: SQL inicial já rodado no painel. Configurar Auth > URL Configuration com redirect URLs."
> "Seeds: Preencher `packages/db/.env` com SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY, depois rodar `pnpm seed:all`."

### Sobre Idioma (CLAUDE.md)
> "Todo o código (variáveis, funções, componentes, commits) em inglês. Textos da UI, strings exibidas ao usuário e mensagens de commit em português (PT-BR)."

### Sobre Modelo de IA (packages/ai/src/client.ts)
> "Modelo primário: `claude-opus-4-7`. Fallback: `claude-haiku-4-5-20251001`. Retry automático em 429/500/502/503/529. Tabela de custos: Opus $15/$75 por 1M tokens, Haiku $1/$5."

---

*Contexto extraído fielmente dos arquivos de documentação, memória, prompts e configuração do repositório MyFitLife em 2026-04-20.*
