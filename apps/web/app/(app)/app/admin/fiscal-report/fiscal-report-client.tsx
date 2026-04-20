'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Props {
  byStatus: Record<string, { count: number; total: number }>;
  totalIssuedYear: number;
}

const STATUS_LABELS: Record<string, string> = {
  issued: 'Emitida',
  pending: 'Pendente',
  processing: 'Processando',
  error: 'Erro',
};

function fmt(v: number) {
  return `R$ ${v.toFixed(2).replace('.', ',')}`;
}

export default function FiscalReportClient({ byStatus, totalIssuedYear }: Props) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  async function download() {
    const res = await fetch(`/api/admin/nfse-report?month=${month}`);
    if (!res.ok) { alert('Erro ao gerar relatório'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nfse-myfitlife-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/app/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Relatório Fiscal</h1>
          <p className="text-sm text-muted-foreground">NFSe das assinaturas MyFitLife</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Total faturado no ano</p>
          <p className="text-3xl font-bold">{fmt(totalIssuedYear)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status das notas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(byStatus).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma nota emitida ainda</p>
          ) : (
            Object.entries(byStatus).map(([status, s]) => (
              <div key={status} className="flex justify-between text-sm">
                <span>{STATUS_LABELS[status] || status}</span>
                <span className="text-muted-foreground">
                  {s.count} nota{s.count !== 1 ? 's' : ''} · {fmt(s.total)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Baixar relatório mensal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">CSV para o contador (UTF-8, separador ;)</p>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <Button onClick={download} className="w-full">
            <Download className="h-4 w-4 mr-2" /> Baixar CSV de {month}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
