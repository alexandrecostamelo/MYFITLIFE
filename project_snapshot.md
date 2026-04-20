# MyFitLife — Project Snapshot

> **Gerado em:** 2026-04-20
> **Commits:** 88 (013c53a → 685f5b6)
> **Branch:** main

---

## 1. Visão Geral do Sistema

**MyFitLife** é um aplicativo fitness completo com IA como coach pessoal, voltado para o público brasileiro.

| Aspecto | Detalhe |
|---------|---------|
| **Tipo** | PWA + apps nativos (iOS/Android via Capacitor) |
| **Arquitetura** | Monorepo Turborepo |
| **Frontend** | Next.js 15.5 (App Router), React 19, Tailwind CSS 3.4, shadcn/ui |
| **Backend** | Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions) |
| **IA** | Anthropic Claude (chat, vision, autopilot, moderação) |
| **Pagamentos** | Stripe (cartão internacional) + PagarMe (Pix, boleto, cartão BR) |
| **Email** | Resend + React Email (8 templates profissionais) |
| **Push** | Firebase Admin (FCM/APNs) + Web Push (VAPID) |
| **Observabilidade** | Sentry (errors), PostHog (analytics), Better Stack (uptime/heartbeat) |
| **Fiscal** | NFSe automática via Focus NFe |
| **Videoconferência** | Daily.co (consultas com profissionais) |
| **Idioma** | Código em inglês, UI e commits em português (PT-BR) |
| **Design** | Dark-first, accent `#00D9A3` (verde neon), bg `#0A0A0A` |

### Stack Completa

**Runtime:** Node.js, TypeScript strict
**Dependências principais:** @anthropic-ai/sdk, @supabase/supabase-js, @tanstack/react-query, stripe, resend, firebase-admin, three.js, @xyflow/react, @mediapipe/tasks-vision, leaflet, framer-motion, zod, zustand, jotai, @react-pdf/renderer, xlsx, sharp, web-push, dagre, date-fns, posthog-js, @sentry/nextjs, @daily-co/daily-js
**Capacitor:** @capacitor/app, device, haptics, local-notifications, splash-screen, status-bar, camera, geolocation, push-notifications, preferences, health
**Testes:** Vitest + Testing Library + MSW (unit), Playwright (E2E + visual regression)

---

## 2. Estrutura de Pastas

```
myfitlife/                          # Raiz do monorepo
├── apps/
│   └── web/                        # Next.js 15 PWA (app principal)
│       ├── app/
│       │   ├── (app)/              # Route group autenticado
│       │   │   ├── app/            # ~120 páginas do app
│       │   │   │   ├── admin/      # 18 páginas admin
│       │   │   │   ├── workout/    # Treino, templates, TV, equipamento
│       │   │   │   ├── nutrition/  # Nutrição, foto, receitas
│       │   │   │   ├── health/     # Biomarkers, body, readiness
│       │   │   │   ├── professionals/ # Marketplace profissionais
│       │   │   │   ├── community/  # Feed, grupos, posts
│       │   │   │   ├── billing/    # Planos, cancelamento, troca
│       │   │   │   └── ...         # Skills, trails, friends, etc.
│       │   │   └── onboarding/     # Onboarding conversacional
│       │   ├── (auth)/             # Login, signup, reset
│       │   ├── (public)/           # Termos, privacidade
│       │   └── api/                # 216 route handlers
│       │       ├── admin/          # 21 endpoints admin
│       │       ├── billing/        # 15 endpoints pagamento
│       │       ├── cron/           # 14 cron jobs
│       │       ├── coach/          # 5 endpoints IA coach
│       │       ├── professionals/  # 14 endpoints marketplace
│       │       └── ...             # 61 domínios de API
│       ├── components/             # 65 componentes
│       │   ├── ui/                 # 20 primitives shadcn/ui
│       │   ├── anatomy/            # Anatomia 3D
│       │   ├── feed/               # Feed social
│       │   ├── health/             # Saúde
│       │   ├── skills/             # Árvore de habilidades
│       │   ├── tts/                # Text-to-speech
│       │   ├── transformations/    # Galeria antes/depois
│       │   ├── widgets/            # Widget sync
│       │   └── workout/            # Componentes de treino
│       ├── lib/                    # 86 arquivos de lógica
│       │   ├── ai/                 # Cliente IA
│       │   ├── billing/            # Plans, renewal, pix
│       │   ├── cast/               # Chromecast/TV bridge
│       │   ├── email/              # Render + send
│       │   ├── health/             # Readiness, sleep, biomarkers
│       │   ├── monitoring/         # Better Stack heartbeat
│       │   ├── nfse/               # Notas fiscais
│       │   ├── predictions/        # Predição de peso/metas
│       │   ├── push/               # Firebase + events + send
│       │   ├── supabase/           # Server + client helpers
│       │   ├── wearables/          # Fitbit, WHOOP, Garmin, Zepp
│       │   └── ...                 # Rate limit, moderation, etc.
│       ├── emails/                 # 8 templates React Email
│       ├── native/                 # Código nativo Capacitor
│       │   ├── ios/                # Swift (Widget, Watch, Shortcuts)
│       │   └── android/            # Kotlin (Widget, Shortcuts)
│       ├── plugins/                # Capacitor plugins JS
│       ├── public/                 # PWA icons, cast-receiver.html
│       ├── scripts/                # Screenshots, seeds
│       ├── store-metadata/         # Play Store, App Store listings
│       └── tests/                  # E2E, visual, unit (MSW)
├── packages/
│   ├── ai/                         # Anthropic client + 14 prompts
│   │   └── src/
│   │       ├── client.ts           # Claude API wrapper
│   │       ├── prompts/            # System prompts por domínio
│   │       └── cache/              # Cache de respostas IA
│   ├── core/                       # Lógica de negócio
│   │   └── src/
│   │       ├── nutrition/          # Cálculos nutricionais
│   │       ├── workout/            # Splits, autopilot, adaptive
│   │       ├── gamification/       # XP, níveis, streaks
│   │       ├── skills/             # Árvore de habilidades
│   │       ├── muscles/            # Mapa muscular
│   │       ├── biomarkers/         # Classificação biomarcadores
│   │       ├── challenges/         # Desafios comunidade
│   │       ├── cycle/              # Ciclo menstrual
│   │       ├── geo/                # Geolocalização
│   │       ├── scheduling/         # Agendamento profissionais
│   │       ├── pose-rules/         # Regras pose estimation
│   │       └── workout-sharing/    # Cópia de treinos
│   ├── db/                         # Seeds
│   │   └── seed/                   # 150 alimentos TACO + 100 exercícios
│   ├── fiscal/                     # NFSe Focus NFe
│   │   └── src/focusnfe.ts
│   └── types/                      # Tipos Supabase (placeholder)
│       └── src/supabase.ts
├── CLAUDE.md                       # Instruções do projeto
├── turbo.json                      # Turborepo config
├── pnpm-workspace.yaml             # Workspace config
└── package.json                    # Root scripts
```

---

## 3. Backend — APIs e Serviços

### 3.1 Route Handlers (216 endpoints em 61 domínios)

