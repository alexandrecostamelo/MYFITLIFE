'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Flag, Loader2, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const REASONS = [
  { value: 'spam', label: 'Spam ou propaganda' },
  { value: 'harassment', label: 'Assédio ou bullying' },
  { value: 'hate_speech', label: 'Discurso de ódio' },
  { value: 'nudity', label: 'Conteúdo sexual' },
  { value: 'violence', label: 'Violência ou ameaça' },
  { value: 'misinformation', label: 'Informação falsa' },
  { value: 'self_harm', label: 'Automutilação ou suicídio' },
  { value: 'dangerous_advice', label: 'Conselho perigoso' },
  { value: 'eating_disorder', label: 'Transtorno alimentar' },
  { value: 'other', label: 'Outro' },
];

interface Props {
  targetType: 'post' | 'comment';
  targetId: string;
}

export function ReportButton({ targetType, targetId }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!reason) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          reason,
          details: details || undefined,
        }),
      });
      if (res.ok) setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setDone(false);
          setReason('');
          setDetails('');
        }
      }}
    >
      <DialogTrigger asChild>
        <button className="flex w-full items-center gap-2 p-2 text-left text-sm hover:bg-slate-50">
          <Flag className="h-3 w-3" /> Denunciar
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reportar conteúdo</DialogTitle>
        </DialogHeader>
        {done ? (
          <div className="space-y-3 py-6 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
            <p className="text-sm">Denúncia enviada. Nossa equipe vai revisar.</p>
            <Button onClick={() => setOpen(false)}>Fechar</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Motivo *</Label>
              <div className="space-y-1">
                {REASONS.map((r) => (
                  <label
                    key={r.value}
                    className="flex cursor-pointer items-center gap-2 rounded p-2 text-sm hover:bg-muted"
                  >
                    <input
                      type="radio"
                      checked={reason === r.value}
                      onChange={() => setReason(r.value)}
                      className="accent-primary"
                    />
                    {r.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Detalhes (opcional)</Label>
              <Textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                maxLength={500}
              />
            </div>
            <Button onClick={submit} disabled={!reason || submitting} className="w-full">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar denúncia
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
