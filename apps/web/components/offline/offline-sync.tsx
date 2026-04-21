'use client';

import { useEffect, useState } from 'react';
import { flushQueue, getQueue } from '@/lib/offline/queue';

export function OfflineSync() {
  const [pending, setPending] = useState(0);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const check = () => setPending(getQueue().length);
    check();
    setOnline(navigator.onLine);

    const handleOnline = async () => {
      setOnline(true);
      const result = await flushQueue();
      check();
      if (result.synced > 0) {
        console.log(
          `[offline-sync] ${result.synced} ação(ões) sincronizada(s)`,
        );
      }
    };

    const handleOffline = () => {
      setOnline(false);
      check();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', check);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', check);
    };
  }, []);

  if (pending === 0 && online) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/90 text-black text-center py-1 text-xs font-medium">
      {online
        ? `Sincronizando ${pending} ação(ões)...`
        : `Offline — ${pending} ação(ões) pendente(s)`}
    </div>
  );
}
