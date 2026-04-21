'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  DollarSign,
  FileText,
  ScrollText,
  Settings,
  Shield,
  Zap,
  Flag,
  Dumbbell,
  Swords,
  Eye,
  BarChart3,
  Building2,
  Crown,
  Receipt,
  ArrowLeft,
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    label: 'Principal',
    items: [
      { href: '/app/admin', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/app/admin/users', label: 'Usuários', icon: Users },
      { href: '/app/admin/subscriptions', label: 'Assinaturas', icon: CreditCard },
      { href: '/app/admin/financial', label: 'Financeiro', icon: DollarSign },
    ],
  },
  {
    label: 'Moderação',
    items: [
      { href: '/app/admin/reports', label: 'Denúncias', icon: FileText },
      { href: '/app/admin/moderation', label: 'Moderação IA', icon: Eye },
      { href: '/app/admin/claims', label: 'Claims', icon: Building2 },
      { href: '/app/admin/professionals', label: 'Profissionais', icon: Shield },
    ],
  },
  {
    label: 'Conteúdo',
    items: [
      { href: '/app/admin/exercises', label: 'Exercícios', icon: Dumbbell },
      { href: '/app/admin/challenges', label: 'Desafios', icon: Swords },
      { href: '/app/admin/transformations', label: 'Transformações', icon: BarChart3 },
      { href: '/app/admin/groups', label: 'Grupos', icon: Users },
      { href: '/app/admin/videos', label: 'Vídeos', icon: Dumbbell },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/app/admin/ai-metrics', label: 'IA Métricas', icon: Zap },
      { href: '/app/admin/rate-limits', label: 'Rate Limits', icon: Shield },
      { href: '/app/admin/ai-cache', label: 'IA Cache', icon: Zap },
      { href: '/app/admin/feature-flags', label: 'Feature Flags', icon: Flag },
      { href: '/app/admin/monitoring', label: 'Monitoramento', icon: BarChart3 },
      { href: '/app/admin/logs', label: 'Logs', icon: ScrollText },
      { href: '/app/admin/retention', label: 'Retenção', icon: Crown },
      { href: '/app/admin/fiscal-report', label: 'Fiscal', icon: Receipt },
      { href: '/app/admin/premium-pool', label: 'Pool Premium', icon: Crown },
      { href: '/app/admin/settings', label: 'Configurações', icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/app/admin') return pathname === '/app/admin';
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-56 overflow-y-auto border-r border-white/10 bg-background/95 backdrop-blur-sm pb-6">
      <div className="px-4 py-4">
        <Link
          href="/app"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1"
        >
          <ArrowLeft className="h-3 w-3" />
          Voltar ao app
        </Link>
        <h2 className="text-sm font-bold tracking-tight">Admin</h2>
      </div>

      <nav className="space-y-4 px-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${
                      active
                        ? 'bg-accent/15 text-accent font-medium'
                        : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
