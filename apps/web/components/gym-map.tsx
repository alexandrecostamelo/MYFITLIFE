'use client';

import { useEffect, useRef } from 'react';

type Gym = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance_km?: number;
  checkins_total?: number;
};

type Props = {
  userLat?: number;
  userLng?: number;
  gyms: Gym[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  height?: number;
};

export function GymMap({ userLat, userLng, gyms, selectedId, onSelect, height = 300 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (typeof window === 'undefined') return;

      if (!(window as any).L) {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(css);

        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => resolve();
          document.body.appendChild(script);
        });
      }

      if (cancelled || !containerRef.current) return;

      const L = (window as any).L;

      const defaultLat = userLat ?? (gyms[0]?.latitude ?? -22.1256);
      const defaultLng = userLng ?? (gyms[0]?.longitude ?? -51.3889);

      if (mapRef.current) {
        mapRef.current.remove();
      }

      const map = L.map(containerRef.current).setView([defaultLat, defaultLng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      if (userLat && userLng) {
        L.circleMarker([userLat, userLng], {
          radius: 8,
          color: '#2563eb',
          fillColor: '#3b82f6',
          fillOpacity: 0.8,
        }).addTo(map).bindPopup('Você está aqui');
      }

      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      gyms.forEach((gym) => {
        const icon = L.divIcon({
          className: 'gym-marker',
          html: `<div style="background:#1F4E79;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)">💪</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([gym.latitude, gym.longitude], { icon }).addTo(map);
        marker.bindPopup(`<strong>${gym.name}</strong>${gym.distance_km ? `<br/><small>${gym.distance_km.toFixed(1)} km</small>` : ''}`);
        marker.on('click', () => onSelect?.(gym.id));
        markersRef.current.push(marker);
      });

      if (gyms.length > 0) {
        const bounds = L.latLngBounds(gyms.map((g) => [g.latitude, g.longitude]));
        if (userLat && userLng) bounds.extend([userLat, userLng]);
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
      }
    }

    init();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [userLat, userLng, gyms, onSelect]);

  return (
    <div
      ref={containerRef}
      style={{ height: `${height}px`, width: '100%', borderRadius: '0.5rem', overflow: 'hidden', zIndex: 0 }}
    />
  );
}
