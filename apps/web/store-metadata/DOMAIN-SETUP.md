# Configuração de Domínio — MyFitLife

Guia completo para configurar domínio próprio, DNS, email e HTTPS.

---

## 1. Registrar domínio

| Domínio | Onde comprar | Preço |
|---------|-------------|-------|
| **myfitlife.app** (recomendado) | Squarespace, Namecheap, Cloudflare | ~$14/ano |
| **myfitlife.com.br** (BR fallback) | Registro.br | ~R$40/ano |
| **myfitlife.fit** | Namecheap | ~$5/ano |

Recomendação: compre `.app` (principal) e `.com.br` (redirect).

---

## 2. DNS — Vercel

No painel do registrador, adicione:

```
Type    Host    Value                       TTL
A       @       76.76.21.21                 300
CNAME   www     cname.vercel-dns.com        300
```

No Vercel Dashboard → Settings → Domains:
1. Add `myfitlife.app`
2. Add `www.myfitlife.app` → redirect para `myfitlife.app`
3. SSL é automático

Verificar:
```bash
curl -I https://myfitlife.app
# HTTP/2 200
```

---

## 3. DNS — Resend (email transacional)

No Resend Dashboard → Settings → Domains → Add `myfitlife.app`.

Resend fornece estes records para adicionar no DNS:

```
Type    Host                            Value                                       TTL
MX      myfitlife.app                   feedback-smtp.us-east-1.amazonses.com       300     Priority: 10
TXT     myfitlife.app                   v=spf1 include:amazonses.com ~all           300
CNAME   resend._domainkey               (fornecido pelo Resend)                     300
CNAME   resend2._domainkey              (fornecido pelo Resend)                     300
CNAME   resend3._domainkey              (fornecido pelo Resend)                     300
```

Após adicionar, clique "Verify" no Resend. Pode levar até 72h (geralmente 30min).

---

## 4. DNS — DMARC

```
Type    Host        Value                                                                   TTL
TXT     _dmarc      v=DMARC1; p=quarantine; rua=mailto:dmarc@myfitlife.app; pct=100; adkim=s; aspf=s    300
```

Após confirmar que emails chegam, mudar `p=quarantine` para `p=reject`.

---

## 5. Supabase — Custom SMTP

Dashboard → Authentication → SMTP Settings:

| Campo | Valor |
|-------|-------|
| Host | `smtp.resend.com` |
| Port | `465` (SSL) ou `587` (TLS) |
| Username | `resend` |
| Password | API key do Resend (`re_xxx`) |
| Sender email | `noreply@myfitlife.app` |
| Sender name | `MyFitLife` |

---

## 6. Supabase — Auth Email Templates

Cole no Dashboard → Authentication → Email Templates:

### Confirm signup
```html
<div style="font-family: Inter, system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background: #0A0A0A; color: #FAFAFA;">
  <h1 style="color: #00D9A3; font-size: 24px; margin-bottom: 24px;">MyFitLife</h1>
  <h2 style="font-size: 20px; margin-bottom: 16px;">Confirme seu email</h2>
  <p style="color: #A0A0A0; font-size: 14px; line-height: 1.6;">
    Clique no botão abaixo para confirmar seu cadastro e começar a usar o MyFitLife.
  </p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{ .ConfirmationURL }}" style="background: #00D9A3; color: #0A0A0A; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
      Confirmar email
    </a>
  </div>
  <p style="color: #666; font-size: 12px;">Se você não criou esta conta, ignore este email.</p>
</div>
```

### Reset password
```html
<div style="font-family: Inter, system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background: #0A0A0A; color: #FAFAFA;">
  <h1 style="color: #00D9A3; font-size: 24px; margin-bottom: 24px;">MyFitLife</h1>
  <h2 style="font-size: 20px; margin-bottom: 16px;">Redefinir senha</h2>
  <p style="color: #A0A0A0; font-size: 14px; line-height: 1.6;">
    Você pediu pra redefinir sua senha. Clique no botão abaixo.
  </p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{ .ConfirmationURL }}" style="background: #00D9A3; color: #0A0A0A; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
      Redefinir senha
    </a>
  </div>
  <p style="color: #666; font-size: 12px;">Se você não pediu isso, ignore este email. O link expira em 1 hora.</p>
</div>
```

### Magic link
```html
<div style="font-family: Inter, system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background: #0A0A0A; color: #FAFAFA;">
  <h1 style="color: #00D9A3; font-size: 24px; margin-bottom: 24px;">MyFitLife</h1>
  <h2 style="font-size: 20px; margin-bottom: 16px;">Seu link de acesso</h2>
  <p style="color: #A0A0A0; font-size: 14px; line-height: 1.6;">
    Clique no botão abaixo pra entrar na sua conta. O link expira em 1 hora.
  </p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{ .ConfirmationURL }}" style="background: #00D9A3; color: #0A0A0A; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
      Entrar no MyFitLife
    </a>
  </div>
  <p style="color: #666; font-size: 12px;">Se você não pediu este link, ignore este email.</p>
</div>
```

---

## 7. Supabase — URL Configuration

Dashboard → Authentication → URL Configuration:

| Campo | Valor |
|-------|-------|
| Site URL | `https://myfitlife.app` |
| Redirect URLs | `https://myfitlife.app/**`, `https://www.myfitlife.app/**`, `myfitlife:///**` |

---

## 8. Vercel — Environment Variables

Atualize no Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_SITE_URL=https://myfitlife.app
NEXT_PUBLIC_APP_URL=https://myfitlife.app
```

---

## 9. Webhooks — Atualizar URLs

| Serviço | Painel | Nova URL |
|---------|--------|----------|
| Stripe | dashboard.stripe.com → Webhooks | `https://myfitlife.app/api/webhooks/stripe` |
| PagarMe | dashboard.pagar.me → Webhooks | `https://myfitlife.app/api/webhooks/pagarme` |
| Daily.co | dashboard.daily.co → Webhooks | `https://myfitlife.app/api/webhooks/daily` |
| Focus NFe | focusnfe.com.br → Webhooks | `https://myfitlife.app/api/webhooks/focusnfe` |

---

## 10. Email de suporte (receber emails)

Opções para receber em suporte@myfitlife.app:

1. **Resend Inbound** (recomendado): MX → `inbound-smtp.resend.com` priority 10, webhook encaminha
2. **Google Workspace**: $6/user/mês, email corporativo completo
3. **Zoho Mail Free**: até 5 users grátis
4. **Forward Email** (forwardemail.net): grátis, encaminha pra Gmail

---

## 11. Checklist pós-domínio

```
[ ] https://myfitlife.app abre o app com HTTPS
[ ] www.myfitlife.app redireciona pra myfitlife.app
[ ] Email de signup chega de noreply@myfitlife.app
[ ] Email de recuperação de senha funciona
[ ] Webhooks Stripe/PagarMe apontam pro novo domínio
[ ] Deep links mobile funcionam (myfitlife:///app/dashboard)
[ ] Open Graph preview funciona (colar link no WhatsApp/Twitter)
[ ] Sentry captura erros no novo domínio
[ ] PostHog rastreia pageviews no novo domínio
[ ] DMARC/SPF/DKIM passam (testar em mail-tester.com)
```

---

## Custos

| Item | Custo |
|------|-------|
| Domínio .app | ~$14/ano |
| Domínio .com.br | ~R$40/ano |
| Resend | Free (100/dia) ou $20/mês (50k/mês) |
| Vercel | Free ou Pro $20/mês |
