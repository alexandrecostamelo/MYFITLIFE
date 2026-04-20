'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Send } from 'lucide-react';

interface Comment {
  id: string;
  post_id: string;
  parent_comment_id: string | null;
  content: string;
  created_at: string;
  author: { id: string; username: string; full_name: string; avatar_url: string | null } | null;
}

export function CommentList({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/feed/${postId}/comments`);
      const data = await res.json();
      setComments(data.comments || []);
      setLoading(false);
    })();
  }, [postId]);

  const roots = comments.filter((c) => !c.parent_comment_id);
  const replies = comments.filter((c) => c.parent_comment_id);

  const submit = async () => {
    if (!text.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/feed/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, parent_comment_id: replyTo }),
      });
      const data = await res.json();
      if (data.comment) {
        setComments((prev) => [...prev, data.comment]);
        setText('');
        setReplyTo(null);
      }
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-3 border-t pt-3 mt-3">
      {loading && <Loader2 className="h-4 w-4 animate-spin mx-auto" />}

      {!loading && roots.map((c) => (
        <div key={c.id} className="space-y-2">
          <CommentItem comment={c} onReply={() => setReplyTo(c.id)} />
          <div className="ml-8 space-y-2">
            {replies.filter((r) => r.parent_comment_id === c.id).map((r) => (
              <CommentItem key={r.id} comment={r} onReply={() => setReplyTo(c.id)} />
            ))}
          </div>
        </div>
      ))}

      <div className="flex gap-2 items-end pt-2">
        <div className="flex-1 space-y-1">
          {replyTo && (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              Respondendo... <button onClick={() => setReplyTo(null)} className="underline">cancelar</button>
            </div>
          )}
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Comentar..."
            maxLength={500}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
          />
        </div>
        <Button onClick={submit} disabled={!text.trim() || posting} size="icon" className="flex-shrink-0">
          {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

function CommentItem({ comment, onReply }: { comment: Comment; onReply: () => void }) {
  const authorArr = comment.author as any;
  const author = Array.isArray(authorArr) ? authorArr[0] : authorArr;

  return (
    <div className="flex items-start gap-2">
      {author?.avatar_url ? (
        <img src={author.avatar_url} className="h-7 w-7 rounded-full object-cover" alt="" />
      ) : (
        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
          {author?.full_name?.[0]?.toUpperCase() || '?'}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="bg-muted/50 rounded-lg px-3 py-2 text-sm">
          <span className="font-semibold">{author?.full_name || 'Usuário'}</span>{' '}
          <span>{comment.content}</span>
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5 pl-2 flex items-center gap-3">
          <span>{formatDistanceToNow(new Date(comment.created_at), { locale: ptBR, addSuffix: true })}</span>
          <button onClick={onReply} className="hover:underline font-medium">Responder</button>
        </div>
      </div>
    </div>
  );
}
