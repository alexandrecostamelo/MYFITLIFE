'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useTts } from './use-tts';
import {
  getCueText,
  getCueConfig,
  countRepText,
  mapCueToType,
  type PoseCueType,
} from './pose-cues';

export function usePoseVoice() {
  const tts = useTts({ rate: 1.1, preferFemale: true });
  const variantRef = useRef<Record<string, number>>({});

  const say = useCallback(
    (type: PoseCueType) => {
      if (!tts.supported || tts.muted) return;
      const config = getCueConfig(type);
      variantRef.current[type] = (variantRef.current[type] || 0) + 1;
      const text = getCueText(type, variantRef.current[type]);
      if (!text) return;
      tts.speak(text, { key: type, priority: config.priority, throttleMs: config.throttleMs });
    },
    [tts],
  );

  const sayFromCueString = useCallback(
    (cue: string) => {
      const type = mapCueToType(cue);
      if (type) {
        say(type);
      } else {
        // Fallback: speak the cue text directly with default throttle
        tts.speak(cue, { key: cue, priority: 3, throttleMs: 5000 });
      }
    },
    [say, tts],
  );

  const countRepAloud = useCallback(
    (n: number, total?: number) => {
      if (!tts.supported || tts.muted) return;
      tts.speak(countRepText(n), { key: `rep-${n}`, priority: 3, throttleMs: 0 });
      if (total && n === Math.floor(total / 2)) say('rep_milestone');
      if (total && n === total - 1) say('encouragement_end');
    },
    [tts, say],
  );

  const urgent = useCallback(
    (type: PoseCueType) => {
      if (!tts.supported || tts.muted) return;
      variantRef.current[type] = (variantRef.current[type] || 0) + 1;
      const text = getCueText(type, variantRef.current[type]);
      if (!text) return;
      tts.speakUrgent(text, type);
    },
    [tts],
  );

  useEffect(() => () => tts.stop(), [tts]);

  return {
    say,
    sayFromCueString,
    urgent,
    countRepAloud,
    muted: tts.muted,
    toggleMute: tts.toggleMute,
    supported: tts.supported,
    voice: tts.voice,
  };
}
