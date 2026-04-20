'use client';

import { useEffect, useState } from 'react';

interface Props {
  fat_pct: number;
  muscle_pct: number;
  water_pct: number;
  bone_pct: number;
  size?: number;
}

const RING_CONFIG = [
  { key: 'fat_pct', label: 'Gordura', color: '#FF6B6B' },
  { key: 'muscle_pct', label: 'Músculo', color: '#00D9A3' },
  { key: 'water_pct', label: 'Água', color: '#4DABF7' },
  { key: 'bone_pct', label: 'Osso', color: '#FFD93D' },
];

export function BodyCompositionRings({
  fat_pct,
  muscle_pct,
  water_pct,
  bone_pct,
  size = 200,
}: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const values: Record<string, number> = {
    fat_pct,
    muscle_pct,
    water_pct,
    bone_pct,
  };
  const center = size / 2;
  const strokeWidth = 10;
  const gap = strokeWidth + 5;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          {RING_CONFIG.map((ring, i) => {
            const radius = center - strokeWidth / 2 - i * gap;
            const circumference = 2 * Math.PI * radius;
            const pct = Math.min((values[ring.key] || 0) / 100, 1);
            const offset = circumference * (1 - (mounted ? pct : 0));

            return (
              <g key={ring.key}>
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={strokeWidth}
                  className="text-white/5"
                />
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={ring.color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  transform={`rotate(-90 ${center} ${center})`}
                  className="transition-all duration-1000 ease-out"
                  style={{
                    filter: `drop-shadow(0 0 4px ${ring.color}40)`,
                  }}
                />
              </g>
            );
          })}
        </svg>
      </div>
      <div className="grid grid-cols-4 gap-3 w-full">
        {RING_CONFIG.map((ring) => (
          <div key={ring.key} className="text-center">
            <div className="flex items-center justify-center gap-1">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: ring.color }}
              />
              <span className="font-mono text-sm font-light">
                {(values[ring.key] || 0).toFixed(1)}%
              </span>
            </div>
            <span className="text-[9px] text-muted-foreground">
              {ring.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
