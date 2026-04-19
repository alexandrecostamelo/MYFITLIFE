'use client';

import { useTheme } from './theme-provider';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex rounded-md border border-input p-0.5">
      {(['light', 'system', 'dark'] as const).map((t) => {
        const Icon = t === 'light' ? Sun : t === 'dark' ? Moon : Monitor;
        return (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`flex h-7 w-7 items-center justify-center rounded ${theme === t ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            aria-label={t}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
