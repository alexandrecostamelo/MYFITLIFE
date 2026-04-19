'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64Safe);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray.buffer as ArrayBuffer;
}

export function PushToggle() {
  const [status, setStatus] = useState<NotificationPermission | 'unknown'>('unknown');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setSupported(false);
      return;
    }
    setStatus(Notification.permission);

    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    });
  }, []);

  async function register() {
    if (typeof window === 'undefined') return;
    setLoading(true);

    try {
      let reg = await navigator.serviceWorker.getRegistration('/sw.js');
      if (!reg) reg = await navigator.serviceWorker.register('/sw.js');

      const perm = await Notification.requestPermission();
      setStatus(perm);
      if (perm !== 'granted') {
        setLoading(false);
        return;
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error('VAPID key not configured');

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });

      setSubscribed(true);
    } catch (err) {
      console.error('[register push]', err);
    }
    setLoading(false);
  }

  async function unregister() {
    setLoading(true);
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
    }
    setSubscribed(false);
    setLoading(false);
  }

  if (!supported) {
    return <p className="text-xs text-muted-foreground">Seu navegador não suporta push.</p>;
  }

  if (subscribed) {
    return (
      <Button variant="outline" size="sm" onClick={unregister} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><BellOff className="mr-2 h-4 w-4" /> Desativar push</>}
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={register} disabled={loading || status === 'denied'}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
        status === 'denied'
          ? 'Push bloqueado no navegador'
          : <><Bell className="mr-2 h-4 w-4" /> Ativar notificações</>
      )}
    </Button>
  );
}