#### Autenticação e Conta
| Rota | Métodos | Descrição |
|------|---------|-----------|
| `account/delete` | POST | Exclusão de conta (LGPD) |
| `account/export` | GET | Exportação de dados pessoais (LGPD) |
| `onboarding/chat` | POST | Chat conversacional de onboarding |
| `onboarding/complete` | POST | Finaliza onboarding |
| `profile` | GET, PATCH | Perfil do usuário |
| `profile/coach-persona` | GET, POST | Persona do coach IA |
| `profile/dashboard-metrics` | POST | Métricas personalizadas do dashboard |
| `profile/health-sync` | POST | Sincroniza dados de saúde |
| `profile/username` | POST | Define username único |
| `me/achievements` | GET | Conquistas do usuário |
| `me/ai-usage` | GET | Uso de IA do usuário |
| `me/comparison-prefs` | GET, POST | Preferências de comparação |
| `me/notification-prefs` | GET, POST | Preferências de notificação |
| `me/ranking-privacy` | GET, POST | Privacidade de rankings |
| `me/stats` | GET | Estatísticas gerais |
| `me/subscription` | GET | Status da assinatura |

#### Treino
| Rota | Métodos | Descrição |
|------|---------|-----------|
| `workouts` | POST, GET | CRUD treinos (workout_logs) |
| `workouts/cardio` | POST | Registra sessão de cardio |
| `workouts/import` | POST | Importa treinos (Strong, Hevy, Strava) |
| `workouts/weekly-muscles` | GET | Heatmap semanal de músculos |
| `workout/adaptive` | POST | Treino adaptativo via IA |
| `workout/analyze-equipment` | POST | Reconhece equipamento por foto (Vision) |
| `workout/confirm-equipment` | POST | Confirma equipamento reconhecido |
| `workout-templates` | GET, POST | Templates de treino |
| `workout-templates/[id]/publish` | POST | Publica template publicamente |
| `exercises` | GET | Lista exercícios |
| `exercises/[id]/muscles` | GET | Músculos por exercício |
| `form-sessions` | GET, POST | Sessões de análise de forma |
| `import/workouts` | POST | Importação via planilha |

#### Nutrição
| Rota | Métodos | Descrição |
|------|---------|-----------|
| `meals` | POST, GET, DELETE | CRUD refeições |
| `foods/search` | GET | Busca alimentos (base TACO) |
| `nutrition/analyze-photo` | POST | Reconhece alimento por foto (Vision) |
| `nutrition/save-photo-meal` | POST | Salva refeição da foto |
| `nutrition/substitute` | POST | Substituição de alimentos |
| `recipes` | GET | Receitas brasileiras regionais |
| `shopping-list` | GET | Lista de compras |
| `shopping-list/generate` | POST | Gera lista de compras via IA |
| `shopping-list/[id]` | GET, PATCH, DELETE | CRUD item lista |

#### Saúde
| Rota | Métodos | Descrição |
|------|---------|-----------|
| `checkin` | POST, GET | Check-in matinal (dor, humor, sono) |
| `weight` | POST, GET, DELETE | Registro de peso |
| `body-composition` | GET, POST | Bioimpedância InBody |
| `biomarkers` | GET | Biomarcadores com classificação |
| `lab-exams` | GET, POST | Upload de exames PDF |
| `lab-exams/[id]` | GET, DELETE | CRUD exame |
| `health` | GET | Health check simples |
| `health/deep` | GET | Health check profundo |
| `health/readiness` | GET | Score de readiness |
| `health/summary` | GET | Resumo de saúde |
| `cycle` | GET, POST | Ciclo menstrual |
| `cycle/[id]` | DELETE | Remove registro ciclo |
| `cycle/settings` | GET, POST | Configurações do ciclo |
| `predictions/weight` | GET | Predição de peso (regressão linear) |
| `insights/muscle-heatmap` | GET | Heatmap muscular |

#### Coach IA
| Rota | Métodos | Descrição |
|------|---------|-----------|
| `coach/chat` | POST, GET | Chat com coach IA |
| `coach/stream` | POST | Streaming de resposta do coach |
| `coach/proactive` | POST, GET | Mensagens proativas da IA |
| `coach/proactive/[id]` | PATCH | Marca proativa como lida |
| `autopilot/generate` | POST | Gera plano diário completo via IA |
| `tts/elevenlabs` | POST | Text-to-speech para pose estimation |

#### Pagamentos e Billing
| Rota | Métodos | Descrição |
|------|---------|-----------|
| `billing/stripe/checkout` | POST | Cria sessão Stripe Checkout |
| `billing/stripe/portal` | POST | Portal de gerenciamento Stripe |
| `billing/pagarme/subscribe` | POST | Assinatura PagarMe (cartão/boleto) |
| `billing/pagarme/pix` | POST | Pagamento via Pix |
| `billing/pagarme/cancel` | POST | Cancela assinatura PagarMe |
| `billing/pix-pending` | GET | Pix pendentes |
| `billing/transactions` | GET | Histórico de transações |
| `billing/cancel/start` | POST | Inicia fluxo de cancelamento |
| `billing/cancel/reason` | POST | Registra motivo de cancelamento |
| `billing/cancel/accept-offer` | POST | Aceita oferta de retenção |
| `billing/cancel/confirm` | POST | Confirma cancelamento |
| `billing/cancel/abort` | POST | Desiste do cancelamento |
| `billing/change-plan/preview` | POST | Preview de troca de plano |
| `billing/change-plan/execute` | POST | Executa troca de plano |
| `premium/assign` | POST | Atribui profissional premium |
| `professional/fiscal` | POST, GET | Config fiscal do profissional |

#### Webhooks
| Rota | Métodos | Descrição |
|------|---------|-----------|
| `webhooks/stripe` | POST | Webhook Stripe (pagamentos, assinaturas) |
| `webhooks/pagarme` | POST | Webhook PagarMe |
| `webhooks/focusnfe` | POST | Webhook Focus NFe (status NFSe) |

#### Social e Comunidade
| Rota | Métodos | Descrição |
|------|---------|-----------|
| `feed` | GET, POST | Feed social com posts |
| `feed/[postId]/comments` | GET, POST | Comentários no feed |
| `feed/[postId]/react` | POST | Reações (likes, etc.) |
| `posts` | GET, POST | Posts de comunidade |
| `posts/[id]` | DELETE | Remove post |
| `posts/[id]/comments` | GET, POST | Comentários em post |
| `posts/[id]/like` | POST, DELETE | Like/unlike |
| `friends` | GET | Lista amigos |
| `friends/search` | GET | Busca usuários |
| `friends/request` | POST | Solicita amizade |
| `friends/[id]` | PATCH, DELETE | Aceitar/rejeitar/remover |
| `friends/[id]/compare` | GET | Comparação com amigo |
| `friends/[id]/progress-photos` | GET | Fotos de progresso do amigo |
| `blocks` | GET, POST | Usuários bloqueados |
| `blocks/[id]` | DELETE | Desbloquear |
| `groups` | GET, POST | Grupos por interesse |
| `groups/[slug]` | GET | Detalhe do grupo |
| `groups/[slug]/join` | POST, DELETE | Entrar/sair do grupo |
| `groups/[slug]/posts` | GET | Posts do grupo |
| `reports` | POST | Denúncias de conteúdo |

