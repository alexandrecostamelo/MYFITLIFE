'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhotoCapture } from '@/components/photo-capture';
import { ArrowLeft, Plus, Trash2, Loader2, X } from 'lucide-react';

type Photo = {
  id: string; photo_path: string; pose: 'front' | 'back' | 'side_left' | 'side_right';
  weight_kg: number | null; body_fat_percent: number | null; notes: string | null;
  taken_at: string; signed_url: string | null;
};

const POSE_LABELS: Record<string, string> = { front: 'Frente', back: 'Costas', side_left: 'Lateral esq.', side_right: 'Lateral dir.' };

export default function ProgressPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pose, setPose] = useState<Photo['pose']>('front');
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [preview, setPreview] = useState<Photo | null>(null);

  async function load() {
    const res = await fetch('/api/progress-photos');
    const data = await res.json();
    setPhotos(data.photos || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!file) return;
    setSaving(true);
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('pose', pose);
    if (weight) formData.append('weight_kg', weight);
    if (bodyFat) formData.append('body_fat_percent', bodyFat);
    if (notes) formData.append('notes', notes);
    await fetch('/api/progress-photos', { method: 'POST', body: formData });
    setShowForm(false); setFile(null); setWeight(''); setBodyFat(''); setNotes('');
    await load(); setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm('Excluir esta foto?')) return;
    await fetch(`/api/progress-photos/${id}`, { method: 'DELETE' });
    await load();
  }

  function toggleCompare(id: string) {
    if (selectedForCompare.includes(id)) setSelectedForCompare(selectedForCompare.filter((x) => x !== id));
    else if (selectedForCompare.length < 2) setSelectedForCompare([...selectedForCompare, id]);
  }

  const byPose: Record<string, Photo[]> = { front: [], back: [], side_left: [], side_right: [] };
  photos.forEach((p) => { byPose[p.pose]?.push(p); });

  const compareA = photos.find((p) => p.id === selectedForCompare[0]);
  const compareB = photos.find((p) => p.id === selectedForCompare[1]);

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Fotos de progresso</h1>
      </header>

      {!showForm && !compareMode && (
        <div className="mb-4 grid grid-cols-2 gap-2">
          <Button onClick={() => setShowForm(true)}><Plus className="mr-2 h-4 w-4" /> Nova foto</Button>
          <Button variant="outline" onClick={() => { setCompareMode(true); setSelectedForCompare([]); }} disabled={photos.length < 2}>Comparar</Button>
        </div>
      )}

      {showForm && (
        <Card className="mb-4 space-y-3 p-4">
          <div>
            <Label>Pose</Label>
            <select value={pose} onChange={(e) => setPose(e.target.value as Photo['pose'])} className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm">
              <option value="front">Frente</option><option value="back">Costas</option>
              <option value="side_left">Lateral esquerda</option><option value="side_right">Lateral direita</option>
            </select>
          </div>
          <PhotoCapture onPhotoSelected={setFile} disabled={saving} />
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Peso (kg)</Label><Input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} /></div>
            <div><Label>% gordura</Label><Input type="number" step="0.1" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} /></div>
          </div>
          <div><Label>Notas</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: 30 dias de programa" /></div>
          <p className="text-xs text-muted-foreground">Dica: mesmo horário, mesma luz, mesma distância.</p>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving || !file} className="flex-1">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}</Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setFile(null); }}>Cancelar</Button>
          </div>
        </Card>
      )}

      {compareMode && (
        <Card className="mb-4 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium">Comparar 2 fotos</h2>
            <Button variant="ghost" size="icon" onClick={() => { setCompareMode(false); setSelectedForCompare([]); }}><X className="h-4 w-4" /></Button>
          </div>
          {selectedForCompare.length < 2 ? (
            <p className="text-xs text-muted-foreground">Selecione 2 fotos abaixo ({selectedForCompare.length}/2)</p>
          ) : compareA && compareB && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">{new Date(compareA.taken_at).toLocaleDateString('pt-BR')}{compareA.weight_kg && ` · ${compareA.weight_kg} kg`}</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {compareA.signed_url && <img src={compareA.signed_url} className="w-full rounded" alt="antes" />}
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">{new Date(compareB.taken_at).toLocaleDateString('pt-BR')}{compareB.weight_kg && ` · ${compareB.weight_kg} kg`}</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {compareB.signed_url && <img src={compareB.signed_url} className="w-full rounded" alt="depois" />}
              </div>
            </div>
          )}
        </Card>
      )}

      {loading ? <div className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      : photos.length === 0 ? <Card className="p-6 text-center text-sm text-muted-foreground">Nenhuma foto ainda.</Card>
      : (
        <div className="space-y-4">
          {(['front', 'back', 'side_left', 'side_right'] as const).map((p) =>
            byPose[p].length > 0 ? (
              <div key={p}>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">{POSE_LABELS[p]}</h3>
                <div className="grid grid-cols-3 gap-2">
                  {byPose[p].map((photo) => (
                    <div key={photo.id} className={`relative overflow-hidden rounded border ${compareMode && selectedForCompare.includes(photo.id) ? 'ring-2 ring-primary' : ''}`}>
                      <button onClick={() => compareMode ? toggleCompare(photo.id) : setPreview(photo)} className="block w-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {photo.signed_url ? <img src={photo.signed_url} alt="progresso" className="aspect-[3/4] w-full object-cover" /> : <div className="aspect-[3/4] w-full bg-slate-200" />}
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <div className="text-xs text-white">{new Date(photo.taken_at).toLocaleDateString('pt-BR')}{photo.weight_kg && <><br />{photo.weight_kg} kg</>}</div>
                      </div>
                      {!compareMode && (
                        <button onClick={(e) => { e.stopPropagation(); remove(photo.id); }} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setPreview(null)}>
          <div className="relative max-h-[90vh] max-w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {preview.signed_url && <img src={preview.signed_url} alt="preview" className="max-h-[90vh] rounded" />}
            <button onClick={() => setPreview(null)} className="absolute right-2 top-2 rounded-full bg-black/60 p-2 text-white"><X className="h-5 w-5" /></button>
            <div className="absolute bottom-2 left-2 rounded bg-black/60 p-2 text-xs text-white">
              {new Date(preview.taken_at).toLocaleDateString('pt-BR')}{preview.weight_kg && ` · ${preview.weight_kg} kg`}{preview.body_fat_percent && ` · ${preview.body_fat_percent}% gord`}{preview.notes && <><br />{preview.notes}</>}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
