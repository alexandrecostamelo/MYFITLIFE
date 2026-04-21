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
  Activity,
  Video,
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    label: 'Principal',
    items: [
      { href: '/app/admin', label: 'Dashboard', icon: LayoutDashboard, color: 'from-emerald-500 to-teal-600' },
      { href: '/app/admin/users', label: 'Usuários', icon: Users, color: 'from-blue-500 to-indigo-600' },
      { href: '/app/admin/subscriptions', label: 'Assinaturas', icon: CreditCard, color: 'from-violet-500 to-purple-600' },
      { href: '/app/admin/financial', label: 'Financeiro', icon: DollarSign, color: 'from-green-500 to-emerald-600' },
    ],
  },
  {
    label: 'Moderação',
    items: [
      { href: '/app/admin/reports', label: 'Denúncias', icon: FileText, color: 'from-orange-500 to-red-600' },
      { href: '/app/admin/moderation', label: 'Moderação IA', icon: Eye, color: 'from-pink-500 to-rose-600' },
      { href: '/app/admin/claims', label: 'Claims', icon: Building2, color: 'from-amber-500 to-orange-600' },
      { href: '/app/admin/professionals', label: 'Profissionais', icon: Shield, color: 'from-cyan-500 to-blue-600' },
    ],
  },
  {
    label: 'Conteúdo',
    items: [
      { href: '/app/admin/exercises', label: 'Exercícios', icon: Dumbbell, color: 'from-rose-500 to-pink-600' },
      { href: '/app/admin/challenges', label: 'Desafios', icon: Swords, color: 'from-amber-500 to-yellow-600' },
      { href: '/app/admin/transformations', label: 'Transformações', icon: BarChart3, color: 'from-teal-500 to-cyan-600' },
      { href: '/app/admin/groups', label: 'Grupos', icon: Users, color: 'from-indigo-500 to-violet-600' },
      { href: '/app/admin/videos', label: 'Vídeos', icon: Video, color: 'from-red-500 to-rose-600' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/app/admin/ai-metrics', label: 'IA Métricas', icon: Zap, color: 'from-yellow-500 to-amber-600' },
      { href: '/app/admin/rate-limits', label: 'Rate Limits', icon: Shield, color: 'from-slate-400 to-zinc-600' },
      { href: '/app/admin/ai-cache', label: 'IA Cache', icon: Activity, color: 'from-purple-500 to-indigo-600' },
      { href: '/app/admin/feature-flags', label: 'Feature Flags', icon: Flag, color: 'from-emerald-500 to-green-600' },
      { href: '/app/admin/monitoring', label: 'Monitoramento', icon: BarChart3, color: 'from-sky-500 to-blue-600' },
      { href: '/app/admin/logs', label: 'Logs', icon: ScrollText, color: 'from-zinc-400 to-slate-600' },
      { href: '/app/admin/retention', label: 'Retenção', icon: Crown, color: 'from-amber-400 to-yellow-600' },
      { href: '/app/admin/fiscal-report', label: 'Fiscal', icon: Receipt, color: 'from-lime-500 to-green-600' },
      { href: '/app/admin/premium-pool', label: 'Pool Premium', icon: Crown, color: 'from-amber-500 to-orange-600' },
      { href: '/app/admin/settings', label: 'Configurações', icon: Settings, color: 'from-gray-400 to-zinc-600' },
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
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col overflow-y-auto border-r border-white/[0.06] bg-gradient-to-b from-[#0a0a0f] to-[#0f0f18] pb-4">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-[#0a0a0f] via-[#0a0a0f] to-transparent px-5 pb-4 pt-5">
        <Link
          href="/app"
          className="group mb-3 flex items-center gap-2 text-xs text-white/40 transition-colors hover:text-white/80"
        >
          <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
          Voltar ao app
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-emerald-600 shadow-lg shadow-accent/20">
            <Activity className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white">Admin</h2>
            <p className="text-[10px] text-white/30">MyFitLife</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-5 px-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/25">
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
                    className={`group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-all duration-200 ${
                      active
                        ? 'bg-white/[0.08] text-white font-medium shadow-sm'
                        : 'text-white/45 hover:bg-white/[0.04] hover:text-white/75'
                    }`}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-accent to-emerald-400" />
                    )}
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-lg transition-all duration-200 ${
                        active
                          ? `bg-gradient-to-br ${item.color} shadow-sm`
                          : 'bg-white/[0.06] group-hover:bg-white/[0.1]'
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${active ? 'text-white' : 'text-white/50 group-hover:text-white/70'}`} />
                    </div>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="mx-3 mt-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
        <p className="text-[10px] font-medium text-white/30">MyFitLife v1.0</p>
        <p className="text-[10px] text-white/15">Platform Admin</p>
      </div>
    </aside>
  );
}
