import { Resend } from 'resend';
import type { SupabaseClient } from '@supabase/supabase-js';

type Client = SupabaseClient<any, any, any>;

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM || 'MyFitLife <onboarding@resend.dev>';

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  userId?: string;
  template: string;
};

export async function sendEmail(supabase: Client, payload: EmailPayload): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!resend) {
    console.warn('[sendEmail] RESEND_API_KEY não configurada, email pulado');
    return { success: false, error: 'not_configured' };
  }

  if (payload.userId) {
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('email_enabled')
      .eq('user_id', payload.userId)
      .maybeSingle();
    if (prefs && !prefs.email_enabled) {
      return { success: false, error: 'opted_out' };
    }
  }

  const { data: logged } = await supabase
    .from('email_logs')
    .insert({
      user_id: payload.userId,
      to_email: payload.to,
      template: payload.template,
      subject: payload.subject,
      status: 'pending',
    })
    .select('id')
    .single();

  try {
    const response = await resend.emails.send({
      from: FROM,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
    });

    if (response.error) throw new Error(response.error.message);

    await supabase
      .from('email_logs')
      .update({
        status: 'sent',
        provider_id: response.data?.id,
        sent_at: new Date().toISOString(),
      })
      .eq('id', logged!.id);

    return { success: true, id: response.data?.id };
  } catch (err: any) {
    await supabase
      .from('email_logs')
      .update({
        status: 'failed',
        error_message: err.message,
      })
      .eq('id', logged!.id);
    return { success: false, error: err.message };
  }
}

export function welcomeEmailHtml(firstName: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#222;">
  <h1 style="color:#1f4e79;margin:0 0 16px;">Bem-vindo ao MyFitLife, ${firstName}!</h1>
  <p style="line-height:1.6;">Ficamos muito felizes em ter você aqui. O MyFitLife é seu parceiro diário para treino, nutrição e bem-estar, com IA que te ajuda a chegar aos seus objetivos.</p>
  <h3 style="margin-top:24px;">Para começar:</h3>
  <ul style="line-height:1.8;">
    <li>Complete o onboarding para personalizar seu plano</li>
    <li>Cadastre sua academia principal</li>
    <li>Registre sua primeira refeição pela foto</li>
    <li>Converse com o coach IA</li>
  </ul>
  <p style="margin-top:24px;">
    <a href="https://myfitlife.app/app" style="background:#1f4e79;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Abrir o app</a>
  </p>
  <p style="margin-top:32px;color:#888;font-size:12px;">Não quer mais receber emails? <a href="https://myfitlife.app/app/settings/notifications" style="color:#888;">Ajuste suas preferências</a>.</p>
</body></html>`.trim();
}

export function weeklySummaryEmailHtml(firstName: string, summary: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#222;">
  <h1 style="color:#1f4e79;margin:0 0 8px;">Sua semana, ${firstName}</h1>
  <p style="color:#666;margin-top:0;">${summary.highlight || 'Resumo da última semana'}</p>
  <table style="width:100%;margin-top:24px;border-collapse:collapse;">
    <tr>
      <td style="padding:12px;border:1px solid #eee;"><strong>${summary.workouts_count}</strong> treinos</td>
      <td style="padding:12px;border:1px solid #eee;"><strong>${summary.workouts_minutes}</strong> min</td>
    </tr>
    <tr>
      <td style="padding:12px;border:1px solid #eee;"><strong>${summary.meals_count}</strong> refeições</td>
      <td style="padding:12px;border:1px solid #eee;"><strong>${summary.xp_earned}</strong> XP ganho</td>
    </tr>
  </table>
  <p style="margin-top:24px;">
    <a href="https://myfitlife.app/app/reports/weekly" style="background:#1f4e79;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Ver relatório completo</a>
  </p>
  <p style="margin-top:32px;color:#888;font-size:12px;"><a href="https://myfitlife.app/app/settings/notifications" style="color:#888;">Gerenciar notificações</a></p>
</body></html>`.trim();
}

export function churnRecoveryEmailHtml(firstName: string, daysAway: number): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#222;">
  <h1 style="color:#1f4e79;margin:0 0 16px;">Sentimos sua falta, ${firstName}</h1>
  <p style="line-height:1.6;">Faz ${daysAway} dias que você não aparece por aqui. Tudo bem? Pequenos passos diários fazem grande diferença — que tal começar devagar hoje?</p>
  <p style="margin-top:24px;">
    <a href="https://myfitlife.app/app" style="background:#1f4e79;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Voltar pro MyFitLife</a>
  </p>
  <p style="margin-top:32px;color:#888;font-size:12px;">Prefere não receber mais estes emails? <a href="https://myfitlife.app/app/settings/notifications" style="color:#888;">Cancelar aqui</a>.</p>
</body></html>`.trim();
}
