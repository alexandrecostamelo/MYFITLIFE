# Testes de regressão visual

Usam Playwright nativo com `toHaveScreenshot` — zero custo, snapshots versionados no repo.

## Rodar localmente

```bash
# Terminal 1
pnpm build && pnpm start

# Terminal 2
pnpm test:visual
```

## Quando a mudança é INTENCIONAL

Se você alterou o design e os testes falharem com regressão esperada:

```bash
pnpm test:visual:update
```

Revise os PNGs gerados antes de commitar. **Nunca** commite `--update-snapshots` sem olhar os diffs.

## UI interativa

```bash
pnpm test:visual:ui
```

## Quando é REGRESSÃO não esperada

O CI sobe o artefato `visual-diffs` com os PNGs de diferença. Baixe, identifique o que quebrou e corrija o código.

## Cobertura

| Spec | Páginas |
|---|---|
| `public.spec.ts` | home, login, forgot-password, termos, privacidade |
| `auth.spec.ts` | dashboard, perfil, skills, nutrição, treino, coach, transformações, settings, billing, desafios, conquistas |
| `components.spec.ts` | login-erro, forgot-filled, 404 |

## Projetos (viewports + temas)

| Projeto | Viewport | Tema |
|---|---|---|
| `desktop-light` | 1440×900 | claro |
| `desktop-dark` | 1440×900 | escuro |
| `mobile-light` | iPhone 14 | claro |

## AVISO CRÍTICO — Windows vs Linux

Snapshots gerados no Windows podem divergir no CI (Ubuntu) por diferenças de anti-aliasing de fontes. Recomendação:

1. Faça push do código
2. Deixe o CI gerar os snapshots iniciais com `--update-snapshots` (ou baixe os artefatos)
3. Commite os PNGs gerados pelo CI

Assim o baseline é sempre Linux, igual ao CI.
