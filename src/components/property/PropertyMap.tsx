import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type Property = {
  id: string;
  title: string;
  rent: number;
  latitude: number;
  longitude: number;
};

type Props = {
  properties: Property[];
  selectedProperty: Property | null;
};

export default function PropertyMap({
  properties,
  selectedProperty,
}: Props) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // -----------------------------
  // INIT MAP (RUN ONCE)
  // -----------------------------
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [77.5946, 12.9716], // Bangalore default
      zoom: 11,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    mapRef.current = map;

    console.log("🗺️ Map initialized");
  }, []);

  // -----------------------------
  // RENDER MARKERS
  // -----------------------------
  useEffect(() => {
    if (!mapRef.current) return;

    console.log("📍 Rendering markers:", properties.length);

    // clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    properties.forEach((p) => {
      if (!p.latitude || !p.longitude) return;

      const isSelected = selectedProperty?.id === p.id;

      // marker element
      const el = document.createElement("div");
      el.style.padding = "6px 10px";
      el.style.borderRadius = "999px";
      el.style.fontSize = "12px";
      el.style.fontWeight = "600";
      el.style.cursor = "pointer";

      if (isSelected) {
        el.style.background = "#22c55e"; // green
        el.style.color = "#000";
        el.style.boxShadow = "0 0 12px rgba(34,197,94,0.9)";
        el.innerText = `₹${Math.round(p.rent / 1000)}k • Selected`;
      } else {
        el.style.background = "#22d3ee"; // cyan
        el.style.color = "#000";
        el.innerText = `₹${Math.round(p.rent / 1000)}k`;
      }

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([p.longitude, p.latitude])
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });

    console.log("✅ Markers rendered:", markersRef.current.length);
  }, [properties, selectedProperty]);

  // -----------------------------
  // FLY TO SELECTED PROPERTY
  // -----------------------------
  useEffect(() => {
    if (!mapRef.current || !selectedProperty) return;

    console.log("✈️ Flying to:", selectedProperty.title);

    mapRef.current.flyTo({
      center: [
        selectedProperty.longitude,
        selectedProperty.latitude,
      ],
      zoom: 15,
      speed: 1.2,
    });
  }, [selectedProperty]);

  // -----------------------------
  // AUTO FIT (FIRST LOAD ONLY)
  // -----------------------------
  useEffect(() => {
    if (!mapRef.current || properties.length === 0) return;

    if (selectedProperty) return; // don't override user selection

    const bounds = new maplibregl.LngLatBounds();

    properties.forEach((p) => {
      if (p.latitude && p.longitude) {
        bounds.extend([p.longitude, p.latitude]);
      }
    });

    mapRef.current.fitBounds(bounds, {
      padding: 80,
      duration: 1000,
    });

    console.log("🧭 Auto-fit applied");
  }, [properties]);

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div
      ref={mapContainer}
      style={{
        width: "100%",
        height: "100%", // 🔥 critical fix for blank map
      }}
    />
  );
}