#### Gamificação
| Rota | Métodos | Descrição |
|------|---------|-----------|
| `quests/daily` | GET | Quests diárias |
| `quests/[id]/complete` | POST | Completa quest |
| `challenges` | GET, POST | Desafios pessoais |
| `challenges/[id]` | GET | Detalhe desafio |
| `challenges/[id]/join` | POST, DELETE | Participar/sair |
| `community/challenges` | GET | Desafios de comunidade |
| `community/challenges/[slug]` | GET | Detalhe desafio comunidade |
| `community/challenges/[slug]/enroll` | POST, DELETE | Participar/sair |
| `community/challenges/[slug]/checkin` | POST | Check-in no desafio |
| `community/challenges/[slug]/leaderboard` | GET | Leaderboard |
| `mini-challenges/start` | POST | Inicia mini-desafio |
| `mini-challenges/complete-day` | POST | Completa dia do mini-desafio |
| `leaderboard` | GET | Leaderboard geral |
| `rankings/gym` | GET | Ranking por academia |
| `rankings/city` | GET | Ranking por cidade |
| `rankings/state` | GET | Ranking por estado |
| `skills` | GET | Árvore de habilidades |
| `skills/[key]/practice` | POST | Registra prática de skill |
| `goals` | GET, POST | Metas do usuário |
| `goals/[id]` | PATCH, DELETE | CRUD meta |
| `trails` | GET | Trilhas guiadas (21/30/60 dias) |
| `trails/[slug]` | GET | Detalhe trilha |
| `trails/[slug]/enroll` | POST | Inscrever na trilha |
| `trails/[slug]/progress` | POST | Registrar progresso |

#### Academias e Geolocalização
| Rota | Métodos | Descrição |
|------|---------|-----------|
| `gym-places` | GET, POST | Base colaborativa de academias |
| `gym-places/[id]` | GET | Detalhe academia |
| `gym-places/[id]/review` | POST, DELETE | Avaliação |
| `gym-checkins` | GET, POST | Check-in por GPS |
| `gym-checkins/[id]/leave` | POST | Checkout |
| `gym-claims` | GET, POST | Reivindicação de academia |
| `gym-classes/admin` | POST, DELETE | CRUD aulas (admin academia) |
| `gym-classes/book` | POST | Reserva vaga em aula |
| `gym-classes/cancel` | POST | Cancela reserva |
| `gyms` | GET, POST | Academias do usuário |
| `gyms/[id]` | GET, PATCH, DELETE | CRUD academia |
| `gyms/[id]/equipment` | POST | Adiciona equipamento |
| `gyms/[id]/equipment/[eqId]` | DELETE | Remove equipamento |
| `gym-admin/[id]/analytics` | GET | Analytics da academia |
| `user-gyms/link-place` | POST | Vincula gym_place ao perfil |

#### Marketplace de Profissionais
| Rota | Métodos | Descrição |
|------|---------|-----------|
| `professionals` | GET, POST | Lista/registra profissionais |
| `professionals/[id]` | GET | Perfil do profissional |
| `professionals/[id]/slots` | GET | Horários disponíveis |
| `professionals/[id]/favorite` | POST, DELETE | Favoritar |
| `professionals/[id]/review` | POST | Avaliar profissional |
| `professionals/favorites` | GET | Favoritos |
| `professionals/mine` | GET, PATCH | Meu perfil profissional |
| `professionals/mine/avatar` | POST | Upload avatar |
| `professionals/mine/availability` | GET, POST | Disponibilidade |
| `professionals/mine/availability/[id]` | DELETE | Remove slot |
| `professionals/mine/blocked-dates` | POST | Bloqueia data |
| `professionals/mine/blocked-dates/[id]` | DELETE | Desbloqueia |
| `professionals/mine/clients/[id]/history` | GET | Histórico do cliente |
| `appointments` | GET, POST | Agendamentos |
| `appointments/[id]` | GET, PATCH | Detalhe/atualizar |
| `appointments/[id]/video-room` | POST | Cria sala de vídeo |
| `appointments/[id]/recording-consent` | POST | Consentimento gravação |
| `threads` | GET, POST | Threads de mensagem |
| `threads/[id]` | GET | Detalhe thread |
| `threads/[id]/messages` | POST | Envia mensagem |

#### Transformações e Progresso
| Rota | Métodos | Descrição |
|------|---------|-----------|
| `transformations` | POST, GET | Galeria de transformações |
| `transformations/[id]` | DELETE | Remove transformação |
| `transformations/[id]/inspire` | POST | Inspira/curtir |
| `progress-photos` | POST, GET | Fotos de progresso |
| `progress-photos/[id]` | DELETE | Remove foto |

#### Wearables
| Rota | Métodos | Descrição |
|------|---------|-----------|
| `wearables/connect/[provider]` | GET | OAuth connect (Fitbit, WHOOP, Garmin, Zepp) |
| `wearables/callback/[provider]` | GET | OAuth callback |
| `wearables/disconnect/[provider]` | POST | Desconectar |

#### Discover e Compartilhamento
| Rota | Métodos | Descrição |
|------|---------|-----------|
| `discover/workouts` | GET | Treinos públicos |
| `discover/workouts/[id]` | GET | Detalhe treino |
| `discover/workouts/[id]/copy` | POST | Copia treino |

#### Relatórios
| Rota | Métodos | Descrição |
|------|---------|-----------|
| `reports/monthly` | GET | Relatório mensal |
| `reports/monthly/csv` | GET | Export CSV |
| `reports/monthly/pdf` | GET | Export PDF |
| `reports/weekly` | GET | Relatório semanal |
| `reports/wrapped` | GET | Wrapped anual |

#### Email
| Rota | Métodos | Descrição |
|------|---------|-----------|
| `email/welcome` | POST | Envia email de boas-vindas |

#### Feature Flags
| Rota | Métodos | Descrição |
|------|---------|-----------|
| `feature-flags` | GET | Lista flags ativas |

#### Admin (21 endpoints)
| Rota | Métodos | Descrição |
|------|---------|-----------|
| `admin/ai-cache/clear` | POST | Limpa cache IA |
| `admin/ai-metrics` | GET | Métricas de uso da IA |
| `admin/challenges` | GET, POST | CRUD desafios |
| `admin/challenges/[id]` | PATCH | Atualiza desafio |
| `admin/challenges/create` | POST | Cria desafio |
| `admin/claims` | GET | Lista reivindicações |
| `admin/claims/[id]` | PATCH | Aprova/rejeita claim |
| `admin/exercise-videos` | POST | Upload vídeo |
| `admin/exercise-videos/[id]` | DELETE | Remove vídeo |
| `admin/exercise-videos/upload` | POST | Upload direto |
| `admin/exercises/video` | PATCH | Vincula vídeo a exercício |
| `admin/feature-flags` | GET, PATCH | CRUD feature flags |
| `admin/groups` | GET | Lista grupos |
| `admin/groups/[id]` | PATCH, DELETE | Modera grupo |
| `admin/moderation/decide` | POST | Decisão de moderação |
| `admin/nfse-report` | GET | Relatório fiscal |
| `admin/premium-pool` | GET, POST, DELETE | Pool de profissionais premium |
| `admin/professionals` | GET | Lista profissionais |
| `admin/professionals/[id]` | PATCH | Verifica/aprova profissional |
| `admin/reports` | GET | Lista denúncias |
| `admin/reports/[id]` | PATCH | Resolve denúncia |
| `admin/skills/rebuild-progress` | POST | Recalcula progressão de skills |
| `admin/transformations` | GET, PATCH | Modera transformações |

