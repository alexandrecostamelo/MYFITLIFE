'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageSquare, Share2 } from 'lucide-react';
import { ReactionBar } from './ReactionBar';
import { PostContent } from './PostContent';
import { CommentList } from './CommentList';

interface Author {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export interface FeedPost {
  id: string;
  user_id: string;
  type: string;
  content: string | null;
  image_url: string | null;
  metadata: Record<string, any>;
  is_milestone: boolean;
  reaction_count: number;
  comment_count: number;
  created_at: string;
  author: Author | Author[] | null;
  reactions_by_emoji: Record<string, number>;
  my_reactions: string[];
}

export function FeedPostCard({ post: initial }: { post: FeedPost }) {
  const [post, setPost] = useState(initial);
  const [showComments, setShowComments] = useState(false);

  const author = Array.isArray(post.author) ? post.author[0] : post.author;

  const handleReact = (emoji: string, nextState: 'added' | 'removed') => {
    setPost((prev) => {
      const byEmoji = { ...prev.reactions_by_emoji };
      const my = [...prev.my_reactions];
      if (nextState === 'added') {
        byEmoji[emoji] = (byEmoji[emoji] || 0) + 1;
        if (!my.includes(emoji)) my.push(emoji);
      } else {
        byEmoji[emoji] = Math.max(0, (byEmoji[emoji] || 0) - 1);
        if (byEmoji[emoji] === 0) delete byEmoji[emoji];
        const idx = my.indexOf(emoji);
        if (idx >= 0) my.splice(idx, 1);
      }
      return {
        ...prev,
        reactions_by_emoji: byEmoji,
        my_reactions: my,
        reaction_count: prev.reaction_count + (nextState === 'added' ? 1 : -1),
      };
    });
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/app/feed?post=${post.id}`;
    const text = post.content || 'Confere isso no MyFitLife';
    if (navigator.share) {
      try {
        await navigator.share({ title: 'MyFitLife', text, url });
      } catch { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  return (
    <article className={`
      rounded-xl border bg-card p-4 space-y-3
      ${post.is_milestone ? 'ring-2 ring-amber-500/30' : ''}
    `}>
      <header className="flex items-start gap-3">
        {author?.avatar_url ? (
          <img src={author.avatar_url} className="h-10 w-10 rounded-full object-cover" alt="" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold">
            {author?.full_name?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{author?.full_name || 'Usuário'}</p>
          <p className="text-xs text-muted-foreground">
            @{author?.username || 'user'} · {formatDistanceToNow(new Date(post.created_at), { locale: ptBR, addSuffix: true })}
          </p>
        </div>
      </header>

      <PostContent
        type={post.type}
        content={post.content}
        metadata={post.metadata}
        isMilestone={post.is_milestone}
      />

      {post.image_url && (
        <img src={post.image_url} alt="" className="w-full rounded-lg object-cover max-h-96" />
      )}

      <div className="flex items-center justify-between gap-2">
        <ReactionBar
          postId={post.id}
          reactionsByEmoji={post.reactions_by_emoji}
          myReactions={post.my_reactions}
          onReact={handleReact}
        />
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setShowComments((v) => !v)} className="gap-1.5 text-xs">
            <MessageSquare className="h-3.5 w-3.5" />
            {post.comment_count}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showComments && <CommentList postId={post.id} />}
    </article>
  );
}
