'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="bg-background text-foreground">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Algo deu errado</h1>
            <p className="text-muted-foreground">
              O erro j\u00e1 foi reportado automaticamente.
            </p>
            <button
              onClick={reset}
              className="rounded-lg bg-accent px-6 py-2 text-accent-foreground font-medium"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
