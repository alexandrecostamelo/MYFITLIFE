'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface Props {
  onPosted: () => void;
}

export function NewPostForm({ onPosted }: Props) {
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);

  const submit = async () => {
    if (!content.trim()) return;
    setPosting(true);
    try {
      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        setContent('');
        onPosted();
      }
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-3 space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="O que você está treinando hoje?"
        rows={2}
        maxLength={1000}
        className="w-full resize-none bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{content.length}/1000</span>
        <Button onClick={submit} disabled={!content.trim() || posting} size="sm">
          {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Postar'}
        </Button>
      </div>
    </div>
  );
}
