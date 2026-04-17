'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

type Mode = 'login' | 'signup' | 'magic';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.push('/app');
    router.refresh();
  }

  async function handleSignup() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setInfo('Conta criada! Confira seu email para confirmar.');
  }

  async function handleMagicLink() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  }

  const disabled = loading || !email || (mode !== 'magic' && !password);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-sm p-6">
        <h1 className="mb-1 text-2xl font-bold text-primary">MyFitLife</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {mode === 'login' && 'Entre na sua conta'}
          {mode === 'signup' && 'Crie sua conta'}
          {mode === 'magic' && 'Receba um link por email'}
        </p>

        {sent ? (
          <div className="space-y-2 text-sm">
            <p className="font-medium">Link enviado!</p>
            <p className="text-muted-foreground">Confira sua caixa de entrada.</p>
          </div>
        ) : info ? (
          <div className="space-y-2 text-sm">
            <p className="font-medium">{info}</p>
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
              className="mb-3 mt-1"
            />

            {mode !== 'magic' && (
              <>
                <div className="mb-1 flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  {mode === 'login' && (
                    <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                      Esqueci minha senha
                    </Link>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mb-4"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !disabled) {
                      mode === 'login' ? handleLogin() : handleSignup();
                    }
                  }}
                />
              </>
            )}

            {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

            {mode === 'login' && (
              <Button onClick={handleLogin} disabled={disabled} className="w-full">
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            )}
            {mode === 'signup' && (
              <label className="mb-3 flex items-start gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5"
                />
                <span className="text-muted-foreground">
                  Li e concordo com os <Link href="/termos" className="text-primary underline">Termos</Link> e a{' '}
                  <Link href="/privacidade" className="text-primary underline">Política de Privacidade</Link>.
                  Autorizo o tratamento dos meus dados de saúde para cálculo de metas e uso no aplicativo (LGPD art. 11, I).
                </span>
              </label>
            )}
            {mode === 'signup' && (
              <Button onClick={handleSignup} disabled={disabled || !agreed} className="w-full">
                {loading ? 'Criando...' : 'Criar conta'}
              </Button>
            )}
            {mode === 'magic' && (
              <Button onClick={handleMagicLink} disabled={loading || !email} className="w-full">
                {loading ? 'Enviando...' : 'Enviar link mágico'}
              </Button>
            )}

            <div className="mt-4 space-y-2 text-center text-sm">
              {mode === 'login' && (
                <>
                  <button onClick={() => { setMode('magic'); setError(null); }} className="block w-full text-primary hover:underline">
                    Entrar com link mágico
                  </button>
                  <button onClick={() => { setMode('signup'); setError(null); }} className="block w-full text-muted-foreground hover:underline">
                    Não tem conta? Criar conta
                  </button>
                </>
              )}
              {mode === 'signup' && (
                <button onClick={() => { setMode('login'); setError(null); }} className="block w-full text-muted-foreground hover:underline">
                  Já tem conta? Entrar
                </button>
              )}
              {mode === 'magic' && (
                <button onClick={() => { setMode('login'); setError(null); }} className="block w-full text-muted-foreground hover:underline">
                  Voltar para login com senha
                </button>
              )}
            </div>
          </>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Ao continuar você concorda com os{' '}
          <Link href="/termos" className="underline">Termos</Link> e a{' '}
          <Link href="/privacidade" className="underline">Política de Privacidade</Link>.
        </p>
      </Card>
    </div>
  );
}
