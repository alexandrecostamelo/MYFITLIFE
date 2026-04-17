'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMagicLink() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-sm p-6">
        <h1 className="mb-1 text-2xl font-bold text-primary">MyFitLife</h1>
        <p className="mb-6 text-sm text-muted-foreground">Entre com seu email</p>

        {sent ? (
          <div className="space-y-2 text-sm">
            <p className="font-medium">Link enviado!</p>
            <p className="text-muted-foreground">
              Confira sua caixa de entrada e clique no link para entrar.
            </p>
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
              onKeyDown={(e) => e.key === 'Enter' && email && handleMagicLink()}
            />
            {error && (
              <p className="mb-3 text-sm text-destructive">{error}</p>
            )}
            <Button
              onClick={handleMagicLink}
              disabled={loading || !email}
              className="w-full"
            >
              {loading ? 'Enviando...' : 'Entrar com link mágico'}
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
