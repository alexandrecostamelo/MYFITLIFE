'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PostCard } from '@/components/post-card';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Plus, Users, Loader2 } from 'lucide-react';

export default function CommunityPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedType, setFeedType] = useState<'home' | 'friends' | 'groups'>('home');
  const [userId, setUserId] = useState<string>('');

  async function loadUser() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  }

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/posts?feed=${feedType}`);
    const data = await res.json();
    setPosts(data.posts || []);
    setLoading(false);
  }

  useEffect(() => { loadUser(); }, []);
  useEffect(() => { load(); }, [feedType]);

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Comunidade</h1>
      </header>

      <div className="mb-3 flex gap-2">
        <Button asChild className="flex-1">
          <Link href="/app/community/new"><Plus className="mr-2 h-4 w-4" /> Novo post</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/app/community/groups"><Users className="h-4 w-4" /></Link>
        </Button>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-1">
        {(['home', 'friends', 'groups'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFeedType(f)}
            className={`rounded-md border px-3 py-1.5 text-xs ${feedType === f ? 'border-primary bg-primary/10' : 'border-input'}`}
          >
            {f === 'home' ? 'Todos' : f === 'friends' ? 'Amigos' : 'Grupos'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : posts.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          {feedType === 'home' && 'Nenhum post ainda. Seja o primeiro!'}
          {feedType === 'friends' && 'Seus amigos ainda não postaram. Convide mais gente!'}
          {feedType === 'groups' && 'Entre em grupos para ver posts aqui.'}
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} currentUserId={userId} onDelete={load} />
          ))}
        </div>
      )}
    </main>
  );
}
