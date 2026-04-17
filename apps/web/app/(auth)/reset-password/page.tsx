'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpdate() {
    if (password.length < 6) { setError('Senha precisa ter pelo menos 6 caracteres'); return; }
    if (password !== confirm) { setError('Senhas não conferem'); return; }

    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.push('/app');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-sm p-6">
        <h1 className="mb-1 text-2xl font-bold text-primary">Nova senha</h1>
        <p className="mb-6 text-sm text-muted-foreground">Crie uma senha segura</p>

        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="mb-3 mt-1"
        />

        <Label htmlFor="confirm">Confirmar senha</Label>
        <Input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          className="mb-4 mt-1"
          onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
        />

        {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

        <Button onClick={handleUpdate} disabled={loading || !password || !confirm} className="w-full">
          {loading ? 'Salvando...' : 'Atualizar senha'}
        </Button>
      </Card>
    </div>
  );
}