#### Cron Jobs (14 jobs agendados)
| Rota | Frequência | Descrição |
|------|-----------|-----------|
| `cron/daily-autopilot` | Diário | Gera planos diários automáticos |
| `cron/proactive-check` | Diário | Verifica mensagens proativas IA |
| `cron/weekly-summary` | Semanal | Envia resumo semanal por email |
| `cron/cleanup` | Diário | Limpeza de dados expirados |
| `cron/backup` | Diário | Backup Supabase |
| `cron/challenges-status` | Diário | Atualiza status de desafios |
| `cron/nfse-queue` | Periódico | Processa fila de NFSe |
| `cron/nfse-subscriptions-queue` | Periódico | NFSe de assinaturas |
| `cron/pix-renewals` | Diário | Renovações Pix |
| `cron/pix-check-payments` | Periódico | Verifica pagamentos Pix |
| `cron/premium-quota-reset` | Mensal | Reset de quotas premium |
| `cron/apply-scheduled-changes` | Diário | Aplica trocas de plano agendadas |
| `cron/unpause-subscriptions` | Diário | Despausa assinaturas |
| `cron/wearable-sync` | Periódico | Sincroniza dados de wearables |
| `cron/video-rooms-cleanup` | Diário | Limpa salas de vídeo expiradas |
| `cron/winback-email` | Semanal | Envia emails de win-back |

### 3.2 Serviços e Lógica (lib/)

| Módulo | Arquivos | Descrição |
|--------|----------|-----------|
| `lib/supabase/` | server.ts, client.ts | Clients SSR (cookies) e browser |
| `lib/ai/` | - | Cache de IA, client wrapper |
| `lib/ai-cache.ts` | 1 | Cache de respostas comuns |
| `lib/ai-call.ts` | 1 | Wrapper para chamadas Claude |
| `lib/billing/` | plans.ts, renewal-notifications.ts, pix-renewal.ts | Planos, renovações, dunning |
| `lib/cast/` | sender.ts, tv-bridge.ts | Chromecast sender + TV bridge |
| `lib/email/` | render.ts | React Email render + Resend send |
| `lib/email.ts` | 1 | Email transacional legado |
| `lib/feed/` | create-post.ts | Auto-posts para feed social |
| `lib/health/` | readiness.ts, sleep-score.ts, biomarker-classifier.ts | Scores de saúde |
| `lib/moderation/` | apply.ts | Moderação automática IA |
| `lib/monitoring/` | heartbeat.ts | Better Stack heartbeats (9 jobs) |
| `lib/nfse/` | issue.ts, subscription-issuer.ts | Emissão de notas fiscais |
| `lib/predictions/` | weight.ts, goals-updater.ts | Regressão linear de peso/metas |
| `lib/premium/` | quota.ts | Quotas de consultoria premium |
| `lib/push/` | firebase-admin.ts, send.ts, events.ts | Push notifications |
| `lib/rate-limit/` | index.ts | Rate limiting por tier |
| `lib/wearables/` | providers.ts | OAuth Fitbit, WHOOP, Garmin, Zepp |
| `lib/widgets/` | sync.ts | Sync dados para widgets nativos |
| `lib/shortcuts/` | donate.ts | Siri/Google Assistant shortcuts |
| `lib/hooks/` | - | React hooks compartilhados |
| `lib/import/` | - | Importação de planilhas |
| `lib/exercise-videos/` | index.ts | Biblioteca de vídeos |
| `lib/skill-graph/` | - | Grafo de habilidades |
| `lib/tts/` | - | Text-to-speech |
| `lib/stripe.ts` | 1 | Stripe client + price IDs |
| `lib/pagarme.ts` | 1 | PagarMe client |
| `lib/daily.ts` | 1 | Daily.co API |
| `lib/gamification.ts` | 1 | XP, níveis, streaks |
| `lib/subscription.ts` | 1 | Lógica de assinatura |
| `lib/feature-flags.ts` | 1 | Feature flags |
| `lib/deep-links.ts` | 1 | Deep links (11 rotas) |
| `lib/pose-detector.ts` | 1 | MediaPipe pose estimation |
| `lib/prompt-safety.ts` | 1 | Sanitização de prompts IA |
| `lib/csv-export.ts` | 1 | Exportação CSV |
| `lib/pdf-report.tsx` | 1 | Geração PDF com @react-pdf |
| `lib/auth-helpers.ts` | 1 | Helpers de autenticação |
| `lib/coach-context.ts` | 1 | Contexto rico para coach IA |
| `lib/transformation-image.ts` | 1 | Processamento de imagens |
| `lib/native-camera.ts` | 1 | Câmera nativa Capacitor |
| `lib/native-push.ts` | 1 | Push nativo Capacitor |
| `lib/haptics.ts` | 1 | Feedback háptico |
| `lib/biometric-auth.ts` | 1 | Autenticação biométrica |
| `lib/platform.ts` | 1 | Detecção de plataforma |

### 3.3 Packages (monorepo)

| Package | Descrição | Arquivos-chave |
|---------|-----------|----------------|
| `@myfitlife/ai` | Anthropic Claude SDK wrapper | client.ts, 14 prompts (onboarding, coach, adaptive-workout, food-vision, equipment-vision, lab-extraction, moderation, transformation-moderation, shopping-list, food-substitution, autopilot, quests) |
| `@myfitlife/core` | Lógica de negócio pura | nutrition, workout (splits, adaptive), gamification (XP), skills, muscles, biomarkers, challenges, cycle, geo, scheduling, pose-rules, workout-sharing |
| `@myfitlife/db` | Seeds de dados | 150 alimentos TACO, 100+ exercícios |
| `@myfitlife/fiscal` | Emissão fiscal | Focus NFe integration |
| `@myfitlife/types` | Tipos Supabase | placeholder (usar `Record<string, unknown>` para inserts) |

---

## 4. Frontend — Páginas, Componentes e Fluxos

### 4.1 Páginas (134 total)

#### Páginas Públicas (4)
| Rota | Descrição |
|------|-----------|
| `/login` | Login com email/senha |
| `/signup` | Registro |
| `/forgot-password` | Recuperação de senha |
| `/reset-password` | Reset de senha |
| `/privacidade` | Política de privacidade (LGPD) |
| `/termos` | Termos de uso |

#### Onboarding (2)
| Rota | Descrição |
|------|-----------|
| `/onboarding` | Onboarding conversacional com IA |
| `/app/onboarding/coach` | Seleção de persona do coach |

#### Dashboard e Perfil (8)
| Rota | Descrição |
|------|-----------|
| `/app` | Dashboard principal (activity rings, FAB radial, widget sync) |
| `/app/profile` | Perfil do usuário |
| `/app/profile/edit` | Edição de perfil |
| `/app/profile/delete` | Exclusão de conta (LGPD) |
| `/app/stats` | Estatísticas detalhadas |
| `/app/usage` | Uso de IA |
| `/app/weight` | Histórico de peso |
| `/app/progress` | Fotos de progresso |

