import { createClient } from '@supabase/supabase-js';

export async function logAdminAction(params: {
  admin_id: string;
  action: string;
  target_user_id?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  await admin.from('admin_audit_log').insert({
    admin_id: params.admin_id,
    action: params.action,
    target_user_id: params.target_user_id || null,
    details: params.details || null,
  } as Record<string, unknown>);
}
