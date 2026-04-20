# Checklist de Publicação — MyFitLife

## Pré-requisitos
- [ ] Conta Google Play Console ($25 único) — https://play.google.com/console
- [ ] Conta Apple Developer ($99/ano) — https://developer.apple.com
- [ ] Domínio myfitlife.app configurado e acessível
- [ ] Política de privacidade publicada em /privacidade
- [ ] Termos de uso publicados em /termos
- [ ] Todas as env vars de produção configuradas no Vercel

## Android (Play Store)

### Build
- [ ] Gerar keystore: `keytool -genkey -v -keystore myfitlife.keystore -alias myfitlife -keyalg RSA -keysize 2048 -validity 10000`
- [ ] GUARDAR KEYSTORE EM LOCAL SEGURO (perder = não atualiza mais o app)
- [ ] `npx cap sync android`
- [ ] Abrir Android Studio: `npx cap open android`
- [ ] Build → Generate Signed Bundle (AAB)
- [ ] Testar em dispositivo real antes de enviar

### Play Console
- [ ] Criar app: Tipo "App", Free, Categoria "Saúde e fitness"
- [ ] Preencher ficha com metadata do play-store.md
- [ ] Upload 5-8 screenshots (script pnpm screenshots)
- [ ] Upload ícone 512x512 PNG
- [ ] Feature graphic 1024x500 PNG
- [ ] Preencher Data Safety (data-safety.md)
- [ ] Content Rating questionnaire (IARC)
- [ ] Configurar países: Brasil (inicial), expandir depois
- [ ] Target API level: 34+
- [ ] Upload AAB em Production → Create release
- [ ] Enviar pra revisão

### Pós-publicação
- [ ] Testar download da loja
- [ ] Verificar deep links funcionando
- [ ] Verificar push notifications
- [ ] Monitorar crash reports no Play Console + Sentry

## iOS (App Store)

### Build
- [ ] Mac com Xcode 15+ instalado
- [ ] `npx cap sync ios`
- [ ] Abrir Xcode: `npx cap open ios`
- [ ] Signing: selecionar time, ativar HealthKit capability
- [ ] Product → Archive
- [ ] Distribute App → App Store Connect → Upload

### App Store Connect
- [ ] Criar app: Bundle ID, SKU, categoria "Health & Fitness"
- [ ] Preencher ficha com metadata do app-store.md
- [ ] Upload screenshots (iPhone 6.7", 6.5", iPad se universal)
- [ ] Preencher Privacy Nutrition Labels (privacy-labels.md)
- [ ] In-App Purchases: NÃO (usamos web billing, não IAP)
  - Se Apple rejeitar por isso: implementar IAP como alternativa
- [ ] App Review Information: conta de teste, notas pro reviewer
- [ ] Submit for Review

### Notas pro reviewer Apple
```
Conta de teste:
Email: reviewer@myfitlife.app
Senha: [criar conta teste]

O app usa web-based billing (Stripe) em vez de In-App Purchase
porque oferece Pix e Boleto como métodos de pagamento brasileiros
não suportados pelo IAP. Conforme Apple Developer Program
License Agreement §3.1.1, apps que oferecem serviços fora do app
podem usar métodos de pagamento externos.

Funcionalidades que requerem hardware:
- Reconhecimento de alimentos por foto (câmera)
- GPS tracking de corrida (localização)
- Apple Health (HealthKit)
```

### Pós-publicação
- [ ] Testar download da App Store
- [ ] Verificar HealthKit sync
- [ ] Monitorar crash reports no App Store Connect + Sentry
- [ ] Responder feedbacks da Apple se houver (geralmente 1-2 dias)

## Ambas as lojas
- [ ] Configurar webhooks de pagamento com URLs de produção
- [ ] Verificar emails transacionais chegando
- [ ] Criar conta de suporte (suporte@myfitlife.app)
- [ ] Preparar FAQ básico
- [ ] Monitorar Sentry e PostHog nas primeiras 48h