#### Treino (12)
| Rota | Descrição |
|------|-----------|
| `/app/workout` | Treino do dia (autopilot) |
| `/app/workout/templates` | Meus templates |
| `/app/workout/templates/[id]` | Detalhe template |
| `/app/workout/equipment` | Modo academia nova (scan) |
| `/app/workout/import` | Importação de treinos |
| `/app/workout/tv` | TV view (landscape, Chromecast) |
| `/app/exercises` | Biblioteca de exercícios |
| `/app/exercises/[slug]` | Detalhe exercício |
| `/app/workouts/explore` | Explorar treinos públicos |
| `/app/workouts/run` | Execução de treino |
| `/app/workouts/runs` | Histórico de runs |
| `/app/form-analysis` | Análise de forma (MediaPipe) |
| `/app/form-analysis/history` | Histórico de análises |

#### Nutrição (5)
| Rota | Descrição |
|------|-----------|
| `/app/nutrition` | Dashboard de nutrição |
| `/app/nutrition/photo` | Reconhecimento por foto |
| `/app/nutrition/recipes` | Receitas brasileiras |
| `/app/shopping-list` | Lista de compras |
| `/app/shopping-list/[id]` | Detalhe lista |

#### Saúde (8)
| Rota | Descrição |
|------|-----------|
| `/app/health/readiness` | Score de readiness |
| `/app/health/biomarkers` | Biomarcadores com alertas |
| `/app/health/body` | Bioimpedância InBody |
| `/app/heatmap` | Heatmap muscular |
| `/app/insights/muscles` | Insights de músculos |
| `/app/muscles` | Mapa muscular 3D |
| `/app/labs` | Exames laboratoriais |
| `/app/labs/[id]` | Detalhe exame |
| `/app/labs/markers` | Marcadores |
| `/app/cycle` | Ciclo menstrual |

#### Coach IA (1)
| Rota | Descrição |
|------|-----------|
| `/app/coach` | Chat com coach IA (streaming) |

#### Social (13)
| Rota | Descrição |
|------|-----------|
| `/app/feed` | Feed social |
| `/app/community` | Comunidade geral |
| `/app/community/new` | Novo post |
| `/app/community/post/[id]` | Detalhe post |
| `/app/community/groups` | Grupos por interesse |
| `/app/community/groups/new` | Criar grupo |
| `/app/community/groups/[slug]` | Detalhe grupo |
| `/app/friends` | Amigos |
| `/app/friends/[id]/compare` | Comparação VS |
| `/app/blocks` | Bloqueados |
| `/app/transformations` | Galeria de transformações |
| `/app/transformations/new` | Nova transformação |
| `/app/threads` | Mensagens (chat profissional) |
| `/app/threads/[id]` | Thread |

#### Gamificação (10)
| Rota | Descrição |
|------|-----------|
| `/app/achievements` | Conquistas |
| `/app/quests` | Quests diárias |
| `/app/challenges` | Desafios pessoais |
| `/app/challenges/[id]` | Detalhe desafio |
| `/app/challenges/new` | Novo desafio |
| `/app/challenges/community` | Desafios de comunidade |
| `/app/challenges/community/[slug]` | Detalhe desafio comunidade |
| `/app/leaderboard` | Leaderboard global |
| `/app/rankings` | Rankings (gym, city, state) |
| `/app/skills` | Árvore de habilidades (ReactFlow) |
| `/app/trails` | Trilhas guiadas (21/30/60 dias) |
| `/app/trails/[slug]` | Detalhe trilha |
| `/app/goals` | Metas pessoais |

#### Academias (11)
| Rota | Descrição |
|------|-----------|
| `/app/explore` | Mapa de academias (Leaflet) |
| `/app/explore/[id]` | Detalhe academia |
| `/app/explore/[id]/claim` | Reivindicar academia |
| `/app/explore/new` | Adicionar academia |
| `/app/gyms` | Minhas academias |
| `/app/gyms/[id]` | Detalhe academia |
| `/app/gyms/[id]/scan` | Scan equipamento (Vision) |
| `/app/gyms/new` | Nova academia |
| `/app/gym/classes` | Aulas coletivas |
| `/app/gym-admin` | Painel do dono |
| `/app/gym-admin/[id]` | Analytics da academia |
| `/app/gym-admin/classes` | Gerenciar aulas |

#### Marketplace (12)
| Rota | Descrição |
|------|-----------|
| `/app/professionals` | Lista profissionais (nutri, personal, fisio) |
| `/app/professionals/[id]` | Perfil do profissional |
| `/app/professionals/[id]/book` | Agendar consulta |
| `/app/professionals/favorites` | Favoritos |
| `/app/professionals/register` | Registrar como profissional |
| `/app/professionals/mine` | Meu painel profissional |
| `/app/professionals/mine/availability` | Minha disponibilidade |
| `/app/professionals/mine/clients/[id]` | Histórico do cliente |
| `/app/professional/fiscal` | Configuração fiscal |
| `/app/professional/invoices` | Minhas notas fiscais |
| `/app/appointments` | Agendamentos |
| `/app/appointments/[id]` | Detalhe agendamento |
| `/app/appointments/[id]/video` | Sala de vídeo (Daily.co) |

#### Billing (7)
| Rota | Descrição |
|------|-----------|
| `/app/plans` | Planos disponíveis |
| `/app/checkout` | Checkout |
| `/app/billing` | Minha assinatura |
| `/app/billing/cancel` | Cancelamento com retenção |
| `/app/billing/change-plan` | Troca de plano |
| `/app/premium` | Premium com consultoria |
| `/app/premium/setup` | Setup premium |
| `/app/my-invoices` | Minhas notas fiscais |

#### Relatórios (4)
| Rota | Descrição |
|------|-----------|
| `/app/reports` | Relatório mensal |
| `/app/reports/weekly` | Relatório semanal |
| `/app/reports/wrapped` | Wrapped anual |
| `/app/discover/workouts` | Explorar treinos |
| `/app/discover/workouts/[id]` | Detalhe treino |

#### Configurações (6)
| Rota | Descrição |
|------|-----------|
| `/app/settings/notifications` | Preferências de notificação |
| `/app/settings/coach` | Persona do coach |
| `/app/settings/health` | Sync wearables |
| `/app/settings/import` | Importar dados |
| `/app/settings/comparison-privacy` | Privacidade comparação |
| `/app/settings/ranking-privacy` | Privacidade rankings |

#### Admin (18 páginas)
| Rota | Descrição |
|------|-----------|
| `/app/admin/monitoring` | Dashboard de monitoramento |
| `/app/admin/ai-metrics` | Métricas de IA |
| `/app/admin/ai-cache` | Cache de IA |
| `/app/admin/rate-limits` | Rate limiting |
| `/app/admin/feature-flags` | Feature flags |
| `/app/admin/moderation` | Moderação de conteúdo |
| `/app/admin/reports` | Denúncias |
| `/app/admin/professionals` | Profissionais pendentes |
| `/app/admin/claims` | Reivindicações de academias |
| `/app/admin/groups` | Grupos |
| `/app/admin/challenges` | Desafios |
| `/app/admin/challenges/new` | Novo desafio |
| `/app/admin/exercises` | Exercícios |
| `/app/admin/videos` | Vídeos de exercícios |
| `/app/admin/transformations` | Galeria de transformações |
| `/app/admin/premium-pool` | Pool de profissionais |
| `/app/admin/retention` | Dashboard de retenção |
| `/app/admin/fiscal-report` | Relatório fiscal |

### 4.2 Componentes (65)

