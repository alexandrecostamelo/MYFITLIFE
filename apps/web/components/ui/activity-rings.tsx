'use client';

import { useEffect, useState } from 'react';

interface Ring {
  value: number;
  max: number;
  color: string;
  label: string;
}

interface Props {
  rings: Ring[];
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ActivityRings({ rings, size = 180, strokeWidth = 12, className = '' }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const center = size / 2;
  const gap = strokeWidth + 6;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {rings.map((ring, i) => {
          const radius = center - strokeWidth / 2 - i * gap;
          const circumference = 2 * Math.PI * radius;
          const pct = Math.min(ring.value / ring.max, 1);
          const offset = circumference * (1 - (mounted ? pct : 0));

          return (
            <g key={i}>
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
                style={{ filter: `drop-shadow(0 0 6px ${ring.color}40)` }}
              />
            </g>
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {rings.map((ring, i) => (
          <p key={i} className="text-[10px] font-medium" style={{ color: ring.color }}>
            {ring.label}
          </p>
        ))}
      </div>
    </div>
  );
}
