import { useSyncExternalStore } from "react";

// The last 10 listings the person looked at. Saved on this device only (localStorage).
const KEY = "ehh_recent_v1";
const MAX = 10;

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

let cache: string[] = read();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function write(ids: string[]) {
  cache = ids;
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // private mode or storage full: keep it in memory for this visit
  }
  emit();
}

export function addRecent(id: string) {
  if (!id || cache[0] === id) return;
  write([id, ...cache.filter((x) => x !== id)].slice(0, MAX));
}

export function clearRecent() {
  write([]);
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      cache = read();
      emit();
    }
  });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export const useRecentIds = () => useSyncExternalStore(subscribe, () => cache, () => cache);
