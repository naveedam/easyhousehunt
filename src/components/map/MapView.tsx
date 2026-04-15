import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type Property = {
  id: string;
  latitude: number;
  longitude: number;
};

export default function MapView({
  properties,
  onSelect,
}: {
  properties: Property[];
  onSelect?: (id: string) => void;
}) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json", // 🔥 DARK MAP
      center: [77.5946, 12.9716],
      zoom: 11,
    });

    mapRef.current.addControl(new maplibregl.NavigationControl(), "top-right");
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const markers: maplibregl.Marker[] = [];

    properties.forEach((p) => {
      if (!p.latitude || !p.longitude) return;

      const el = document.createElement("div");
      el.style.background = "#f97316";
      el.style.color = "white";
      el.style.padding = "4px 6px";
      el.style.borderRadius = "6px";
      el.style.fontSize = "12px";
      el.style.cursor = "pointer";
      el.innerText = "₹";

      const marker = new maplibregl.Marker(el)
        .setLngLat([p.longitude, p.latitude])
        .addTo(mapRef.current!);

      el.onclick = () => onSelect?.(p.id);

      markers.push(marker);
    });

    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [properties]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%" }}
    />
  );
}