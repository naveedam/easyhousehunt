import { useEffect, useRef, useState } from "react";
import maplibregl, { Map, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Property } from "../../types/property";
import PropertyPreview from "./PropertyPreview";

function buildHoverContent(p: Property): HTMLElement {
  const wrap = document.createElement("div");
  wrap.style.minWidth = "180px";

  const title = document.createElement("div");
  title.style.fontWeight = "600";
  title.style.fontSize = "13px";
  title.textContent = p.title || "Untitled";

  const rent = document.createElement("div");
  rent.style.color = "#4ade80";
  rent.style.fontWeight = "700";
  rent.style.fontSize = "15px";
  rent.textContent = p.rent ? "₹" + p.rent.toLocaleString("en-IN") + "/mo" : "Price on request";

  const meta = document.createElement("div");
  meta.style.fontSize = "12px";
  meta.style.color = "#d1d5db";
  const size =
    p.property_type === "PG" && p.occupancy ? p.occupancy + " Occupancy" : p.bhk ? p.bhk + " BHK" : "";
  meta.textContent = [p.property_type, size, p.furnishing].filter(Boolean).join(" · ");

  wrap.append(title, rent, meta);

  if (p.address) {
    const addr = document.createElement("div");
    addr.style.fontSize = "11px";
    addr.style.color = "#9ca3af";
    addr.style.maxWidth = "220px";
    addr.style.overflow = "hidden";
    addr.style.textOverflow = "ellipsis";
    addr.style.whiteSpace = "nowrap";
    addr.textContent = "📍 " + p.address;
    wrap.append(addr);
  }
  return wrap;
}

export default function MapView({
  properties,
  selectedProperty,
  onMarkerClick,
  onViewDetails,
  previewBottom,
}: {
  properties: Property[];
  selectedProperty: Property | null;
  onMarkerClick?: (p: Property) => void;
  onViewDetails?: (p: Property) => void;
  previewBottom?: string;
}) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const hoverPopupRef = useRef<maplibregl.Popup | null>(null);
  const canHover = typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;
  const [mapLoaded, setMapLoaded] = useState(false);
  const [preview, setPreview] = useState<Property | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [77.5946, 12.9716],
      zoom: 11,
    });
    mapRef.current = map;
    map.on("load", () => setMapLoaded(true));
    map.on("click", () => setPreview(null)); // tap empty map closes the card
    return () => { map.remove(); mapRef.current = null; setMapLoaded(false); };
  }, []);

  // Hide the card if its property is filtered out of the list
  useEffect(() => {
    if (preview && !properties.some((p) => p.id === preview.id)) setPreview(null);
  }, [properties, preview]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    markersRef.current.forEach((m) => m.remove());
    hoverPopupRef.current?.remove();
    markersRef.current = [];
    properties.forEach((p) => {
      if (!p.latitude || !p.longitude) return;
      const isSelected = selectedProperty?.id === p.id;
      const el = document.createElement("div");
      el.style.padding = "4px 8px";
      el.style.borderRadius = "999px";
      el.style.fontSize = "11px";
      el.style.fontWeight = "700";
      el.style.cursor = "pointer";
      el.style.background = isSelected ? "#f97316" : "#22d3ee";
      el.style.color = isSelected ? "#fff" : "#000";
      el.style.boxShadow = isSelected ? "0 0 12px rgba(249,115,22,0.8)" : "none";
      el.style.zIndex = isSelected ? "10" : "1";
      el.innerText = p.rent ? "₹" + Math.round(p.rent / 1000) + "k" : "₹";
      el.addEventListener("mouseenter", () => {
        if (!canHover) return;
        hoverPopupRef.current?.remove();
        hoverPopupRef.current = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 22,
          maxWidth: "260px",
          className: "hover-popup",
        })
          .setLngLat([p.longitude!, p.latitude!])
          .setDOMContent(buildHoverContent(p))
          .addTo(map);
      });
      el.addEventListener("mouseleave", () => {
        hoverPopupRef.current?.remove();
        hoverPopupRef.current = null;
      });
      el.addEventListener("click", (e) => {
        hoverPopupRef.current?.remove();
        e.stopPropagation(); // don't let the map's click handler close the card
        map.flyTo({ center: [p.longitude!, p.latitude!], zoom: Math.max(map.getZoom(), 13), speed: 1.2, offset: [0, -90] });
        onMarkerClick?.(p);
        if (onViewDetails) setPreview(p); // preview only when parent supports "view details"
      });
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([p.longitude, p.latitude])
        .addTo(map);
      markersRef.current.push(marker);
    });
  }, [properties, selectedProperty, mapLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !selectedProperty?.latitude || !selectedProperty?.longitude) return;
    map.flyTo({
      center: [selectedProperty.longitude, selectedProperty.latitude],
      zoom: Math.max(map.getZoom(), 13),
      speed: 1.2,
      offset: [0, -90],
    });
  }, [selectedProperty, mapLoaded]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainer} className="h-full w-full" />
      {preview && onViewDetails && (
        <PropertyPreview
          property={preview}
          bottom={previewBottom}
          onClose={() => setPreview(null)}
          onViewDetails={() => {
            setPreview(null);
            onViewDetails(preview);
          }}
        />
      )}
    </div>
  );
}
