'use client';

import dynamic from 'next/dynamic';

export const MuscleBody3D = dynamic(
  () => import('./muscle-body-3d').then((m) => ({ default: m.MuscleBody3D })),
  { ssr: false, loading: () => <div style={{ height: 480 }} className="flex items-center justify-center bg-gray-900 rounded text-gray-400 text-sm">Carregando modelo 3D...</div> },
);
