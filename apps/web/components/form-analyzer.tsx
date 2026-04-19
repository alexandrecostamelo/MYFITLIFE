'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, CameraOff, Loader2, Play, Pause, Save } from 'lucide-react';
import { analyzePose, countRep, type PoseCheckKey } from '@myfitlife/core/pose-rules';
import { getPoseLandmarker, POSE_CONNECTIONS } from '@/lib/pose-detector';

type Props = {
  poseCheckKey: PoseCheckKey;
  exerciseId?: string | null;
  exerciseName: string;
  onFinish?: (session: any) => void;
};

export function FormAnalyzer({ poseCheckKey, exerciseId, exerciseName, onFinish }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();
  const detectorRef = useRef<any>(null);
  const lastPhaseRef = useRef<string>('up');
  const startTimeRef = useRef<number>(0);
  const scoresRef = useRef<number[]>([]);
  const cuesCountRef = useRef<Record<string, number>>({});
  const repsRef = useRef<number>(0);
  const [loadingModel, setLoadingModel] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [currentCues, setCurrentCues] = useState<string[]>([]);
  const [reps, setReps] = useState(0);
  const [duration, setDuration] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCamera() {
    setError(null);
    setLoadingModel(true);
    try {
      detectorRef.current = await getPoseLandmarker();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraOn(true);
      setLoadingModel(false);
    } catch (err: any) {
      setError(err.message || 'Não foi possível acessar a câmera');
      setLoadingModel(false);
    }
  }

  function stopCamera() {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setCameraOn(false);
    setAnalyzing(false);
  }

  function startAnalysis() {
    if (!detectorRef.current || !videoRef.current || !canvasRef.current) return;

    startTimeRef.current = Date.now();
    scoresRef.current = [];
    cuesCountRef.current = {};
    repsRef.current = 0;
    lastPhaseRef.current = 'up';
    setReps(0);
    setDuration(0);
    setAnalyzing(true);

    const loop = () => {
      const video = videoRef.current!;
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();

      const now = performance.now();
      try {
        const result = detectorRef.current.detectForVideo(video, now);

        if (result.landmarks && result.landmarks.length > 0) {
          const lm = result.landmarks[0];
          drawPose(ctx, lm, canvas.width, canvas.height);

          const feedback = analyzePose(poseCheckKey, lm);
          scoresRef.current.push(feedback.score);
          setCurrentScore(feedback.score);
          setCurrentCues(feedback.cues);

          feedback.cues.forEach((c) => {
            cuesCountRef.current[c] = (cuesCountRef.current[c] || 0) + 1;
          });

          if (feedback.phase && countRep(feedback.phase, lastPhaseRef.current)) {
            repsRef.current += 1;
            setReps(repsRef.current);
          }
          if (feedback.phase) lastPhaseRef.current = feedback.phase;
        }
      } catch (err) {
        console.error('[detect]', err);
      }

      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      rafRef.current = requestAnimationFrame(loop);
    };

    loop();
  }

  function pauseAnalysis() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setAnalyzing(false);
  }

  async function finishAndSave() {
    pauseAnalysis();
    setSaving(true);

    const scores = scoresRef.current;
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const bestScore = scores.length > 0 ? Math.max(...scores) : 0;

    const topCues = Object.entries(cuesCountRef.current)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cue]) => cue);

    const payload = {
      exercise_id: exerciseId || null,
      exercise_name: exerciseName,
      pose_check_key: poseCheckKey,
      duration_sec: duration,
      reps_detected: repsRef.current,
      avg_form_score: avgScore,
      best_form_score: bestScore,
      feedback_counts: cuesCountRef.current,
      summary_cues: topCues,
    };

    const res = await fetch('/api/form-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    stopCamera();

    if (res.ok) {
      const saved = await res.json();
      onFinish?.({ ...payload, id: saved.id });
    }
  }

  useEffect(() => {
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
        <p className="text-sm text-red-900 dark:text-red-200">{error}</p>
        <Button onClick={() => { setError(null); startCamera(); }} className="mt-2">Tentar de novo</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative mx-auto aspect-[4/3] w-full overflow-hidden rounded-lg bg-black">
        <video ref={videoRef} playsInline muted className="hidden" />
        <canvas ref={canvasRef} className="h-full w-full" />

        {!cameraOn && (
          <div className="absolute inset-0 flex items-center justify-center">
            {loadingModel ? (
              <div className="text-center text-white">
                <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin" />
                <p className="text-sm">Carregando modelo de pose...</p>
                <p className="text-xs text-white/70">Primeira vez pode demorar alguns segundos</p>
              </div>
            ) : (
              <Button onClick={startCamera} size="lg">
                <Camera className="mr-2 h-5 w-5" /> Ativar câmera
              </Button>
            )}
          </div>
        )}

        {cameraOn && analyzing && (
          <>
            <div className="absolute left-2 top-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
              {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
            </div>
            <div className="absolute right-2 top-2 rounded bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">
              {reps} reps
            </div>
            <div
              className={`absolute bottom-2 left-2 rounded px-2 py-1 text-xs font-bold ${
                currentScore >= 80 ? 'bg-green-600 text-white' :
                currentScore >= 60 ? 'bg-amber-500 text-white' :
                'bg-red-600 text-white'
              }`}
            >
              Forma: {currentScore}
            </div>
          </>
        )}
      </div>

      {cameraOn && (
        <>
          {currentCues.length > 0 && analyzing && (
            <Card className="border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
              <ul className="space-y-1 text-sm text-amber-900 dark:text-amber-200">
                {currentCues.map((c, i) => (
                  <li key={i}>• {c}</li>
                ))}
              </ul>
            </Card>
          )}

          <div className="grid grid-cols-3 gap-2">
            {!analyzing ? (
              <Button onClick={startAnalysis} className="col-span-2">
                <Play className="mr-2 h-4 w-4" /> Iniciar análise
              </Button>
            ) : (
              <Button onClick={pauseAnalysis} variant="outline" className="col-span-2">
                <Pause className="mr-2 h-4 w-4" /> Pausar
              </Button>
            )}
            <Button onClick={stopCamera} variant="outline">
              <CameraOff className="h-4 w-4" />
            </Button>
          </div>

          {duration > 5 && scoresRef.current.length > 0 && (
            <Button onClick={finishAndSave} disabled={saving} variant="secondary" className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> Finalizar e salvar</>}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

function drawPose(ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number) {
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 3;
  ctx.fillStyle = '#10b981';

  POSE_CONNECTIONS.forEach(([a, b]) => {
    const pa = landmarks[a], pb = landmarks[b];
    if (!pa || !pb) return;
    if ((pa.visibility ?? 1) < 0.5 || (pb.visibility ?? 1) < 0.5) return;
    ctx.beginPath();
    ctx.moveTo((1 - pa.x) * w, pa.y * h);
    ctx.lineTo((1 - pb.x) * w, pb.y * h);
    ctx.stroke();
  });

  landmarks.forEach((lm) => {
    if ((lm.visibility ?? 1) < 0.5) return;
    ctx.beginPath();
    ctx.arc((1 - lm.x) * w, lm.y * h, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}
