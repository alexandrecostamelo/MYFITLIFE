'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface TtsOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  preferFemale?: boolean;
}

interface QueueItem {
  text: string;
  key: string;
  priority: number;
  addedAt: number;
}

const DEFAULT_OPTS: Required<TtsOptions> = {
  lang: 'pt-BR',
  rate: 1.05,
  pitch: 1.0,
  volume: 1.0,
  preferFemale: true,
};

const FEMALE_HINTS = ['female', 'feminina', 'f', 'fiona', 'maria', 'luciana', 'camila', 'vitória', 'helena'];

export function useTts(options: TtsOptions = {}) {
  const opts = { ...DEFAULT_OPTS, ...options };
  const [supported, setSupported] = useState(false);
  const [muted, setMuted] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('mfl-tts-muted') === '1';
  });
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const queueRef = useRef<QueueItem[]>([]);
  const speakingRef = useRef(false);
  const lastPlayedRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    setSupported(true);

    const loadVoices = () => {
      const all = window.speechSynthesis.getVoices();
      if (all.length === 0) return;

      const ptVoices = all.filter((v) => v.lang.startsWith('pt'));
      const preferred = ptVoices.find((v) => v.lang === 'pt-BR') || ptVoices[0];

      if (opts.preferFemale && ptVoices.length > 1) {
        const female = ptVoices.find((v) =>
          FEMALE_HINTS.some((h) => v.name.toLowerCase().includes(h)),
        );
        setVoice(female || preferred || null);
      } else {
        setVoice(preferred || null);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processQueue = useCallback(() => {
    if (speakingRef.current || muted || !supported) return;
    if (queueRef.current.length === 0) return;

    queueRef.current.sort((a, b) => b.priority - a.priority || a.addedAt - b.addedAt);
    const item = queueRef.current.shift();
    if (!item) return;

    const utter = new SpeechSynthesisUtterance(item.text);
    utter.lang = opts.lang;
    utter.rate = opts.rate;
    utter.pitch = opts.pitch;
    utter.volume = opts.volume;
    if (voice) utter.voice = voice;

    speakingRef.current = true;
    utter.onend = () => {
      speakingRef.current = false;
      setTimeout(processQueue, 150);
    };
    utter.onerror = () => {
      speakingRef.current = false;
      setTimeout(processQueue, 150);
    };

    window.speechSynthesis.speak(utter);
  }, [muted, supported, voice, opts.lang, opts.rate, opts.pitch, opts.volume]);

  const speak = useCallback(
    (text: string, config: { key?: string; priority?: number; throttleMs?: number } = {}) => {
      if (!supported || muted || !text) return;

      const key = config.key || text;
      const throttleMs = config.throttleMs ?? 5000;
      const now = Date.now();

      if (lastPlayedRef.current[key] && now - lastPlayedRef.current[key] < throttleMs) {
        return;
      }
      lastPlayedRef.current[key] = now;

      queueRef.current = queueRef.current.filter((q) => q.key !== key);
      queueRef.current.push({
        text,
        key,
        priority: config.priority || 0,
        addedAt: now,
      });

      processQueue();
    },
    [supported, muted, processQueue],
  );

  const speakUrgent = useCallback(
    (text: string, key?: string) => {
      if (!supported || muted) return;
      window.speechSynthesis.cancel();
      speakingRef.current = false;
      queueRef.current = [];
      speak(text, { key, priority: 10, throttleMs: 2000 });
    },
    [speak, supported, muted],
  );

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    queueRef.current = [];
    speakingRef.current = false;
  }, [supported]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      localStorage.setItem('mfl-tts-muted', next ? '1' : '0');
      if (next) {
        window.speechSynthesis.cancel();
        queueRef.current = [];
        speakingRef.current = false;
      }
      return next;
    });
  }, []);

  return { speak, speakUrgent, stop, muted, toggleMute, supported, voice };
}
