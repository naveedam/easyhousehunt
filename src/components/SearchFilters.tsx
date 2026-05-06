import { useState } from "react";

export interface Filters {
  bhk: number[];
  minRent: number;
  maxRent: number;
  furnishing: string[];
  search: string;
  propertyType: string;
}

const DEFAULT_FILTERS: Filters = {
  bhk: [],
  minRent: 0,
  maxRent: 200000,
  furnishing: [],
  search: "",
  propertyType: "All",
};

export default function SearchFilters({
  onChange,
}: {
  onChange: (f: Filters) => void;
}) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [expanded, setExpanded] = useState(false);

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

  const reset = () => {
    setFilters(DEFAULT_FILTERS);
    onChange(DEFAULT_FILTERS);
  };

  const activeCount = [
    filters.bhk.length > 0,
    filters.furnishing.length > 0,
    filters.minRent > 0 || filters.maxRent < 200000,
    filters.propertyType !== "All",
  ].filter(Boolean).length;

  return (
    <div className="px-4 pb-2">
      {/* Search bar */}
      <div className="relative mb-2">
        <input
          className="w-full bg-gray-800 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Search by name or area..."
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
        />
        <span className="absolute left-2.5 top-2.5 text-gray-500 text-sm">🔍</span>
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
