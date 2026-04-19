# MyFitLife — Guia de Publicação nas Lojas

## Pré-requisitos

- Node.js 20+, pnpm, JDK 17+ (Android), Xcode 15+ (iOS)
- Conta Google Play Console + Apple Developer Account
- Deploy da versão web no Vercel (a URL do app é referenciada em `capacitor.config.ts`)

---

## 1. Configurar Capacitor

```bash
cd apps/web

# Adicionar plataformas (primeira vez)
pnpm cap add android
pnpm cap add ios

# Sincronizar (após qualquer mudança no capacitor.config.ts ou plugins)
pnpm cap:sync
```

---

## 2. Variáveis de Ambiente Necessárias

| Variável | Onde usar |
|---|---|
| `CAPACITOR_DEV_SERVER_URL` | Desenvolvimento local (ex: `http://192.168.1.x:3000`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + build nativo |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + build nativo |

---

## 3. Android (Play Store)

### Preparação

1. Abrir Android Studio: `pnpm cap:android`
2. Em `android/app/build.gradle`:
   - `applicationId "com.myfitlife.app"`
   - `versionCode` incrementar a cada release
   - `versionName` igual ao `package.json` version
3. Gerar keystore de assinatura (apenas uma vez):
   ```bash
   keytool -genkey -v -keystore myfitlife.keystore -alias myfitlife -keyalg RSA -keysize 2048 -validity 10000
   ```
4. Configurar `android/app/build.gradle` com o `signingConfig`

### Assets necessários

- [ ] Ícone 512×512 PNG (sem fundo transparente) → `android/app/src/main/res/`
- [ ] Feature graphic 1024×500 PNG (Play Console)
- [ ] Screenshots: phone (mín. 2), tablet 7" (opcional), tablet 10" (opcional)
- [ ] Splash screen: `android/app/src/main/res/drawable/splash.png`

### Build de produção

```bash
# No Android Studio: Build → Generate Signed Bundle/APK → Android App Bundle (.aab)
# OU via linha de comando:
cd android && ./gradlew bundleRelease
```

### Checklist Play Console

- [ ] Criar app no Google Play Console
- [ ] Preencher ficha da loja (PT-BR): título, descrição curta, descrição longa
- [ ] Definir categoria: Saúde e Fitness
- [ ] Política de privacidade URL
- [ ] Classificação etária (questionário)
- [ ] Declaração de permissões: Câmera, Notificações, Biometria
- [ ] Upload do `.aab` em Produção → Revisão → Publicar

---

## 4. iOS (App Store)

### Preparação

1. Abrir Xcode: `pnpm cap:ios`
2. Em Xcode → Signing & Capabilities:
   - Selecionar Team (Apple Developer)
   - Bundle ID: `com.myfitlife.app`
3. Incrementar `Build` e `Version` em cada release

### Assets necessários

- [ ] Ícone: usar AppIcon (1024×1024, sem transparência) no `Assets.xcassets`
- [ ] Splash: LaunchScreen.storyboard ou LaunchImage
- [ ] Screenshots: iPhone 6.7" (obrigatório), iPad 12.9" (se suportar iPad)

### Permissões (Info.plist)

Adicionar no `ios/App/App/Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>Para tirar fotos de progresso e refeições.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Para selecionar fotos da galeria.</string>
<key>NSFaceIDUsageDescription</key>
<string>Para login rápido com biometria.</string>
```

### Build & Distribuição

```bash
# No Xcode: Product → Archive → Distribute App → App Store Connect
```

### Checklist App Store Connect

- [ ] Criar app no App Store Connect
- [ ] Preencher metadados (PT-BR): nome, subtítulo, palavras-chave, descrição
- [ ] Categoria: Health & Fitness
- [ ] Política de privacidade URL
- [ ] Responder questionário de privacidade (dados coletados)
- [ ] Declarar uso de criptografia (se usar HTTPS: sim, isento)
- [ ] Upload do build via Xcode ou Transporter
- [ ] Submeter para revisão

---

## 5. Deep Links

### Android

Em `android/app/src/main/AndroidManifest.xml`, adicionar intent-filter:
```xml
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="myfitlife" />
  <data android:scheme="https" android:host="myfitlife.app" />
</intent-filter>
```

### iOS

Em `ios/App/App/Info.plist`:
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array><string>myfitlife</string></array>
  </dict>
</array>
```

---

## 6. Notificações Push

### Android (FCM)

1. Criar projeto no Firebase Console
2. Baixar `google-services.json` → colocar em `android/app/`
3. No `android/app/build.gradle`: adicionar plugin Google Services

### iOS (APNs)

1. Em App Store Connect → Certificados → Push Notifications
2. Exportar `.p8` e configurar no Supabase Dashboard → Settings → Auth → Push

---

## 7. Checklist Final

- [ ] `capacitor.config.ts` aponta para URL de produção do Vercel
- [ ] `pnpm cap:sync` executado após qualquer mudança
- [ ] Ícones e splash screens criados para ambas as plataformas
- [ ] Builds de release assinados
- [ ] Deep links configurados no manifesto/Info.plist
- [ ] Notificações push configuradas (FCM + APNs)
- [ ] Teste em device físico (iOS e Android) antes de submeter
- [ ] Fichas das lojas preenchidas em PT-BR
- [ ] Políticas de privacidade e termos publicados em URL acessível
