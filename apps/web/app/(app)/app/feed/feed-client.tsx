'use client';

import { useState } from 'react';
import { NewPostForm } from '@/components/feed/NewPostForm';
import { FeedList } from '@/components/feed/FeedList';

export function FeedPageClient() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-4">
      <NewPostForm onPosted={() => setRefreshKey((k) => k + 1)} />
      <FeedList key={refreshKey} />
    </div>
  );
}
