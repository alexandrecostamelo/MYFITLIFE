'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReset() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-sm p-6">
        <h1 className="mb-1 text-2xl font-bold text-primary">Recuperar senha</h1>
        <p className="mb-6 text-sm text-muted-foreground">Enviaremos um link para redefinir sua senha</p>

        {sent ? (
          <div className="space-y-3 text-sm">
            <p className="font-medium">Link enviado!</p>
            <p className="text-muted-foreground">Confira seu email e clique no link para criar uma nova senha.</p>
            <Link href="/login" className="block text-center text-primary hover:underline">
              Voltar ao login
            </Link>
          </div>
        ) : (
          <>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              className="mb-4 mt-1"
              onKeyDown={(e) => e.key === 'Enter' && email && handleReset()}
            />
            {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
            <Button onClick={handleReset} disabled={loading || !email} className="w-full">
              {loading ? 'Enviando...' : 'Enviar link de recuperação'}
            </Button>
            <Link href="/login" className="mt-4 block text-center text-sm text-muted-foreground hover:underline">
              Voltar ao login
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}
