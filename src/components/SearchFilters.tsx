import { useEffect, useMemo, useRef, useState } from "react";
import { buildIndex, getSuggestions, type Suggestion } from "@/lib/searchIndex";
import { useSearchableProperties, useSearchNote } from "@/lib/searchStore";

export interface Filters {
  bhk: number[];
  minRent: number;
  maxRent: number;
  furnishing: string[];
  search: string;
  propertyType: string;
  occupancy: string[];
  area?: { name: string; lat: number; lng: number } | null;
}

const DEFAULT_FILTERS: Filters = {
  bhk: [],
  minRent: 0,
  maxRent: 200000,
  furnishing: [],
  search: "",
  propertyType: "All",
  occupancy: [],
  area: null,
};

export default function SearchFilters({
  onChange,
}: {
  onChange: (f: Filters) => void;
}) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [expanded, setExpanded] = useState(false);

  // Suggestions: apartment names from live listings + a bundled list of Bengaluru areas
  const allProperties = useSearchableProperties();
  const searchNote = useSearchNote();
  const index = useMemo(() => buildIndex(allProperties), [allProperties]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const suggestions = useMemo(
    () => (open ? getSuggestions(index, filters.search) : []),
    [open, index, filters.search]
  );

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  const pick = (s: Suggestion) => {
    setOpen(false);
    setHighlight(-1);
    if (s.kind === "area" && s.lat != null && s.lng != null) {
      update({ search: "", area: { name: s.label, lat: s.lat, lng: s.lng } });
    } else {
      update({ search: s.label, area: null });
    }
  };

  const update = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    onChange(next);
  };

  const toggleBhk = (n: number) => {
    const next = filters.bhk.includes(n)
      ? filters.bhk.filter((x) => x !== n)
      : [...filters.bhk, n];
    update({ bhk: next });
  };

  const toggleFurnishing = (f: string) => {
    const next = filters.furnishing.includes(f)
      ? filters.furnishing.filter((x) => x !== f)
      : [...filters.furnishing, f];
    update({ furnishing: next });
  };

  const toggleOccupancy = (o: string) => {
    const next = filters.occupancy.includes(o)
      ? filters.occupancy.filter((x) => x !== o)
      : [...filters.occupancy, o];
    update({ occupancy: next });
  };
  const reset = () => {
    setFilters(DEFAULT_FILTERS);
    onChange(DEFAULT_FILTERS);
  };

  const activeCount = [
    filters.bhk.length > 0,
    filters.furnishing.length > 0,
    filters.minRent > 0 || filters.maxRent < 200000,
    filters.propertyType !== "All",
    filters.occupancy.length > 0,
  ].filter(Boolean).length;

  return (
    <div className="px-4 pb-2">
      {/* Search bar */}
      <div ref={boxRef} className="mb-2">
        <div className="relative">
          <input
            className="w-full bg-gray-800 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Search by name or area..."
            value={filters.search}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              update({ search: e.target.value, area: null });
              setOpen(true);
              setHighlight(-1);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setOpen(true);
                setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlight((h) => Math.max(h - 1, -1));
              } else if (e.key === "Enter") {
                if (highlight >= 0 && suggestions[highlight]) {
                  e.preventDefault();
                  pick(suggestions[highlight]);
                } else {
                  setOpen(false);
                  (e.target as HTMLInputElement).blur();
                }
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
          />
          <span className="absolute left-2.5 top-2.5 text-gray-500 text-sm">🔍</span>
        </div>

        {open && suggestions.length > 0 && (
          <div
            role="listbox"
            className="mt-1 max-h-56 overflow-y-auto rounded-lg bg-gray-800 shadow-lg ring-1 ring-white/10"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {suggestions.map((s, i) => (
              <button
                key={s.key}
                role="option"
                aria-selected={i === highlight}
                onClick={() => pick(s)}
                className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm ${
                  i === highlight ? "bg-gray-700" : "hover:bg-gray-700"
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-white">
                    {s.kind === "area" ? "📍 " : "🏢 "}
                    {s.label}
                  </span>
                  <span className="block text-xs text-gray-400">{s.kind === "area" ? "Area" : "Apartment"}</span>
                </span>
                <span className="flex-shrink-0 text-xs text-gray-400">
                  {s.kind === "area"
                    ? s.count > 0
                      ? `${s.count} within 2.5 km`
                      : "none nearby yet"
                    : `${s.count} listing${s.count === 1 ? "" : "s"}`}
                </span>
              </button>
            ))}
          </div>
        )}

        {filters.area && (
          <div className="mt-2 flex items-center justify-between rounded-lg bg-gray-800 px-3 py-2 text-xs text-white">
            <span>
              📍 Listings near <b>{filters.area.name}</b>
            </span>
            <button
              onClick={() => update({ area: null })}
              aria-label="Clear area"
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}
        {filters.area && searchNote && <p className="mt-1 text-xs text-yellow-300">{searchNote}</p>}
      </div>

      {/* Filter toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white"
        >
          <span>⚙️ Filters</span>
          {activeCount > 0 && (
            <span className="bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {activeCount}
            </span>
          )}
          <span>{expanded ? "▲" : "▼"}</span>
        </button>
        {activeCount > 0 && (
          <button onClick={reset} className="text-xs text-gray-500 hover:text-orange-400">
            Clear all
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {expanded && (
        <div className="mt-3 space-y-4 bg-gray-900 rounded-xl p-3">

          {/* Property Type */}
          <div>
            <p className="text-xs text-gray-400 mb-2">Property Type</p>
            <div className="flex gap-2">
              {["All", "Apartment", "PG", "Independent House"].map((t) => (
                <button
                  key={t}
                  onClick={() => update({ propertyType: t })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                    filters.propertyType === t
                      ? "bg-orange-500 border-orange-500 text-white"
                      : "bg-gray-800 border-gray-600 text-gray-300"
                  }`}
                >
                  {t === "Independent House" ? "House" : t}
                </button>
              ))}
            </div>
          </div>

          {/* BHK - hide for PG */}
          {filters.propertyType !== "PG" && (
          <div>
            <p className="text-xs text-gray-400 mb-2">BHK</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => toggleBhk(n)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                    filters.bhk.includes(n)
                      ? "bg-orange-500 border-orange-500 text-white"
                      : "bg-gray-800 border-gray-600 text-gray-300"
                  }`}
                >
                  {n} BHK
                </button>
              ))}
            </div>
          </div>
          )}

          {/* Occupancy - PG only */}
          {filters.propertyType === "PG" && (
          <div>
            <p className="text-xs text-gray-400 mb-2">Occupancy</p>
            <div className="flex gap-2">
              {["Single", "Double", "Triple"].map((o) => (
                <button key={o} onClick={() => toggleOccupancy(o)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                    filters.occupancy.includes(o)
                      ? "bg-orange-500 border-orange-500 text-white"
                      : "bg-gray-800 border-gray-600 text-gray-300"
                  }`}>
                  {o}
                </button>
              ))}
            </div>
          </div>
          )}
          {/* Rent range */}
          <div>
            <div className="flex justify-between mb-1">
              <p className="text-xs text-gray-400">Rent Range</p>
              <p className="text-xs text-orange-400">
                ₹{(filters.minRent/1000).toFixed(0)}k – ₹{(filters.maxRent/1000).toFixed(0)}k
              </p>
            </div>
            <div className="space-y-1.5">
              <input
                type="range" min={0} max={200000} step={5000}
                value={filters.minRent}
                onChange={(e) => update({ minRent: Math.min(Number(e.target.value), filters.maxRent - 5000) })}
                className="w-full accent-orange-500"
              />
              <input
                type="range" min={0} max={200000} step={5000}
                value={filters.maxRent}
                onChange={(e) => update({ maxRent: Math.max(Number(e.target.value), filters.minRent + 5000) })}
                className="w-full accent-orange-500"
              />
            </div>
          </div>

          {/* Furnishing */}
          <div>
            <p className="text-xs text-gray-400 mb-2">Furnishing</p>
            <div className="flex gap-2">
              {["Unfurnished", "Semi", "Fully Furnished"].map((f) => (
                <button
                  key={f}
                  onClick={() => toggleFurnishing(f)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                    filters.furnishing.includes(f)
                      ? "bg-orange-500 border-orange-500 text-white"
                      : "bg-gray-800 border-gray-600 text-gray-300"
                  }`}
                >
                  {f === "Fully Furnished" ? "Full" : f}
                </button>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
