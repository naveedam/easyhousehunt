import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapProperty {
  id: string;
  title: string;
  rent: number;
  latitude: number | null;
  longitude: number | null;
}

interface Props {
  properties: MapProperty[];
  center?: [number, number];
}

export default function PropertyMap({ properties, center = [12.9716, 77.5946] }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [center[1], center[0]],
      zoom: 12,
    });

    const validProps = properties.filter(p => p.latitude && p.longitude);
    validProps.forEach(p => {
      new maplibregl.Marker()
        .setLngLat([p.longitude!, p.latitude!])
        .setPopup(new maplibregl.Popup().setHTML(`<strong>${p.title}</strong><br/>₹${p.rent.toLocaleString('en-IN')}/mo`))
        .addTo(map);
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [properties, center]);

  return (
    <div ref={containerRef} className="rounded-xl overflow-hidden border h-[400px] lg:h-full lg:min-h-[500px]" />
  );
}
