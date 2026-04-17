'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

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
          <div className="text-lg font-medium">{profile.full_name}</div>
          <div className="mt-2 text-sm text-muted-foreground">
            <div>Objetivo: {profile.primary_goal}</div>
            <div>Nível: {profile.experience_level}</div>
            <div>Tom do coach: {profile.coach_tone}</div>
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

      <Button variant="outline" onClick={logout} className="w-full">Sair</Button>
    </main>
  );
}
