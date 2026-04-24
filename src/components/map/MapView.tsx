import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";

type Props = {
  properties: any[];
};

export default function MapView({ properties }: Props) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [77.5946, 12.9716], // Bangalore
      zoom: 12,
    });

    mapRef.current = map;

    console.log("✅ Map loaded");
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Remove old markers
    const existingMarkers = document.querySelectorAll(".marker");
    existingMarkers.forEach((m) => m.remove());

    properties.forEach((p) => {
      if (!p.latitude || !p.longitude) return;

      const el = document.createElement("div");
      el.className = "marker";
      el.style.background = "#22c55e";
      el.style.color = "black";
      el.style.padding = "4px 8px";
      el.style.borderRadius = "6px";
      el.style.fontSize = "12px";
      el.innerText = `₹${p.rent / 1000}k`;

      new maplibregl.Marker(el)
        .setLngLat([p.longitude, p.latitude])
        .addTo(map);
    });
  }, [properties]);

  return <div ref={mapContainer} className="w-full h-full" />;
}