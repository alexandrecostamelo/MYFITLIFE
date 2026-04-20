'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PostCard } from '@/components/post-card';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Loader2, Users, Send } from 'lucide-react';

export default function GroupDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [group, setGroup] = useState<any>(null);
  const [isMember, setIsMember] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [userId, setUserId] = useState('');
  const [acting, setActing] = useState(false);
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    })();
  }, []);

  const loadGroup = useCallback(async () => {
    const res = await fetch(`/api/groups/${slug}`);
    const data = await res.json();
    setGroup(data.group);
    setIsMember(data.is_member);
  }, [slug]);

  const loadPosts = useCallback(async (before?: string) => {
    const params = new URLSearchParams();
    if (before) params.set('before', before);
    const res = await fetch(`/api/groups/${slug}/posts?${params}`);
    const data = await res.json();
    const newPosts = data.posts || [];
    if (newPosts.length < 20) setHasMore(false);
    return newPosts;
  }, [slug]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadGroup();
      const initial = await loadPosts();
      setPosts(initial);
      setLoading(false);
    })();
  }, [loadGroup, loadPosts]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && posts.length > 0 && hasMore && !loadingMore) {
          setLoadingMore(true);
          const lastDate = posts[posts.length - 1]?.created_at;
          loadPosts(lastDate).then((more) => {
            setPosts((prev) => [...prev, ...more]);
            setLoadingMore(false);
          });
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [posts, hasMore, loadingMore, loadPosts]);

  async function toggleMembership() {
    setActing(true);
    await fetch(`/api/groups/${slug}/join`, { method: isMember ? 'DELETE' : 'POST' });
    await loadGroup();
    setActing(false);
  }

  async function submitPost() {
    if (!content.trim()) return;
    setPosting(true);
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, group_id: group.id }),
    });
    if (res.ok) {
      setContent('');
      const fresh = await loadPosts();
      setPosts(fresh);
      setHasMore(true);
    }
    setPosting(false);
  }

  async function refresh() {
    const fresh = await loadPosts();
    setPosts(fresh);
    setHasMore(true);
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!group) {
    return (
      <main className="mx-auto max-w-2xl p-4">
        <Link href="/app/community/groups" className="text-sm text-primary">
          &larr; Voltar
        </Link>
        <p className="mt-4 text-muted-foreground">Grupo não encontrado</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/community/groups" className="rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">
          {group.cover_emoji} {group.name}
        </h1>
      </header>

      <Card className="mb-4 p-4">
        {group.description && <p className="mb-3 text-sm">{group.description}</p>}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" /> {group.member_count} membros
          </span>
          <Button
            size="sm"
            variant={isMember ? 'outline' : 'default'}
            onClick={toggleMembership}
            disabled={acting}
          >
            {acting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isMember ? (
              'Sair do grupo'
            ) : (
              'Entrar no grupo'
            )}
          </Button>
        </div>
      </Card>

      {/* Compose */}
      {isMember && (
        <Card className="mb-4 p-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Compartilhe algo com o grupo..."
            rows={2}
            maxLength={2000}
            className="w-full resize-none bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{content.length}/2000</span>
            <Button
              size="sm"
              onClick={submitPost}
              disabled={!content.trim() || posting}
            >
              {posting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="mr-1 h-3 w-3" /> Postar
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Nenhum post aqui ainda.{isMember ? ' Seja o primeiro!' : ''}
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} currentUserId={userId} onDelete={refresh} />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />
      {loadingMore && (
        <div className="py-4 text-center">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        </div>
      )}
    </main>
  );
}
