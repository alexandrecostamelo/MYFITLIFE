'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Utensils, Dumbbell, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/app', label: 'Início', icon: Home },
  { href: '/app/nutrition', label: 'Comida', icon: Utensils },
  { href: '/app/workout', label: 'Treino', icon: Dumbbell },
  { href: '/app/coach', label: 'Coach', icon: MessageCircle },
  { href: '/app/profile', label: 'Perfil', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white">
      <div className="mx-auto flex max-w-2xl items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== '/app' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
