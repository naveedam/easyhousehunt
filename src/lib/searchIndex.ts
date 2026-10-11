import Fuse from "fuse.js";
import type { Property } from "@/types/property";
import { LOCALITIES } from "@/data/localities";
import { AREA_RADIUS_M, distanceMeters } from "@/lib/geo";

export type Suggestion = {
  kind: "apartment" | "area";
  key: string;
  label: string;
  count: number; // apartment: its listings. area: listings within AREA_RADIUS_M
  lat: number | null;
  lng: number | null;
};

type Item = Suggestion & { aliases: string[] };
export type SearchIndex = { fuse: Fuse<Item> };

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export function buildIndex(properties: Property[]): SearchIndex {
  const apartments = new Map<string, { label: string; count: number; lat: number; lng: number; located: number }>();
  for (const p of properties) {
    const label = (p.title || "").trim();
    if (!label || label.toLowerCase() === "untitled") continue;
    const key = norm(label);
    if (!key) continue;
    const e = apartments.get(key) ?? { label, count: 0, lat: 0, lng: 0, located: 0 };
    e.count += 1;
    if (p.latitude != null && p.longitude != null) {
      e.lat += p.latitude;
      e.lng += p.longitude;
      e.located += 1;
    }
    apartments.set(key, e);
  }

  const items: Item[] = [];
  apartments.forEach((a, key) => {
    items.push({
      kind: "apartment",
      key: "apt:" + key,
      label: a.label,
      count: a.count,
      lat: a.located ? a.lat / a.located : null,
      lng: a.located ? a.lng / a.located : null,
      aliases: [],
    });
  });

  const located = properties.filter((p) => p.latitude != null && p.longitude != null);
  for (const loc of LOCALITIES) {
    const count = located.filter(
      (p) => distanceMeters({ lat: loc.lat, lng: loc.lng }, { lat: p.latitude!, lng: p.longitude! }) <= AREA_RADIUS_M
    ).length;
    items.push({
      kind: "area",
      key: "area:" + norm(loc.name),
      label: loc.name,
      count,
      lat: loc.lat,
      lng: loc.lng,
      aliases: loc.aliases ?? [],
    });
  }

  const fuse = new Fuse(items, {
    keys: [
      { name: "label", weight: 2 },
      { name: "aliases", weight: 1 },
    ],
    threshold: 0.36,
    ignoreLocation: true,
    minMatchCharLength: 2,
    includeScore: true,
  });
  return { fuse };
}

export function getSuggestions(index: SearchIndex, query: string, limit = 6): Suggestion[] {
  const q = query.trim();
  if (q.length < 2) return [];
  return index.fuse
    .search(q)
    .map((r) => ({ item: r.item, rank: (r.score ?? 1) - Math.min(r.item.count, 5) * 0.02 }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, limit)
    .map((r) => r.item);
}