#### UI Primitives (shadcn/ui) — 20
`activity-rings.tsx`, `badge.tsx`, `body-composition-rings.tsx`, `button.tsx`, `calendar-heatmap.tsx`, `card.tsx`, `circular-timer.tsx`, `coach-avatar.tsx`, `design-system.ts`, `dialog.tsx`, `editable-workout-chips.tsx`, `input.tsx`, `label.tsx`, `metric-hero.tsx`, `muscle-group-grid.tsx`, `progress-chart.tsx`, `recipe-card.tsx`, `tabs.tsx`, `textarea.tsx`, `week-strip.tsx`

#### Componentes de Domínio — 45
- **Anatomia:** anatomia 3D com Three.js
- **Feed:** componentes do feed social
- **Health:** saúde e biomarcadores
- **Skills:** nós do grafo de habilidades (ReactFlow)
- **Transformations:** galeria antes/depois
- **TTS:** text-to-speech controls
- **Widgets:** sync com widgets nativos
- **Workout:** componentes de treino
- **Standalone:** `bottom-nav.tsx`, `push-bootstrap.tsx`, `theme-provider.tsx`, `theme-toggle.tsx`, `morning-checkin.tsx`, `gym-map.tsx`, `form-analyzer.tsx`, `photo-capture.tsx`, `post-card.tsx`, `proactive-inbox.tsx`, `body-map.tsx`, `muscle-body-3d.tsx`, `muscle-body-3d-loader.tsx`, `muscle-legend.tsx`, `muscle-widget.tsx`, `food-substitute-modal.tsx`, `exercise-video.tsx`, `video-call-room.tsx`, `deep-link-handler.tsx`, `push-toggle.tsx`

### 4.3 Fluxos Principais

1. **Onboarding** → Chat conversacional com IA → Seleção de coach persona → Dashboard
2. **Treino diário** → Autopilot gera plano → Execução com timer → Rest → Heatmap muscular
3. **Nutrição** → Foto de alimento (Vision) → Análise → Log de refeição → Lista de compras
4. **Coach IA** → Chat streaming → 3 personas (Leo motivador, Sofia técnica, Rafa equilibrado) → Mensagens proativas
5. **Pagamento** → Planos (Pro/Premium × mensal/anual) → Stripe ou PagarMe (Pix/boleto/cartão) → NFSe automática
6. **Cancelamento** → 5 etapas (reason → oferta → confirm) → Win-back email automático
7. **Marketplace** → Buscar profissional → Agendar → Vídeo-consulta (Daily.co) → Chat assíncrono
8. **Social** → Feed → Posts automáticos (milestones) → Reações → Comentários → Grupos
9. **Gamificação** → XP/níveis → Streaks → Quests diárias → Desafios → Leaderboards → Wrapped
10. **Academia** → Mapa (Leaflet) → Check-in GPS → Scan equipamento → Aulas coletivas
11. **Wearables** → OAuth (Fitbit/WHOOP/Garmin/Zepp) → Sync automático → Readiness score

---

## 5. Banco de Dados — Tabelas

### 120+ tabelas Supabase identificadas no código

#### Usuários e Perfil
`profiles`, `user_profiles`, `user_stats`, `user_blocks`, `user_notification_preferences`, `notification_preferences`, `user_fiscal_info`, `comparison_preferences`

#### Autenticação e Assinaturas
`subscriptions`, `payment_transactions`, `pix_charges`, `pagarme_invoices`, `plan_changes`, `cancellation_attempts`, `webhook_events`

#### Treino
`workout_logs`, `workout_sessions`, `workout_session_exercises`, `set_logs`, `workout_templates`, `workout_template_exercises`, `workout_template_copies`, `workout_imports`, `exercises`, `contextual_workouts`, `cardio_sessions`

#### Nutrição
`meal_logs`, `foods`, `recipes`, `shopping_lists`

#### Saúde
`morning_checkins`, `weight_logs`, `weight_predictions`, `body_compositions`, `biomarkers`, `biomarker_references`, `lab_exams`, `readiness_scores`, `health_samples`, `menstrual_cycles`, `menstrual_settings`

#### Coach IA
`coach_conversations`, `coach_messages`, `proactive_messages`, `ai_response_cache`, `ai_usage_log`, `ai_usage_logs`, `ai_usage_metrics`, `ai_cache_stats`, `ai_rate_blocks`, `rate_limits`

#### Social
`feed_posts`, `feed_comments`, `feed_reactions`, `community_posts`, `post_comments`, `post_likes`, `community_groups`, `group_members`, `content_reports`, `moderation_actions`, `user_moderation_state`

#### Gamificação
`achievements`, `user_achievements`, `xp_events`, `daily_quests`, `challenges`, `challenge_participants`, `community_challenges`, `community_challenge_checkins`, `community_challenge_participants`, `mini_challenges`, `user_mini_challenge_progress`, `skill_nodes`, `user_skills`, `trails`, `user_trails`, `user_goals`

#### Academias
`gym_places`, `gym_checkins`, `gym_claims`, `gym_classes`, `gym_class_bookings`, `gym_equipment`, `gym_reviews`, `user_gyms`, `equipment_recognitions`

#### Marketplace
`professionals`, `professional_availability`, `professional_blocked_dates`, `professional_favorites`, `professional_reviews`, `professional_messages`, `professional_threads`, `professional_fiscal_config`, `appointments`, `premium_assignments`, `premium_pools`, `premium_quotas`

#### Wearables
`wearable_connections`, `health_samples`

#### Transformações
`transformation_posts`, `transformation_inspires`, `progress_photos`

#### Social (Amigos)
`friendships`

#### Push/Email
`push_subscriptions`, `user_push_tokens`, `push_notification_log`, `email_logs`

#### Fiscal
`nfse_invoices`

#### Feature Flags e Admin
`feature_flags`, `backups`

#### Vídeos e Form Analysis
`exercise_videos`, `form_sessions`, `video_session_events`

#### Planos Diários
`daily_plans`

---

## 6. Integrações

