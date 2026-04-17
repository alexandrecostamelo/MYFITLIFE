'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Pencil, Scale, ChevronRight, FileText, Shield, Trash2, Download } from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [targets, setTargets] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetch('/api/profile').then((r) => r.json()).then((d) => {
      setProfile(d.profile);
      setTargets(d.targets);
    });
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-2xl font-bold">Perfil</h1>

      {profile && (
        <Card className="mb-4 p-4">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <div className="text-lg font-medium">{profile.full_name}</div>
              {(profile.city || profile.state) && (
                <div className="text-xs text-muted-foreground">{[profile.city, profile.state].filter(Boolean).join(', ')}</div>
              )}
            </div>
            <Link href="/app/profile/edit" className="rounded p-2 hover:bg-slate-100">
              <Pencil className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div>Objetivo: {profile.primary_goal}</div>
            <div>Nível: {profile.experience_level}</div>
            <div>Tom do coach: {profile.coach_tone}</div>
            <div>Peso atual: {profile.current_weight_kg ? `${profile.current_weight_kg} kg` : '---'}</div>
          </div>
        </Card>
      )}

      {targets && (
        <Card className="mb-4 p-4">
          <h2 className="mb-2 text-sm font-medium">Metas diárias</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Calorias: {targets.cal} kcal</div>
            <div>Proteína: {targets.pro} g</div>
            <div>Carboidratos: {targets.carb} g</div>
            <div>Gorduras: {targets.fat} g</div>
          </div>
        </Card>
      )}

      <Card className="mb-4 divide-y">
        <Link href="/app/profile/edit" className="flex items-center justify-between p-4 hover:bg-slate-50">
          <div className="flex items-center gap-3">
            <Pencil className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Editar perfil</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link href="/app/weight" className="flex items-center justify-between p-4 hover:bg-slate-50">
          <div className="flex items-center gap-3">
            <Scale className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Registro de peso</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <button
          onClick={async () => {
            const res = await fetch('/api/account/export');
            if (!res.ok) return;
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `myfitlife-export-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-50"
        >
          <div className="flex items-center gap-3">
            <Download className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Exportar meus dados (LGPD)</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <Link href="/termos" className="flex items-center justify-between p-4 hover:bg-slate-50">
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Termos de uso</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link href="/privacidade" className="flex items-center justify-between p-4 hover:bg-slate-50">
          <div className="flex items-center gap-3">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Política de privacidade</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link href="/app/profile/delete" className="flex items-center justify-between p-4 hover:bg-slate-50">
          <div className="flex items-center gap-3">
            <Trash2 className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">Excluir minha conta</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </Card>

      <Button variant="outline" onClick={logout} className="w-full">Sair</Button>
    </main>
  );
}
