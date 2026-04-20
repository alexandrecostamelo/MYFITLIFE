'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GeoPoint } from '@/hooks/use-gps-tracking';

interface Props {
  points: GeoPoint[];
  interactive?: boolean;
}

export function RunMap({ points, interactive = true }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const center: [number, number] =
      points.length > 0
        ? [points[0].lat, points[0].lng]
        : [-22.12, -51.39];

    mapInstance.current = L.map(mapRef.current, {
      center,
      zoom: 15,
      zoomControl: interactive,
      dragging: interactive,
      scrollWheelZoom: interactive,
      attributionControl: false,
    });

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      { maxZoom: 19 },
    ).addTo(mapInstance.current);

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
    // only init once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapInstance.current || points.length < 2) return;

    const latlngs = points.map(
      (p) => [p.lat, p.lng] as [number, number],
    );

    if (polylineRef.current) {
      polylineRef.current.setLatLngs(latlngs);
    } else {
      polylineRef.current = L.polyline(latlngs, {
        color: '#00D9A3',
        weight: 4,
        opacity: 0.9,
      }).addTo(mapInstance.current);
    }

    const last = latlngs[latlngs.length - 1];
    mapInstance.current.setView(last, mapInstance.current.getZoom());
  }, [points]);

  return <div ref={mapRef} className="h-full w-full" />;
}
