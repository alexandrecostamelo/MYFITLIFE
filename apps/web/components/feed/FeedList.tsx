'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { FeedPostCard, type FeedPost } from './FeedPostCard';

const TYPE_FILTERS = [
  { value: 'all', label: 'Tudo' },
  { value: 'manual', label: 'Posts' },
  { value: 'workout_completed', label: 'Treinos' },
  { value: 'personal_record', label: 'PRs' },
  { value: 'achievement_unlocked', label: 'Conquistas' },
  { value: 'streak_milestone', label: 'Streaks' },
];

export function FeedList() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [filter, setFilter] = useState('all');
  const [initialLoad, setInitialLoad] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(
    async (reset = false) => {
      if (loading) return;
      if (done && !reset) return;
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (!reset && cursor) params.set('cursor', cursor);
        if (filter !== 'all') params.set('type', filter);
        params.set('limit', '10');
        const res = await fetch(`/api/feed?${params}`);
        const data = await res.json();
        if (reset) {
          setPosts(data.posts || []);
        } else {
          setPosts((prev) => [...prev, ...(data.posts || [])]);
        }
        setCursor(data.next_cursor);
        setDone(!data.next_cursor);
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    },
    [loading, done, cursor, filter]
  );

  // Reset on filter change
  useEffect(() => {
    setPosts([]);
    setCursor(null);
    setDone(false);
    setInitialLoad(true);
  }, [filter]);

  // Load on mount / filter change
  useEffect(() => {
    if (initialLoad) {
      loadMore(true);
    }
  }, [initialLoad]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading && !done) loadMore();
    }, { rootMargin: '200px' });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [loadMore, loading, done]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sticky top-0 bg-background/80 backdrop-blur z-10 py-2">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`
              px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors
              ${filter === f.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/70'}
            `}
          >
            {f.label}
          </button>
        ))}
      </div>

      {posts.length === 0 && !loading && (
        <p className="text-center text-sm text-muted-foreground py-8">
          Nada por aqui ainda. Seja o primeiro a postar!
        </p>
      )}

      {posts.map((p) => (
        <FeedPostCard key={p.id} post={p} />
      ))}

      <div ref={sentinelRef} className="h-10 flex items-center justify-center">
        {loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        {done && posts.length > 0 && (
          <p className="text-xs text-muted-foreground">Fim do feed</p>
        )}
      </div>
    </div>
  );
}
