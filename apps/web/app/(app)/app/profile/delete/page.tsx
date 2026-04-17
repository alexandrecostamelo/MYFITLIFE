'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, AlertTriangle, Download } from 'lucide-react';

export default function DeleteAccountPage() {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (confirmText !== 'EXCLUIR') {
      setError('Digite EXCLUIR exatamente para confirmar');
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'EXCLUIR' }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Falha ao excluir conta');
        setDeleting(false);
        return;
      }
      router.push('/login');
      router.refresh();
    } catch {
      setError('Erro inesperado');
      setDeleting(false);
    }
  }

  async function handleExport() {
    const res = await fetch('/api/account/export');
    if (!res.ok) { setError('Falha ao exportar'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `myfitlife-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/profile" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Excluir conta</h1>
      </header>

      <Card className="mb-4 border-amber-200 bg-amber-50 p-4">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
          <div className="text-sm">
            <p className="font-medium text-amber-900">Esta ação é irreversível</p>
            <p className="mt-1 text-amber-800">
              Ao excluir sua conta, todos os seus dados serão removidos permanentemente: perfil, refeições, treinos,
              registros de peso, check-ins, conversas com o coach e planos diários.
            </p>
          </div>
        </div>
      </Card>

      <Card className="mb-4 p-4">
        <h2 className="mb-2 text-sm font-medium">Antes de excluir</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Você pode baixar uma cópia completa dos seus dados em formato JSON (LGPD — direito à portabilidade).
        </p>
        <Button variant="outline" onClick={handleExport} className="w-full">
          <Download className="mr-2 h-4 w-4" /> Baixar meus dados
        </Button>
      </Card>

      <Card className="mb-4 p-4">
        <h2 className="mb-2 text-sm font-medium">Confirmação</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Para confirmar, digite <strong>EXCLUIR</strong> no campo abaixo.
        </p>
        <Label htmlFor="confirm">Digite EXCLUIR</Label>
        <Input
          id="confirm"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="EXCLUIR"
          className="mb-3 mt-1"
          autoComplete="off"
        />
        {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={deleting || confirmText !== 'EXCLUIR'}
          className="w-full"
        >
          {deleting ? 'Excluindo...' : 'Excluir minha conta permanentemente'}
        </Button>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Logs de acesso são mantidos por 6 meses conforme Marco Civil da Internet.
      </p>
    </main>
  );
}
