'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Heart, MessageCircle, MoreVertical, Trash2, UserX, AlertTriangle } from 'lucide-react';
import { ReportButton } from '@/components/feed/ReportButton';

type Post = {
  id: string;
  content: string;
  photo_url: string | null;
  likes_count: number;
  comments_count: number;
  liked_by_me: boolean;
  created_at: string;
  author: { id?: string; full_name: string | null; username: string | null; avatar_url: string | null };
  group: { slug: string; name: string; cover_emoji: string } | null;
  author_id: string;
  moderation_status?: string;
};

export function PostCard({ post, currentUserId, onDelete }: { post: Post; currentUserId: string; onDelete?: () => void }) {
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [menuOpen, setMenuOpen] = useState(false);

  async function toggleLike() {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount(newLiked ? likesCount + 1 : likesCount - 1);
    await fetch(`/api/posts/${post.id}/like`, { method: newLiked ? 'POST' : 'DELETE' });
  }

  async function block() {
    setMenuOpen(false);
    if (!confirm(`Bloquear ${post.author.full_name || 'este usuário'}? Você não verá mais conteúdo dele(a).`)) return;
    await fetch('/api/blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocked_id: post.author_id }),
    });
    alert('Usuário bloqueado.');
    if (onDelete) onDelete();
  }

  async function deletePost() {
    setMenuOpen(false);
    if (!confirm('Excluir este post?')) return;
    await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
    if (onDelete) onDelete();
  }

  const isOwn = post.author_id === currentUserId;

  return (
    <Card className="p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 overflow-hidden rounded-full bg-slate-200">
            {post.author.avatar_url ? (
              <img src={post.author.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                {(post.author.full_name || '?').charAt(0)}
              </div>
            )}
          </div>
          <div>
            <div className="text-sm font-medium">{post.author.full_name || 'Usuário'}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {post.author.username && <span>@{post.author.username}</span>}
              {post.group && (
                <Link href={`/app/community/groups/${post.group.slug}`} className="flex items-center gap-0.5 text-primary">
                  {post.author.username ? ' · ' : ''}{post.group.cover_emoji} {post.group.name}
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="rounded p-1 hover:bg-slate-100">
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-7 z-20 min-w-[140px] rounded-md border bg-white shadow-md">
                {isOwn ? (
                  <button onClick={deletePost} className="flex w-full items-center gap-2 p-2 text-left text-sm text-red-600 hover:bg-slate-50">
                    <Trash2 className="h-3 w-3" /> Excluir
                  </button>
                ) : (
                  <>
                    <ReportButton targetType="post" targetId={post.id} />
                    <button onClick={block} className="flex w-full items-center gap-2 p-2 text-left text-sm text-red-600 hover:bg-slate-50">
                      <UserX className="h-3 w-3" /> Bloquear
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {post.moderation_status === 'pending_review' && isOwn && (
        <div className="mb-2 flex items-start gap-2 rounded border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          Este post está em revisão e só você pode vê-lo até ser aprovado.
        </div>
      )}

      <p className="mb-3 whitespace-pre-wrap text-sm">{post.content}</p>

      {post.photo_url && (
        <div className="mb-3 overflow-hidden rounded-lg">
          <img src={post.photo_url} alt="" className="w-full object-cover" />
        </div>
      )}

      <div className="flex items-center gap-4 text-sm">
        <button onClick={toggleLike} className="flex items-center gap-1">
          <Heart className={`h-5 w-5 ${liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
          <span>{likesCount}</span>
        </button>
        <Link href={`/app/community/post/${post.id}`} className="flex items-center gap-1 text-muted-foreground">
          <MessageCircle className="h-5 w-5" />
          <span>{post.comments_count}</span>
        </Link>
        <span className="ml-auto text-xs text-muted-foreground">
          {new Date(post.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </span>
      </div>
    </Card>
  );
}
