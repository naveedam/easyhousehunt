import { useSyncExternalStore } from "react";
import type { Property } from "@/types/property";

// A tiny shared store so the search box (desktop sidebar and mobile sheet) can see
// the full, unfiltered listings without threading props through every layout.
type State = { properties: Property[]; note: string | null };

let state: State = { properties: [], note: null };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export function setSearchableProperties(properties: Property[]) {
  if (state.properties === properties) return;
  state = { ...state, properties };
  emit();
}

export function setSearchNote(note: string | null) {
  if (state.note === note) return;
  state = { ...state, note };
  emit();
}

export const useSearchableProperties = () =>
  useSyncExternalStore(subscribe, () => state.properties, () => state.properties);

export const useSearchNote = () =>
  useSyncExternalStore(subscribe, () => state.note, () => state.note);

// Lets components outside App (e.g. the Recently viewed list) open a listing the way a list tap does
let selectHandler: ((p: Property) => void) | null = null;
export const setPropertySelectHandler = (h: ((p: Property) => void) | null) => {
  selectHandler = h;
};
export const selectProperty = (p: Property) => selectHandler?.(p);