| Integração | Propósito | Arquivos |
|------------|-----------|----------|
| **Anthropic Claude** | Coach IA, Vision (alimentos, equipamentos, exames), moderação, autopilot, quests | `packages/ai/`, `lib/ai-call.ts`, `lib/ai-cache.ts` |
| **Supabase** | DB PostgreSQL, Auth, Storage (fotos, vídeos), Realtime (chat) | `lib/supabase/`, todos os route handlers |
| **Stripe** | Pagamento cartão internacional, assinatura recorrente, portal | `lib/stripe.ts`, `api/billing/stripe/`, `api/webhooks/stripe` |
| **PagarMe** | Pix, boleto, cartão tokenizado (Brasil) | `lib/pagarme.ts`, `api/billing/pagarme/`, `api/webhooks/pagarme` |
| **Focus NFe** | Emissão de NFSe automática | `packages/fiscal/`, `lib/nfse/`, `api/webhooks/focusnfe` |
| **Resend** | Email transacional (8 templates) | `lib/email.ts`, `lib/email/render.ts`, `emails/` |
| **Firebase Admin** | Push notifications (FCM/APNs) | `lib/push/firebase-admin.ts`, `lib/push/send.ts` |
| **Web Push** | Notificações web (VAPID) | `lib/push.ts` |
| **Sentry** | Error tracking | `@sentry/nextjs` |
| **PostHog** | Product analytics | `lib/posthog/client.ts` |
| **Better Stack** | Uptime monitoring, heartbeats (9 jobs) | `lib/monitoring/heartbeat.ts` |
| **Daily.co** | Videoconferência (consultas) | `lib/daily.ts`, sala de vídeo |
| **MediaPipe** | Pose estimation (análise de forma), detecção facial | `lib/pose-detector.ts`, `@mediapipe/tasks-vision` |
| **Leaflet** | Mapas (academias, check-in GPS) | `components/gym-map.tsx` |
| **Three.js** | Anatomia 3D, heatmap muscular | `components/muscle-body-3d.tsx` |
| **ReactFlow** | Grafo visual de habilidades | `components/skills/`, `@xyflow/react` |
| **Fitbit** | Wearable sync (OAuth) | `lib/wearables/providers.ts` |
| **WHOOP** | Wearable sync (OAuth) | `lib/wearables/providers.ts` |
| **Garmin** | Wearable sync (OAuth) | `lib/wearables/providers.ts` |
| **Zepp (Mi Band)** | Wearable sync (OAuth) | `lib/wearables/providers.ts` |
| **Apple Health** | Health sync (Capacitor) | `@capgo/capacitor-health` |
| **Google Fit** | Health sync (Capacitor) | `@capgo/capacitor-health` |
| **Chromecast** | TV workout (Custom Receiver CAF) | `lib/cast/sender.ts`, `public/cast-receiver.html` |
| **ElevenLabs** | TTS para dicas de exercício | `api/tts/elevenlabs` |
| **Capacitor** | Bridge nativo iOS/Android | `plugins/`, `native/` |

---

## 7. Funcionalidades Identificadas

### 7.1 Core Fitness
- [x] Onboarding conversacional com IA
- [x] Dashboard com activity rings e FAB radial
- [x] Autopilot — plano diário gerado por IA (treino + nutrição + check-in)
- [x] Treino adaptativo (ajusta por readiness, equipamento, histórico)
- [x] Templates de treino editáveis com supersets visuais
- [x] Exercícios com vídeos e análise de forma em tempo real (MediaPipe)
- [x] Reconhecimento de equipamento por foto (Claude Vision)
- [x] Modo academia nova (scan multi-foto + treino adaptativo)
- [x] Importação de treinos (Strong, Hevy, Strava, Excel/CSV)
- [x] Timer circular com séries e descanso
- [x] Cardio GPS tracking com mapa, pace e splits
- [x] Heatmap semanal de músculos trabalhados
- [x] Anatomia 3D com Three.js

### 7.2 Nutrição
- [x] Reconhecimento de alimentos por foto (Claude Vision)
- [x] Base de 150 alimentos TACO (brasileira)
- [x] Log de refeições com macros
- [x] Substituição inteligente de alimentos via IA
- [x] Lista de compras automática via IA
- [x] 50+ receitas brasileiras regionais com filtros

### 7.3 Saúde
- [x] Check-in matinal (sono, humor, dor, energia)
- [x] Mapa corporal de dor
- [x] Registro de peso com predição (regressão linear)
- [x] Bioimpedância InBody com ring chart SVG
- [x] Biomarcadores com classificação automática e alertas
- [x] Extração de dados de exames PDF (Claude Vision)
- [x] Sleep fitness score
- [x] Readiness score (HRV, FC repouso, sono, volume)
- [x] Detecção de overtraining
- [x] Ciclo menstrual com ajustes no treino
- [x] Warmup sugerido baseado no readiness

### 7.4 Coach IA
- [x] Chat streaming com Claude
- [x] 3 personas: Leo (motivador), Sofia (técnica), Rafa (equilibrado)
- [x] Mensagens proativas contextuais
- [x] Cache de respostas comuns (TTL)
- [x] Rate limiting por tier com detecção de anomalia
- [x] Contexto rico (histórico, treinos, nutrição, saúde)
- [x] Fallback para Claude Haiku
- [x] Dashboard admin de métricas IA

### 7.5 Social e Comunidade
- [x] Feed social com posts automáticos (milestones)
- [x] Reações e comentários
- [x] Grupos por interesse com aprovação admin
- [x] Amigos com comparação VS (stats, skills, fotos)
- [x] Galeria pública de transformações antes/depois
- [x] Moderação híbrida IA + humana com trust score
- [x] Denúncias e bloqueios
- [x] Cópia de treinos entre usuários

### 7.6 Gamificação
- [x] XP, níveis e streaks
- [x] Conquistas (achievements)
- [x] Quests diárias
- [x] Desafios pessoais e de comunidade com leaderboard ao vivo
- [x] Mini-desafios rápidos
- [x] Rankings por academia, cidade e estado
- [x] Árvore de habilidades (40+ movimentos) com grafo visual
- [x] Trilhas guiadas 21/30/60 dias
- [x] Fotos de progresso nas trilhas
- [x] Wrapped anual

### 7.7 Academias e Geolocalização
- [x] Base colaborativa de academias
- [x] Mapa interativo Leaflet
- [x] Check-in por GPS
- [x] Reivindicação de academia (claim)
- [x] Painel B2B para donos (analytics agregados)
- [x] Aulas coletivas com vagas e lista de espera
- [x] Avaliações
- [x] Scan de equipamento por foto

### 7.8 Marketplace de Profissionais
- [x] Cadastro com verificação CRN/CREF/CREFITO
- [x] Perfis com avaliações e favoritos
- [x] Agendamento com disponibilidade e bloqueio de datas
- [x] Videoconferência embutida (Daily.co)
- [x] Chat assíncrono (Supabase Realtime)
- [x] Histórico compartilhado
- [x] Configuração fiscal por profissional
- [x] Plano Premium com consultoria e pool de profissionais

### 7.9 Pagamentos e Fiscal
- [x] 4 planos: Pro mensal/anual, Premium mensal/anual
- [x] Stripe (cartão internacional)
- [x] PagarMe (Pix, boleto, cartão tokenizado)
- [x] Renovação automática Pix com dunning e grace period
- [x] Upgrade/downgrade com proração multi-gateway
- [x] Cancelamento com retenção 5 etapas + ofertas contextuais
- [x] Win-back email automático
- [x] NFSe automática via Focus NFe
- [x] NFSe de assinaturas (cron)

### 7.10 Wearables
- [x] Fitbit (OAuth)
- [x] WHOOP (OAuth)
- [x] Garmin (OAuth, placeholder)
- [x] Zepp/Mi Band (OAuth)
- [x] Apple Health (Capacitor)
- [x] Google Fit (Capacitor)
- [x] Sync automático via cron

### 7.11 Plataforma Nativa
- [x] PWA (Next.js)
- [x] Capacitor (iOS + Android)
- [x] Widgets iOS (WidgetKit) — streak, readiness, treino, check-in
- [x] Widgets Android (AppWidgetProvider)
- [x] Siri Shortcuts (5 ações)
- [x] Google Assistant App Actions (5 ações)
- [x] Apple Watch complications (streak, readiness gauge, treino)
- [x] Apple Watch app básico
- [x] Chromecast Custom Receiver
- [x] TV bridge (segunda tela/window)
- [x] Push (FCM, APNs, Web Push)
- [x] Deep links (11 rotas)
- [x] Haptics, biometric auth, camera nativa

