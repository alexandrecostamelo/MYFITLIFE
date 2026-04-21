'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MorningCheckin } from '@/components/morning-checkin';
import { CheckCircle } from 'lucide-react';

export default function CheckinPage() {
  const router = useRouter();
  const [done, setDone] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/checkin')
      .then((r) => r.json())
      .then((d) => setDone(!!d.checkin));
  }, []);

  if (done === null) return null;

  if (done) {
    return (
      <main className="mx-auto max-w-md p-4 pt-8 text-center">
        <CheckCircle className="mx-auto mb-3 h-12 w-12 text-accent" />
        <h1 className="mb-1 text-lg font-bold">Check-in feito!</h1>
        <p className="mb-4 text-sm text-muted-foreground">Você já fez seu check-in matinal hoje.</p>
        <button onClick={() => router.push('/app')} className="text-sm text-accent underline">
          Voltar ao início
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-4 text-lg font-bold">Check-in matinal</h1>
      <MorningCheckin onDone={() => router.push('/app')} />
    </main>
  );
}
