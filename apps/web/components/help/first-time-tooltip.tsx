'use client';

import { useState, useEffect } from 'react';
import { X, Lightbulb } from 'lucide-react';

type FirstTimeTooltipProps = {
  id: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
};

const STORAGE_PREFIX = 'mfl_tooltip_seen_';

export function FirstTimeTooltip({
  id,
  title,
  description,
  position = 'bottom',
  children,
}: FirstTimeTooltipProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const key = `${STORAGE_PREFIX}${id}`;
    const seen = localStorage.getItem(key);
    if (!seen) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, [id]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(`${STORAGE_PREFIX}${id}`, '1');

    // Fire-and-forget DB persistence
    fetch('/api/help/tooltip-seen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tooltip_id: id }),
    }).catch(() => {});
  };

  const positionClasses: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses: Record<string, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-accent/80',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-accent/80',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-accent/80',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-accent/80',
  };

  return (
    <div className="relative inline-block">
      {children}
      {visible && (
        <div
          className={`absolute z-[60] w-56 animate-in fade-in slide-in-from-bottom-1 duration-300 ${positionClasses[position]}`}
        >
          <div className="rounded-xl border border-accent/20 bg-[#0c0c14]/95 p-3 shadow-xl shadow-accent/10 backdrop-blur-xl">
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-accent" />
                <span className="text-xs font-semibold text-white">{title}</span>
              </div>
              <button
                onClick={dismiss}
                className="rounded-md p-0.5 text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/60"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <p className="text-[11px] leading-relaxed text-white/50">{description}</p>
            <button
              onClick={dismiss}
              className="mt-2 w-full rounded-lg bg-accent/10 py-1 text-[11px] font-medium text-accent transition-colors hover:bg-accent/20"
            >
              Entendi!
            </button>
          </div>
          {/* Arrow */}
          <div
            className={`absolute h-0 w-0 border-4 border-transparent ${arrowClasses[position]}`}
          />
        </div>
      )}
    </div>
  );
}
