'use client';

import { useState } from 'react';

const EMOJIS = [
  { key: 'fire', label: '\uD83D\uDD25' },
  { key: 'muscle', label: '\uD83D\uDCAA' },
  { key: 'clap', label: '\uD83D\uDC4F' },
  { key: 'heart', label: '\u2764\uFE0F' },
  { key: 'angry', label: '\uD83D\uDE24' },
];

interface Props {
  postId: string;
  reactionsByEmoji: Record<string, number>;
  myReactions: string[];
  onReact: (emoji: string, nextState: 'added' | 'removed') => void;
}

export function ReactionBar({ postId, reactionsByEmoji, myReactions, onReact }: Props) {
  const [busy, setBusy] = useState<string | null>(null);

  const toggle = async (emoji: string) => {
    if (busy) return;
    setBusy(emoji);
    const wasSet = myReactions.includes(emoji);
    onReact(emoji, wasSet ? 'removed' : 'added');
    try {
      await fetch(`/api/feed/${postId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
    } catch {
      onReact(emoji, wasSet ? 'added' : 'removed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex gap-1 flex-wrap">
      {EMOJIS.map(({ key, label }) => {
        const count = reactionsByEmoji[key] || 0;
        const mine = myReactions.includes(key);
        return (
          <button
            key={key}
            onClick={() => toggle(key)}
            disabled={busy === key}
            className={`
              inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm transition-all
              ${mine
                ? 'bg-primary/15 border border-primary/40 text-primary'
                : 'bg-muted hover:bg-muted/70 border border-transparent'}
            `}
            aria-pressed={mine}
          >
            <span>{label}</span>
            {count > 0 && <span className="text-xs font-semibold">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
