'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, FileText, Download, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface Invoice {
  id: string;
  reference: string;
  client_name: string;
  service_description: string;
  service_amount: number;
  tax_amount: number;
  net_amount: number;
  status: string;
  nfse_number: string | null;
  pdf_url: string | null;
  issued_at: string | null;
  created_at: string;
  error_message: string | null;
}

const STATUS_MAP: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending: { label: 'Pendente', icon: <Clock className="h-4 w-4" />, color: 'text-yellow-600' },
  processing: { label: 'Processando', icon: <Clock className="h-4 w-4 animate-spin" />, color: 'text-blue-600' },
  issued: { label: 'Emitida', icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-green-600' },
  error: { label: 'Erro', icon: <AlertCircle className="h-4 w-4" />, color: 'text-destructive' },
};

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

export default function InvoicesClient({ invoices }: { invoices: Invoice[] }) {
  const statusInfo = (status: string) => STATUS_MAP[status] || STATUS_MAP.pending;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/app/professional">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Notas Fiscais (NFSe)</h1>
          <p className="text-sm text-muted-foreground">{invoices.length} nota(s) encontrada(s)</p>
        </div>
      </div>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>Nenhuma nota fiscal emitida ainda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const info = statusInfo(inv.status);
            return (
              <Card key={inv.id}>
                <CardContent className="py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={info.color}>{info.icon}</span>
                      <span className={`text-sm font-medium ${info.color}`}>{info.label}</span>
                      {inv.nfse_number && (
                        <span className="text-xs text-muted-foreground">
                          Nº {inv.nfse_number}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(inv.created_at)}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-medium">{inv.client_name}</p>
                    <p className="text-xs text-muted-foreground">{inv.service_description}</p>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="space-x-3">
                      <span>Valor: {formatCurrency(inv.service_amount)}</span>
                      <span className="text-muted-foreground">ISS: {formatCurrency(inv.tax_amount)}</span>
                    </div>
                    <span className="font-medium">Líquido: {formatCurrency(inv.net_amount)}</span>
                  </div>

                  {inv.error_message && (
                    <p className="text-xs text-destructive">{inv.error_message}</p>
                  )}

                  {inv.pdf_url && (
                    <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-1">
                        <Download className="h-3 w-3" />
                        PDF
                      </Button>
                    </a>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
