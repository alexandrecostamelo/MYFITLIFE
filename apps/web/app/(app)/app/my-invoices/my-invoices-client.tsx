'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, FileText, Download } from 'lucide-react';
import Link from 'next/link';

interface Invoice {
  id: string;
  service_description: string;
  service_amount: number;
  status: string;
  nfse_number: string | null;
  pdf_url: string | null;
  issued_at: string | null;
  created_at: string;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function MyInvoicesClient({ invoices }: { invoices: Invoice[] }) {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/app">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Minhas Notas Fiscais</h1>
          <p className="text-sm text-muted-foreground">{invoices.length} nota(s)</p>
        </div>
      </div>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>Nenhuma nota fiscal disponível</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <Card key={inv.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {inv.nfse_number ? `NFSe Nº ${inv.nfse_number}` : 'NFSe'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {inv.issued_at ? formatDate(inv.issued_at) : formatDate(inv.created_at)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{inv.service_description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{formatCurrency(inv.service_amount)}</span>
                  {inv.pdf_url && (
                    <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-1">
                        <Download className="h-3 w-3" />
                        Baixar PDF
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
