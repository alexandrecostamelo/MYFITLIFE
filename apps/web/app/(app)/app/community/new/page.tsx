'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Image as ImageIcon, X } from 'lucide-react';

export default function NewPostPage() {
  const router = useRouter();
  const search = useSearchParams();
  const preselectedGroup = search.get('group');

  const [content, setContent] = useState('');
  const [groupId, setGroupId] = useState<string>('');
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/groups').then((r) => r.json()).then((d) => {
      const joined = (d.groups || []).filter((g: any) => g.is_member);
      setMyGroups(joined);
      if (preselectedGroup) {
        const g = joined.find((x: any) => x.slug === preselectedGroup);
        if (g) setGroupId(g.id);
      }
    });
  }, [preselectedGroup]);

  function handlePhoto(file: File | null) {
    setPhoto(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  }

  async function submit() {
    if (!content.trim()) { setError('Escreva algo'); return; }
    setSaving(true);
    setError(null);

    let res: Response;
    if (photo) {
      const formData = new FormData();
      formData.append('content', content);
      if (groupId) formData.append('group_id', groupId);
      formData.append('photo', photo);
      res = await fetch('/api/posts', { method: 'POST', body: formData });
    } else {
      res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, group_id: groupId || undefined }),
      });
    }

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || 'Erro ao postar');
      return;
    }

    if (data.moderation_status === 'flagged') {
      alert('Seu post foi sinalizado pela moderação e não foi publicado. Motivo: ' + (data.moderation_reason || 'conteúdo inadequado'));
      return;
    }

    router.push('/app/community');
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/community" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-xl font-bold">Novo post</h1>
      </header>

      <Card className="mb-4 space-y-3 p-4">
        <div>
          <Label>Postar em</Label>
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm"
          >
            <option value="">Feed geral (todos)</option>
            {myGroups.map((g) => (
              <option key={g.id} value={g.id}>{g.cover_emoji} {g.name}</option>
            ))}
          </select>
        </div>

        <textarea
          className="w-full rounded-md border border-input bg-transparent p-3 text-sm"
          rows={6}
          placeholder="Compartilhe algo com a comunidade..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={2000}
        />
        <div className="text-right text-xs text-muted-foreground">{content.length}/2000</div>

        {photoPreview && (
          <div className="relative overflow-hidden rounded-lg">
            <img src={photoPreview} alt="preview" className="w-full" />
            <button
              onClick={() => handlePhoto(null)}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full" disabled={saving}>
          <ImageIcon className="mr-2 h-4 w-4" /> {photo ? 'Trocar foto' : 'Adicionar foto'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])}
        />
      </Card>

      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

      <p className="mb-3 text-xs text-muted-foreground">
        Posts são analisados por IA antes de publicar. Conteúdo que incentive transtornos alimentares, body shaming ou assédio é bloqueado automaticamente.
      </p>

      <Button onClick={submit} disabled={saving || !content.trim()} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Publicar'}
      </Button>
    </main>
  );
}
