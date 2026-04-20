'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface GeoPoint {
  lat: number;
  lng: number;
  alt?: number;
  timestamp: number;
  speed?: number;
  accuracy?: number;
}

export interface Split {
  km: number;
  time_sec: number;
  pace_sec_per_km: number;
  elevation_change_m: number;
}

export interface TrackingState {
  status: 'idle' | 'running' | 'paused' | 'stopped';
  points: GeoPoint[];
  distance_m: number;
  duration_sec: number;
  current_pace: number;
  avg_pace: number;
  best_pace: number;
  calories: number;
  splits: Split[];
  elevation_gain: number;
  elevation_loss: number;
  avg_speed_kmh: number;
}

function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const INITIAL: TrackingState = {
  status: 'idle',
  points: [],
  distance_m: 0,
  duration_sec: 0,
  current_pace: 0,
  avg_pace: 0,
  best_pace: 0,
  calories: 0,
  splits: [],
  elevation_gain: 0,
  elevation_loss: 0,
  avg_speed_kmh: 0,
};

export function useGPSTracking(weightKg: number = 70) {
  const [state, setState] = useState<TrackingState>(INITIAL);

  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const pausedDurationRef = useRef(0);
  const pauseStartRef = useRef(0);
  const pointsRef = useRef<GeoPoint[]>([]);
  const distanceRef = useRef(0);
  const lastSplitDistRef = useRef(0);
  const lastSplitTimeRef = useRef(0);
  const splitsRef = useRef<Split[]>([]);
  const elevGainRef = useRef(0);
  const elevLossRef = useRef(0);
  const bestPaceRef = useRef(Infinity);
  const statusRef = useRef<TrackingState['status']>('idle');

  const computeElapsed = useCallback(() => {
    if (statusRef.current === 'paused') {
      return (
        (pauseStartRef.current -
          startTimeRef.current -
          pausedDurationRef.current) /
        1000
      );
    }
    return (
      (Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000
    );
  }, []);

  const updateState = useCallback(() => {
    const elapsed = computeElapsed();
    const dist = distanceRef.current;
    const distKm = dist / 1000;
    const avgPace = distKm > 0.01 ? elapsed / distKm : 0;
    const avgSpeed = elapsed > 0 ? (dist / elapsed) * 3.6 : 0;
    const calories = Math.round((dist / 1000) * weightKg * 1.036);

    setState((prev) => ({
      ...prev,
      points: [...pointsRef.current],
      distance_m: dist,
      duration_sec: Math.round(elapsed),
      avg_pace: Math.round(avgPace),
      avg_speed_kmh: Math.round(avgSpeed * 10) / 10,
      calories,
      splits: [...splitsRef.current],
      elevation_gain: Math.round(elevGainRef.current),
      elevation_loss: Math.round(elevLossRef.current),
      best_pace:
        bestPaceRef.current === Infinity
          ? 0
          : Math.round(bestPaceRef.current),
    }));
  }, [computeElapsed, weightKg]);

  const onPosition = useCallback(
    (pos: GeolocationPosition) => {
      if (statusRef.current !== 'running') return;

      const point: GeoPoint = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        alt: pos.coords.altitude ?? undefined,
        timestamp: pos.timestamp,
        speed: pos.coords.speed ?? undefined,
        accuracy: pos.coords.accuracy,
      };

      // filter bad accuracy
      if (point.accuracy && point.accuracy > 30) return;

      const prev = pointsRef.current[pointsRef.current.length - 1];
      pointsRef.current.push(point);

      if (prev) {
        const segDist = haversine(prev.lat, prev.lng, point.lat, point.lng);
        // filter GPS jumps and stationary noise
        if (segDist < 1 || segDist > 200) return;
        distanceRef.current += segDist;

        // elevation
        if (point.alt !== undefined && prev.alt !== undefined) {
          const eleDiff = point.alt - prev.alt;
          if (eleDiff > 0) elevGainRef.current += eleDiff;
          else elevLossRef.current += Math.abs(eleDiff);
        }

        // instant pace from GPS speed
        if (point.speed && point.speed > 0.5) {
          const instantPace = 1000 / point.speed;
          setState((s) => ({ ...s, current_pace: Math.round(instantPace) }));
        }

        // splits
        const kmNow = Math.floor(distanceRef.current / 1000);
        const kmLast = Math.floor(lastSplitDistRef.current / 1000);
        if (kmNow > kmLast && kmNow > 0) {
          const elapsed = computeElapsed();
          const splitTime = elapsed - lastSplitTimeRef.current;
          if (splitTime < bestPaceRef.current)
            bestPaceRef.current = splitTime;

          const prevAlt =
            pointsRef.current[
              Math.max(0, pointsRef.current.length - 20)
            ]?.alt;
          const eleChange = (point.alt ?? 0) - (prevAlt ?? 0);

          splitsRef.current.push({
            km: kmNow,
            time_sec: Math.round(splitTime),
            pace_sec_per_km: Math.round(splitTime),
            elevation_change_m: Math.round(eleChange),
          });

          lastSplitDistRef.current = distanceRef.current;
          lastSplitTimeRef.current = elapsed;
        }
      }
    },
    [computeElapsed],
  );

  const clearWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startWatch = useCallback(() => {
    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        onPosition,
        (err) => console.error('GPS error:', err),
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 },
      );
    }
    timerRef.current = setInterval(updateState, 1000);
  }, [onPosition, updateState]);

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    pausedDurationRef.current = 0;
    pointsRef.current = [];
    distanceRef.current = 0;
    lastSplitDistRef.current = 0;
    lastSplitTimeRef.current = 0;
    splitsRef.current = [];
    elevGainRef.current = 0;
    elevLossRef.current = 0;
    bestPaceRef.current = Infinity;
    statusRef.current = 'running';

    setState({ ...INITIAL, status: 'running' });
    startWatch();
  }, [startWatch]);

  const pause = useCallback(() => {
    pauseStartRef.current = Date.now();
    statusRef.current = 'paused';
    setState((s) => ({ ...s, status: 'paused' }));
    clearWatch();
  }, [clearWatch]);

  const resume = useCallback(() => {
    pausedDurationRef.current += Date.now() - pauseStartRef.current;
    statusRef.current = 'running';
    setState((s) => ({ ...s, status: 'running' }));
    startWatch();
  }, [startWatch]);

  const stop = useCallback(() => {
    statusRef.current = 'stopped';
    clearWatch();
    updateState();
    setState((s) => ({ ...s, status: 'stopped' }));
  }, [clearWatch, updateState]);

  const discard = useCallback(() => {
    statusRef.current = 'idle';
    clearWatch();
    setState(INITIAL);
  }, [clearWatch]);

  useEffect(() => {
    return () => clearWatch();
  }, [clearWatch]);

  return { state, start, pause, resume, stop, discard };
}
