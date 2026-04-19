'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PostCard } from '@/components/post-card';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Loader2, Users, Plus } from 'lucide-react';

export default function GroupDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [group, setGroup] = useState<any>(null);
  const [isMember, setIsMember] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [acting, setActing] = useState(false);

  async function loadUser() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  }

  async function load() {
    const [groupRes, postsRes] = await Promise.all([
      fetch(`/api/groups/${slug}`).then((r) => r.json()),
      fetch(`/api/posts?group=${slug}`).then((r) => r.json()),
    ]);
    setGroup(groupRes.group);
    setIsMember(groupRes.is_member);
    setPosts(postsRes.posts || []);
    setLoading(false);
  }

  useEffect(() => { loadUser(); load(); }, [slug]);

  async function toggleMembership() {
    setActing(true);
    await fetch(`/api/groups/${slug}/join`, { method: isMember ? 'DELETE' : 'POST' });
    await load();
    setActing(false);
  }

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!group) return <div className="p-6">Grupo não encontrado</div>;

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/community/groups" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-xl font-bold">{group.cover_emoji} {group.name}</h1>
      </header>

      <Card className="mb-4 p-4">
        {group.description && <p className="mb-3 text-sm">{group.description}</p>}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" /> {group.member_count} membros
          </span>
          <Button size="sm" variant={isMember ? 'outline' : 'default'} onClick={toggleMembership} disabled={acting}>
            {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : isMember ? 'Sair' : 'Entrar no grupo'}
          </Button>
        </div>
      </Card>

      {isMember && (
        <Button asChild className="mb-4 w-full">
          <Link href={`/app/community/new?group=${slug}`}><Plus className="mr-2 h-4 w-4" /> Postar no grupo</Link>
        </Button>
      )}

      {posts.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Nenhum post aqui ainda.{isMember ? ' Seja o primeiro!' : ''}
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
