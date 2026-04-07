import { useEffect, useRef, useCallback, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { MapBounds, MapProperty } from '@/hooks/useMapBounds';

interface Props {
  properties: MapProperty[];
  selectedId: string | null;
  hoveredId: string | null;
  onBoundsChange: (bounds: MapBounds) => void;
  onPropertyClick: (id: string) => void;
  center?: [number, number];
  zoom?: number;
}

function formatRent(rent: number) {
  if (rent >= 100000) return `₹${(rent / 100000).toFixed(1)}L`;
  if (rent >= 1000) return `₹${Math.round(rent / 1000)}k`;
  return `₹${rent}`;
}

function markerColor(rent: number): string {
  if (rent < 25000) return 'bg-marker-budget';
  if (rent > 40000) return 'bg-marker-premium';
  return 'bg-marker-mid';
}

function markerBorder(rent: number): string {
  if (rent < 25000) return 'border-marker-budget/50';
  if (rent > 40000) return 'border-marker-premium/50';
  return 'border-marker-mid/50';
}

export default function MapView({
  properties, selectedId, hoveredId, onBoundsChange, onPropertyClick, center = [77.5946, 12.9716], zoom = 12
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, { marker: maplibregl.Marker; el: HTMLDivElement }>>(new Map());
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: center as [number, number],
      zoom,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

    map.on('load', () => {
      setMapLoaded(true);
      const b = map.getBounds();
      onBoundsChange({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      });
    });

    map.on('moveend', () => {
      const b = map.getBounds();
      onBoundsChange({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Render markers
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;
    const existingIds = new Set(markersRef.current.keys());
    const newIds = new Set(properties.map(p => p.id));

    // Remove stale markers
    existingIds.forEach(id => {
      if (!newIds.has(id)) {
        markersRef.current.get(id)?.marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add/update markers
    properties.forEach(p => {
      if (markersRef.current.has(p.id)) {
        // Update highlight state only
        const { el } = markersRef.current.get(p.id)!;
        el.dataset.active = (p.id === selectedId || p.id === hoveredId) ? 'true' : 'false';
        return;
      }

      const el = document.createElement('div');
      el.className = 'map-marker-pill';
      el.dataset.active = 'false';
      el.innerHTML = `
        <div class="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold font-heading
          shadow-lg cursor-pointer transition-all duration-200 border
          ${markerColor(p.rent)} text-white ${markerBorder(p.rent)}
          hover:scale-110 hover:z-50"
          style="white-space:nowrap;"
          data-marker-inner="true">
          ${p.bhk}BHK · ${formatRent(p.rent)}
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onPropertyClick(p.id);
        showPopup(map, p);
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([p.longitude, p.latitude])
        .addTo(map);

      markersRef.current.set(p.id, { marker, el });
    });
  }, [properties, selectedId, hoveredId, mapLoaded]);

  // Highlight hovered/selected marker
  useEffect(() => {
    markersRef.current.forEach(({ el }, id) => {
      const inner = el.querySelector('[data-marker-inner]') as HTMLElement;
      if (!inner) return;
      const isActive = id === selectedId || id === hoveredId;
      if (isActive) {
        inner.style.transform = 'scale(1.2)';
        inner.style.zIndex = '100';
        inner.style.boxShadow = '0 0 20px rgba(255,255,255,0.2)';
      } else {
        inner.style.transform = '';
        inner.style.zIndex = '';
        inner.style.boxShadow = '';
      }
    });
  }, [selectedId, hoveredId]);

  const showPopup = useCallback((map: maplibregl.Map, p: MapProperty) => {
    if (popupRef.current) popupRef.current.remove();

    const imgHtml = p.image_url
      ? `<img src="${p.image_url}" class="w-full h-28 object-cover" alt="${p.title}" />`
      : `<div class="w-full h-28 bg-muted flex items-center justify-center text-muted-foreground text-xs">No Image</div>`;

    const badges = [
      p.is_verified ? '<span class="px-1.5 py-0.5 rounded-full text-[10px] font-semibold" style="background:hsl(168,80%,42%);color:white;">✓ Verified</span>' : '',
      p.is_instant_move_in ? '<span class="px-1.5 py-0.5 rounded-full text-[10px] font-semibold" style="background:hsl(35,95%,55%);color:white;">⚡ Instant</span>' : '',
    ].filter(Boolean).join(' ');

    const popup = new maplibregl.Popup({ offset: 15, closeButton: true, maxWidth: '240px' })
      .setLngLat([p.longitude, p.latitude])
      .setHTML(`
        <div style="width:240px;">
          ${imgHtml}
          <div style="padding:10px 12px;">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:4px;">
              <span style="font-weight:700;font-size:13px;line-height:1.3;font-family:'Space Grotesk',sans-serif;">${p.title}</span>
              <span style="font-weight:800;font-size:14px;color:hsl(168,80%,42%);white-space:nowrap;margin-left:8px;">₹${p.rent.toLocaleString('en-IN')}</span>
            </div>
            <div style="font-size:11px;color:hsl(215,15%,55%);margin-bottom:6px;">${p.address}</div>
            <div style="display:flex;gap:4px;flex-wrap:wrap;">
              <span style="font-size:10px;color:hsl(215,15%,55%);">${p.bhk} BHK</span>
              <span style="font-size:10px;color:hsl(215,15%,55%);">·</span>
              <span style="font-size:10px;color:hsl(215,15%,55%);text-transform:capitalize;">${p.furnishing.replace('-', ' ')}</span>
              ${badges ? `<span style="margin-left:auto;display:flex;gap:3px;">${badges}</span>` : ''}
            </div>
          </div>
        </div>
      `)
      .addTo(map);

    popupRef.current = popup;
  }, []);

  // Fly to selected property
  const flyTo = useCallback((lng: number, lat: number) => {
    mapRef.current?.easeTo({ center: [lng, lat], zoom: 15, duration: 800 });
  }, []);

  // Expose flyTo for parent
  useEffect(() => {
    if (selectedId && mapRef.current) {
      const p = properties.find(x => x.id === selectedId);
      if (p) {
        flyTo(p.longitude, p.latitude);
        showPopup(mapRef.current, p);
      }
    }
  }, [selectedId]);

  return (
    <div ref={containerRef} className="w-full h-full" />
  );
}
