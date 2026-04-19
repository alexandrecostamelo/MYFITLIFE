'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PostCard } from '@/components/post-card';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function PostDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');

  async function loadUser() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  }

  async function load() {
    const [feedRes, commentsRes] = await Promise.all([
      fetch(`/api/posts?feed=home`).then((r) => r.json()),
      fetch(`/api/posts/${id}/comments`).then((r) => r.json()),
    ]);
    const target = (feedRes.posts || []).find((p: any) => p.id === id);
    setPost(target || null);
    setComments(commentsRes.comments || []);
    setLoading(false);
  }

  useEffect(() => { loadUser(); load(); }, [id]);

  async function sendComment() {
    if (!newComment.trim()) return;
    setPosting(true);
    const res = await fetch(`/api/posts/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newComment }),
    });
    const data = await res.json();
    setPosting(false);
    if (data.moderation_status === 'flagged') {
      alert('Comentário sinalizado pela moderação e não foi publicado.');
      return;
    }
    setNewComment('');
    await load();
  }

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!post) return <div className="p-6 text-sm text-muted-foreground">Post não encontrado ou ainda em moderação.</div>;

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/community" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-xl font-bold">Post</h1>
      </header>

      <div className="mb-4">
        <PostCard post={post} currentUserId={userId} />
      </div>

      <h3 className="mb-2 text-sm font-medium text-muted-foreground">COMENTÁRIOS ({comments.length})</h3>

      <Card className="mb-4 p-3">
        <div className="flex gap-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escreva um comentário..."
            onKeyDown={(e) => e.key === 'Enter' && sendComment()}
            maxLength={500}
          />
          <Button onClick={sendComment} disabled={posting || !newComment.trim()}>
            {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar'}
          </Button>
        </div>
      </Card>

      <div className="space-y-2">
        {comments.map((c) => (
          <Card key={c.id} className="p-3">
            <div className="flex items-start gap-2">
              <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-slate-200">
                {c.author.avatar_url ? (
                  <img src={c.author.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                    {(c.author.full_name || '?').charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{c.author.full_name || 'Usuário'}</div>
                <p className="text-sm">{c.content}</p>
                <div className="mt-1 text-xs text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
