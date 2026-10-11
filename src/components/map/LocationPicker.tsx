import { useEffect, useRef, useState } from "react";
import maplibregl, { Map, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { LOCALITIES } from "@/data/localities";
import { BENGALURU_CENTER, MAX_CITY_RADIUS_M, distanceMeters } from "@/lib/geo";

type Found = { lat: number; lng: number; approx: boolean };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Longest names first so "Yelahanka New Town" wins over "Yelahanka"
const LOCALITIES_BY_LENGTH = [...LOCALITIES].sort((a, b) => b.name.length - a.name.length);

const withCity = (s: string) => (/bangalore|bengaluru/i.test(s) ? s : `${s}, Bengaluru`);

async function lookup(q: string): Promise<{ lat: number; lng: number } | null> {
  const params = new URLSearchParams({
    q,
    format: "jsonv2",
    limit: "1",
    countrycodes: "in",
    viewbox: "77.35,13.30,77.90,12.70",
    bounded: "1",
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data[0]) return null;
  const hit = { lat: Number(data[0].lat), lng: Number(data[0].lon) };
  return distanceMeters(hit, BENGALURU_CENTER) <= MAX_CITY_RADIUS_M ? hit : null;
}

// The place name first (the apartment), then the full address, then shorter forms of it,
// then the pincode, then a known locality. At most one request per 1.1 s, to respect
// Nominatim's usage policy.
async function locate(text: string, hint: string): Promise<Found | null> {
  const clean = text.trim();
  const place = hint.trim();
  if (clean.length < 3 && place.length < 3) return null;

  const attempts: { q: string; approx: boolean }[] = [];
  if (place.length >= 3) attempts.push({ q: withCity(place), approx: false });
  if (clean.length >= 3) {
    attempts.push({ q: withCity(clean), approx: false });
    const parts = clean.split(",").map((s) => s.trim()).filter(Boolean);
    for (let i = 1; i < parts.length - 1 && attempts.length < 4; i++) {
      attempts.push({ q: withCity(parts.slice(i).join(", ")), approx: true });
    }
    const pin = clean.match(/\b560\d{3}\b/);
    if (pin) attempts.push({ q: `${pin[0]}, Bengaluru`, approx: true });
  }

  for (let i = 0; i < attempts.length; i++) {
    try {
      const hit = await lookup(attempts[i].q);
      if (hit) return { ...hit, approx: attempts[i].approx };
    } catch {
      // network hiccup: try the next fallback
    }
    if (i < attempts.length - 1) await sleep(1100);
  }

  const lower = `${place} ${clean}`.toLowerCase();
  const loc = LOCALITIES_BY_LENGTH.find(
    (l) => lower.includes(l.name.toLowerCase()) || (l.aliases ?? []).some((a) => lower.includes(a.toLowerCase()))
  );
  return loc ? { lat: loc.lat, lng: loc.lng, approx: true } : null;
}

export default function LocationPicker({
  lat,
  lng,
  onChange,
  searchText,
  hint = "",
  findSignal = 0,
}: {
  lat: string;
  lng: string;
  onChange: (lat: number, lng: number) => void;
  searchText: string;
  hint?: string;
  findSignal?: number;
}) {
  const container = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const textRef = useRef(searchText);
  const hintRef = useRef(hint);
  const flyRef = useRef(false);
  const busyRef = useRef(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  onChangeRef.current = onChange;
  textRef.current = searchText;
  hintRef.current = hint;

  const la0 = parseFloat(lat);
  const ln0 = parseFloat(lng);
  const hasPin = !Number.isNaN(la0) && !Number.isNaN(ln0);

  // Map
  useEffect(() => {
    if (!container.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: container.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: hasPin ? [ln0, la0] : [BENGALURU_CENTER.lng, BENGALURU_CENTER.lat],
      zoom: hasPin ? 16 : 10.5,
    });
    mapRef.current = map;
    map.on("click", (e) => {
      // a click that ends a marker drag must not move the pin again
      const target = e.originalEvent.target as HTMLElement | null;
      if (target?.closest?.(".maplibregl-marker")) return;
      setStatus("");
      onChangeRef.current(e.lngLat.lat, e.lngLat.lng);
    });
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Keep the draggable pin in sync with the coordinates
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const la = parseFloat(lat);
    const ln = parseFloat(lng);
    if (Number.isNaN(la) || Number.isNaN(ln)) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    if (!markerRef.current) {
      const m = new maplibregl.Marker({ draggable: true, color: "#f97316" }).setLngLat([ln, la]).addTo(map);
      m.on("dragend", () => {
        const p = m.getLngLat();
        setStatus("");
        onChangeRef.current(p.lat, p.lng);
      });
      markerRef.current = m;
    } else {
      const cur = markerRef.current.getLngLat();
      if (Math.abs(cur.lat - la) > 1e-7 || Math.abs(cur.lng - ln) > 1e-7) {
        markerRef.current.setLngLat([ln, la]);
      }
    }
    if (flyRef.current) {
      flyRef.current = false;
      map.flyTo({ center: [ln, la], zoom: Math.max(map.getZoom(), 16), speed: 1.4 });
    }
  }, [lat, lng]);

  const find = async () => {
    if (busyRef.current) return;
    const text = textRef.current.trim();
    const place = hintRef.current.trim();
    if (text.length < 3 && place.length < 3) {
      setStatus("Type the address (or pick the apartment) first, then try again.");
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setStatus("Looking for it on the map...");
    try {
      const found = await locate(text, place);
      if (!found) {
        setStatus("Could not find that address. Tap the map to drop the pin on your building.");
      } else {
        flyRef.current = true;
        onChangeRef.current(found.lat, found.lng);
        window.setTimeout(() => { flyRef.current = false; }, 500);
        setStatus(
          found.approx
            ? "Approximate spot found. Drag the pin onto your building."
            : "Found it. Drag the pin to fine-tune if needed."
        );
      }
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  // The wizard bumps this when an address is entered or an apartment is chosen
  useEffect(() => {
    if (findSignal > 0) void find();
  }, [findSignal]);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setStatus("Your browser cannot share its location. Tap the map instead.");
      return;
    }
    setStatus("Getting your location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (distanceMeters(here, BENGALURU_CENTER) > MAX_CITY_RADIUS_M) {
          setStatus("You seem to be outside Bengaluru. Tap the map to place the pin.");
          return;
        }
        flyRef.current = true;
        onChangeRef.current(here.lat, here.lng);
        window.setTimeout(() => { flyRef.current = false; }, 500);
        setStatus("Using your current location. Drag the pin onto the building if you are not standing at it.");
      },
      () => setStatus("Location is blocked. Tap the map to place the pin."),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="text-sm text-gray-400">Pin on map *</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={find}
            disabled={busy}
            className="rounded-lg bg-orange-500 px-3 py-1 text-xs font-medium hover:bg-orange-600 disabled:opacity-50"
          >
            {busy ? "Searching..." : "🔎 Find on map"}
          </button>
          <button
            type="button"
            onClick={useMyLocation}
            className="rounded-lg bg-gray-700 px-3 py-1 text-xs font-medium hover:bg-gray-600"
          >
            📱 My location
          </button>
        </div>
      </div>
      <div ref={container} className="h-56 w-full overflow-hidden rounded-lg border border-gray-700" />
      <p className={`mt-1 text-xs ${hasPin ? "text-green-400" : "text-gray-400"}`}>
        {status ||
          (hasPin
            ? "Pin placed. Drag it, or tap the map, to adjust."
            : "Tap the map to drop a pin on your building, or use Find on map.")}
      </p>
    </div>
  );
}