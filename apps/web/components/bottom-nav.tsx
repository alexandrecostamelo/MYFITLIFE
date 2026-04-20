'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Utensils, Dumbbell, User, Plus, X, Camera, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_LEFT = [
  { href: '/app', label: 'Início', icon: Home },
  { href: '/app/nutrition', label: 'Comida', icon: Utensils },
];

const NAV_RIGHT = [
  { href: '/app/workout', label: 'Treino', icon: Dumbbell },
  { href: '/app/profile', label: 'Perfil', icon: User },
];

const FAB_ACTIONS = [
  { href: '/app/workout/start', label: 'Iniciar Treino', icon: Dumbbell, angle: -120 },
  { href: '/app/nutrition/photo', label: 'Foto Prato', icon: Camera, angle: -90 },
  { href: '/app/coach', label: 'Chat Coach', icon: MessageCircle, angle: -60 },
];

const FAB_RADIUS = 80;

export function BottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb">
        <div className="relative mx-auto flex max-w-lg items-end justify-around px-2 pb-2">
          {/* Left nav items */}
          {NAV_LEFT.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== '/app' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] transition-colors',
                  active ? 'text-accent' : 'text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* FAB central */}
          <div className="relative flex flex-col items-center -mt-5">
            {/* Radial actions */}
            {FAB_ACTIONS.map((action, i) => {
              const rad = (action.angle * Math.PI) / 180;
              const x = Math.cos(rad) * FAB_RADIUS;
              const y = Math.sin(rad) * FAB_RADIUS;
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'absolute flex flex-col items-center gap-1 transition-all duration-300',
                    open
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 scale-50 pointer-events-none'
                  )}
                  style={{
                    transform: open
                      ? `translate(${x}px, ${y}px)`
                      : 'translate(0, 0)',
                    transitionDelay: open ? `${i * 50}ms` : '0ms',
                  }}
                >
                  <div className="h-11 w-11 rounded-full bg-accent flex items-center justify-center shadow-lg accent-glow">
                    <Icon className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <span className="text-[10px] text-foreground font-medium whitespace-nowrap">
                    {action.label}
                  </span>
                </Link>
              );
            })}

            {/* Central button */}
            <button
              onClick={() => setOpen(!open)}
              className={cn(
                'relative z-50 h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300',
                open
                  ? 'bg-muted rotate-45'
                  : 'bg-accent accent-glow'
              )}
            >
              {open ? (
                <X className="h-6 w-6 text-foreground -rotate-45" />
              ) : (
                <Plus className="h-7 w-7 text-accent-foreground" />
              )}
            </button>
          </div>

          {/* Right nav items */}
          {NAV_RIGHT.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== '/app' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] transition-colors',
                  active ? 'text-accent' : 'text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
