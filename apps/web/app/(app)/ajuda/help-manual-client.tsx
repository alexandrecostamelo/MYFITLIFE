'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Dumbbell,
  UtensilsCrossed,
  Brain,
  Trophy,
  Users,
  Settings,
  Heart,
  Loader2,
  ArrowLeft,
  ChevronRight,
  BookOpen,
  Sparkles,
  Target,
  Camera,
} from 'lucide-react';

type Article = {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  order_index: number;
};

const CATEGORY_META: Record<string, { label: string; icon: typeof Dumbbell; color: string }> = {
  treino: { label: 'Treino', icon: Dumbbell, color: 'from-blue-500 to-indigo-600' },
  nutricao: { label: 'Nutrição', icon: UtensilsCrossed, color: 'from-green-500 to-emerald-600' },
  ia: { label: 'Inteligência Artificial', icon: Brain, color: 'from-violet-500 to-purple-600' },
  gamificacao: { label: 'Gamificação', icon: Trophy, color: 'from-amber-500 to-orange-600' },
  social: { label: 'Social', icon: Users, color: 'from-pink-500 to-rose-600' },
  conta: { label: 'Conta & Config', icon: Settings, color: 'from-slate-400 to-zinc-600' },
  saude: { label: 'Saúde', icon: Heart, color: 'from-red-500 to-rose-600' },
  progresso: { label: 'Progresso', icon: Target, color: 'from-cyan-500 to-teal-600' },
};

export function HelpManualClient() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    fetch('/api/help/articles')
      .then((r) => r.json())
      .then((data) => setArticles(data.articles || []))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(articles.map((a) => a.category));
    return Array.from(cats).sort();
  }, [articles]);

  const filtered = useMemo(() => {
    let list = articles;
    if (selectedCategory) list = list.filter((a) => a.category === selectedCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q),
      );
    }
    return list.sort((a, b) => a.order_index - b.order_index);
  }, [articles, selectedCategory, search]);

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-sm text-white/30">Carregando central de ajuda...</p>
        </div>
      </main>
    );
  }

  // Article detail view
  if (selectedArticle) {
    const cat = CATEGORY_META[selectedArticle.category];
    return (
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6 pb-28">
        <button
          onClick={() => setSelectedArticle(null)}
          className="group flex items-center gap-1.5 text-xs text-white/40 transition-colors hover:text-white/70"
        >
          <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
          Voltar aos artigos
        </button>

        <div>
          {cat && (
            <span
              className={`mb-2 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r ${cat.color} px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white`}
            >
              <cat.icon className="h-3 w-3" />
              {cat.label}
            </span>
          )}
          <h1 className="mt-2 text-xl font-bold tracking-tight text-white">{selectedArticle.title}</h1>
          <p className="mt-1 text-sm text-white/40">{selectedArticle.summary}</p>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <div className="prose-sm prose-invert max-w-none text-sm leading-relaxed text-white/70">
            {selectedArticle.content.split('\n').map((line, i) => {
              if (line.startsWith('## ')) {
                return (
                  <h2 key={i} className="mb-2 mt-6 text-base font-semibold text-white/90">
                    {line.slice(3)}
                  </h2>
                );
              }
              if (line.startsWith('- ')) {
                return (
                  <li key={i} className="ml-4 list-disc text-white/60">
                    {line.slice(2)}
                  </li>
                );
              }
              if (line.trim() === '') return <br key={i} />;
              return (
                <p key={i} className="mb-2">
                  {line}
                </p>
              );
            })}
          </div>
        </div>
      </main>
    );
  }

  // Main help page
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-28">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-emerald-600 shadow-lg shadow-accent/20">
          <BookOpen className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Central de Ajuda</h1>
        <p className="mt-1 text-sm text-white/35">Tudo que você precisa saber sobre o MyFitLife</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar artigos..."
          className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/25 focus:border-accent/30 focus:outline-none"
        />
      </div>

      {/* Categories */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {categories.map((cat) => {
          const meta = CATEGORY_META[cat] || { label: cat, icon: Sparkles, color: 'from-gray-500 to-zinc-600' };
          const Icon = meta.icon;
          const active = selectedCategory === cat;
          const count = articles.filter((a) => a.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(active ? null : cat)}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all ${
                active
                  ? 'border-accent/30 bg-accent/5 shadow-lg shadow-accent/10'
                  : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
              }`}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${meta.color} shadow-sm`}
              >
                <Icon className="h-4 w-4 text-white" />
              </div>
              <span className="text-xs font-medium text-white/70">{meta.label}</span>
              <span className="text-[10px] text-white/25">{count} artigos</span>
            </button>
          );
        })}
      </div>

      {/* Articles List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
            <Camera className="mx-auto mb-2 h-8 w-8 text-white/10" />
            <p className="text-sm text-white/30">Nenhum artigo encontrado</p>
          </div>
        ) : (
          filtered.map((article) => {
            const cat = CATEGORY_META[article.category];
            return (
              <button
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="group flex w-full items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-left transition-all hover:bg-white/[0.04] hover:border-white/[0.1]"
              >
                {cat && (
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${cat.color}`}
                  >
                    <cat.icon className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/80 group-hover:text-white">{article.title}</p>
                  <p className="mt-0.5 truncate text-xs text-white/30">{article.summary}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-white/15 transition-transform group-hover:translate-x-0.5 group-hover:text-white/30" />
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-r from-accent/5 to-emerald-600/5 p-4 text-center">
        <p className="text-xs text-white/40">
          Não encontrou o que procura? Use o{' '}
          <span className="font-medium text-accent">assistente IA</span> no botão flutuante
          ou entre em contato pelo{' '}
          <Link href="/suporte" className="font-medium text-accent hover:underline">
            suporte
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