### 7.12 Observabilidade e Admin
- [x] Sentry error tracking
- [x] PostHog product analytics
- [x] Better Stack uptime (health endpoints + 9 heartbeats)
- [x] 18 páginas admin
- [x] Feature flags
- [x] Relatórios mensais (PDF, CSV)
- [x] Dashboard de IA (métricas, cache, rate limits)
- [x] Moderação (denúncias, trust score, decisões)
- [x] Backup Supabase automatizado

### 7.13 LGPD e Compliance
- [x] Política de privacidade completa
- [x] Termos de uso
- [x] Exportação de dados pessoais
- [x] Exclusão de conta
- [x] Consentimento de gravação (consultas)
- [x] Anonimização facial (MediaPipe) na galeria
- [x] Data safety (Play Store) e privacy labels (App Store) documentados

---

## 8. Pontos Incompletos ou Suspeitos

### 8.1 Tipos Supabase Placeholder
- `packages/types/src/supabase.ts` contém tipos placeholder, não gerados do schema real
- Todos os inserts usam `as Record<string, unknown>` como workaround
- **Impacto:** Sem type safety real nas operações de banco
- **Ação:** Rodar `pnpm db:types` com Supabase CLI conectado ao projeto real

### 8.2 Garmin Wearable
- `lib/wearables/providers.ts` tem implementação Zepp mas Garmin é mencionado apenas no OAuth flow
- Garmin Connect API requer programa de parceria específico
- **Ação:** Verificar se a integração Garmin está completa ou é apenas placeholder

### 8.3 Apple Watch — Conflito @main
- `Complications.swift` e `MyFitLifeWatchApp.swift` ambos têm `@main`
- Documentado no README mas requer resolução manual no Xcode
- **Ação:** Separar em targets (Watch App vs Watch Widget Extension)

### 8.4 Chromecast App ID
- `initCast(receiverAppId)` recebe o ID como parâmetro mas não há ID registrado no Google Cast Console
- **Ação:** Registrar app no Cast Developer Console para obter o receiverAppId

### 8.5 ElevenLabs TTS
- Endpoint `api/tts/elevenlabs` existe mas não há env var documentada para API key
- **Ação:** Documentar `ELEVENLABS_API_KEY` nas env vars

### 8.6 Testes
- Apenas 15 arquivos de teste para 216 routes + 134 pages + 65 components
- Coverage thresholds definidos em 45/45/40/45 (baixo)
- Visual regression existe mas snapshots devem ser gerados no CI (Linux)
- **Ação:** Aumentar cobertura de testes progressivamente

### 8.7 Capacitor Native não Build-testado
- Código Swift/Kotlin em `native/` é copiado manualmente — não há CI para compilação nativa
- **Ação:** Considerar CI com Xcode Cloud / Fastlane

### 8.8 Daily.co API Key
- `DAILY_API_KEY` mencionado em `lib/daily.ts` mas não listado no CLAUDE.md
- **Ação:** Documentar na seção de env vars

### 8.9 URLs Hardcoded Residuais
- `lib/billing/renewal-notifications.ts:163` ainda usa fallback `https://myfitlife.app` em template HTML inline (não migrado para React Email)
- **Ação:** Migrar para usar `BRAND.url` do React Email

---

## 9. Observações Técnicas

### 9.1 Variáveis de Ambiente (65+)

#### Supabase (obrigatórias)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

#### IA
```
ANTHROPIC_API_KEY
```

#### Pagamentos
```
STRIPE_SECRET_KEY
STRIPE_PRICE_PRO_MONTHLY
STRIPE_PRICE_PRO_YEARLY
STRIPE_PRICE_PREMIUM_MONTHLY
STRIPE_PRICE_PREMIUM_YEARLY
PAGARME_API_KEY
PAGARME_PLAN_PRO_MONTHLY
PAGARME_PLAN_PRO_YEARLY
PAGARME_PLAN_PREMIUM_MONTHLY
PAGARME_PLAN_PREMIUM_YEARLY
```

#### Email
```
RESEND_API_KEY
RESEND_FROM
```

#### Push Notifications
```
FIREBASE_SERVICE_ACCOUNT_BASE64
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT
```

#### Monitoring
```
HEALTH_CHECK_TOKEN
CRON_SECRET
HEARTBEAT_AUTOPILOT_URL
HEARTBEAT_PROACTIVE_URL
HEARTBEAT_WEEKLY_SUMMARY_URL
HEARTBEAT_DAILY_CLEANUP_URL
HEARTBEAT_NFSE_QUEUE_URL
HEARTBEAT_PIX_RENEWALS_URL
HEARTBEAT_PIX_CHECK_PAYMENTS_URL
HEARTBEAT_NFSE_SUB_QUEUE_URL
HEARTBEAT_PREMIUM_QUOTA_RESET_URL
```

#### Analytics
```
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST
```

#### Videoconferência
```
DAILY_API_KEY
```

#### Fiscal
```
MYFITLIFE_CNPJ
MYFITLIFE_LEGAL_NAME
MYFITLIFE_MUNICIPAL_REG
MYFITLIFE_SERVICE_CODE
MYFITLIFE_CNAE
MYFITLIFE_TAX_RATE
MYFITLIFE_ADDR_CITY_CODE
```

#### Wearables
```
FITBIT_CLIENT_ID
FITBIT_CLIENT_SECRET
WHOOP_CLIENT_ID
WHOOP_CLIENT_SECRET
ZEPP_CLIENT_ID
ZEPP_CLIENT_SECRET
```

#### Site
```
NEXT_PUBLIC_SITE_URL
BASE_URL
```

### 9.2 Padrões Arquiteturais

1. **3 formas de Supabase client:** Server (SSR cookies), Client (browser), Service Role (crons)
2. **Cron pattern:** Bearer CRON_SECRET → Service Role client → withHeartbeat() wrapper
3. **Feature flags:** Tabela `feature_flags` + lib helper + admin UI
4. **Rate limiting:** Duas implementações (v1 simples, v2 com tiers e anomaly detection)
5. **Moderação:** Automática (Claude Vision) → Trust score → Decisão humana se necessário
6. **Design tokens:** Dark-first, accent `#00D9A3`, bg `#0A0A0A`, surface `#141414`
7. **Monorepo imports:** `@myfitlife/ai`, `@myfitlife/core`, `@myfitlife/types`, `@myfitlife/fiscal`
8. **State management:** Zustand (global), Jotai (atoms), React Query (server state)

### 9.3 Contadores Finais

| Métrica | Quantidade |
|---------|-----------|
| Commits | 88 |
| API Route Handlers | 216 |
| Páginas Frontend | 134 |
| Componentes | 65 |
| Arquivos lib/ | 86 |
| Tabelas Supabase | 120+ |
| Cron Jobs | 14 |
| Email Templates | 8 |
| Integrações Externas | 24 |
| Env Vars | 65+ |
| Testes | 15 arquivos |
| Páginas Admin | 18 |
| Personas de Coach IA | 3 |
| Wearables Suportados | 6 |
| Planos de Assinatura | 4 |
| Gateways de Pagamento | 2 |
| Deep Links | 11 |
| Siri/Assistant Shortcuts | 5 |
| Watch Complications | 3 |
| Heartbeat Jobs | 9 |

---

*Snapshot gerado automaticamente em 2026-04-20 a partir da análise completa do repositório MyFitLife.*
