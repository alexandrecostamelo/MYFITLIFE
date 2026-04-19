import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail, welcomeEmailHtml } from '@/lib/email';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: already } = await supabase
    .from('email_logs')
    .select('id')
    .eq('user_id', user.id)
    .eq('template', 'welcome')
    .eq('status', 'sent')
    .maybeSingle();

  if (already) return NextResponse.json({ already_sent: true });

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
  const firstName = (profile?.full_name || '').split(' ')[0] || 'atleta';
  const email = user.email!;

  const result = await sendEmail(supabase, {
    to: email,
    userId: user.id,
    template: 'welcome',
    subject: 'Bem-vindo ao MyFitLife!',
    html: welcomeEmailHtml(firstName),
  });

  return NextResponse.json(result);
}
