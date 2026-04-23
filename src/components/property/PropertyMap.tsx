import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  // -----------------------------
  // INIT MAP
  // -----------------------------
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [77.5946, 12.9716],
      zoom: 11,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    mapRef.current = map;
  }, []);

  // -----------------------------
  // RENDER MARKERS
  // -----------------------------
  useEffect(() => {
    if (!mapRef.current) return;

    // clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    properties.forEach((p) => {
      if (!p.latitude || !p.longitude) return;

      const isSelected = selectedProperty?.id === p.id;

      const el = document.createElement("div");

      el.style.padding = "6px 10px";
      el.style.borderRadius = "999px";
      el.style.fontSize = "12px";
      el.style.fontWeight = "600";
      el.style.cursor = "pointer";

      if (isSelected) {
        el.style.background = "#22c55e";
        el.style.color = "#000";
        el.style.boxShadow = "0 0 12px rgba(34,197,94,0.9)";
        el.innerText = `₹${Math.round(p.rent / 1000)}k • Selected`;
      } else {
        el.style.background = "#22d3ee";
        el.style.color = "#000";
        el.innerText = `₹${Math.round(p.rent / 1000)}k`;
      }

      // 🔥 CLICK → OPEN DETAILS
      el.addEventListener("click", () => {
        navigate(`/property/${p.id}`);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([p.longitude, p.latitude])
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });
  }, [properties, selectedProperty]);

  // -----------------------------
  // FLY TO SELECTED
  // -----------------------------
  useEffect(() => {
    if (!mapRef.current || !selectedProperty) return;

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
  // AUTO FIT
  // -----------------------------
  useEffect(() => {
    if (!mapRef.current || properties.length === 0) return;
    if (selectedProperty) return;

    const bounds = new maplibregl.LngLatBounds();

    properties.forEach((p) => {
      bounds.extend([p.longitude, p.latitude]);
    });

    mapRef.current.fitBounds(bounds, {
      padding: 80,
      duration: 1000,
    });
  }, [properties]);

  return (
    <div
      ref={mapContainer}
      style={{ width: "100%", height: "100%" }}
    />
  );
}