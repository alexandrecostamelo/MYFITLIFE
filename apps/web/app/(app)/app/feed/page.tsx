import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { FeedPageClient } from './feed-client';

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <main className="mx-auto max-w-xl px-4 py-4 pb-24">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Feed</h1>
        <p className="text-sm text-muted-foreground">Amigos e suas conquistas</p>
      </div>
      <FeedPageClient />
    </main>
  );
}
