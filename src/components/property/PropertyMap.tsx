import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";

type Property = {
  id: string;
  latitude?: number;
  longitude?: number;
  title?: string;
};

export default function PropertyMap({ properties = [] }: { properties?: Property[] }) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [77.5946, 12.9716], // Bengaluru
      zoom: 11,
    });

    // Add markers
    properties.forEach((property) => {
      if (property.latitude && property.longitude) {
        new maplibregl.Marker()
          .setLngLat([property.longitude, property.latitude])
          .setPopup(
            new maplibregl.Popup().setHTML(
              `<div style="color:black;">${property.title || "Property"}</div>`
            )
          )
          .addTo(mapRef.current);
      }
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [properties]);

  return <div ref={mapContainer} className="w-full h-full" />;
}