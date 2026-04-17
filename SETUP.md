# Setup

## Local
```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
# preencher .env.local
pnpm dev
```

## Deploy
```bash
cd apps/web
pnpm dlx vercel
```

## Mobile
```bash
cd apps/web
pnpm next build
pnpm cap sync
pnpm cap open android
pnpm cap open ios
```
