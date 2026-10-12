import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

// The listings this person has saved with the heart, kept in sync with the saved_properties table
type State = { userId: string | null; ids: Set<string> };

let state: State = { userId: null, ids: new Set() };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const update = (next: State) => {
  state = next;
  emit();
};

export async function syncSavedForUser(userId: string | null) {
  if (!userId) {
    update({ userId: null, ids: new Set() });
    return;
  }
  update({ userId, ids: new Set() });
  const { data, error } = await supabase.from("saved_properties").select("property_id").eq("user_id", userId);
  if (error) {
    console.error("Could not load saved listings:", error.message);
    return;
  }
  if (state.userId !== userId) return; // signed out or switched account while loading
  update({ userId, ids: new Set((data || []).map((r: any) => String(r.property_id))) });
}

// App registers this, so tapping the heart while signed out opens the sign-in dialog
let signInHandler: (() => void) | null = null;
export const setSignInRequestHandler = (h: (() => void) | null) => {
  signInHandler = h;
};

const busy = new Set<string>();

export async function toggleSaved(propertyId: string) {
  const uid = state.userId;
  if (!uid) {
    signInHandler?.();
    return;
  }
  if (busy.has(propertyId)) return;
  busy.add(propertyId);

  const wasSaved = state.ids.has(propertyId);
  const next = new Set(state.ids);
  if (wasSaved) next.delete(propertyId);
  else next.add(propertyId);
  update({ userId: uid, ids: next });

  const { error } = wasSaved
    ? await supabase.from("saved_properties").delete().eq("user_id", uid).eq("property_id", propertyId)
    : await supabase.from("saved_properties").insert({ user_id: uid, property_id: propertyId });

  busy.delete(propertyId);
  // "Already saved" (duplicate) is fine
  if (error && (error as any).code !== "23505") {
    console.error("Save failed:", error.message);
    const back = new Set(state.ids);
    if (wasSaved) back.add(propertyId);
    else back.delete(propertyId);
    update({ userId: state.userId, ids: back });
    alert("Could not update your saved listings. Please try again.");
  }
}

export const useIsSaved = (id: string) =>
  useSyncExternalStore(subscribe, () => state.ids.has(id), () => state.ids.has(id));
export const useSavedIds = () =>
  useSyncExternalStore(subscribe, () => state.ids, () => state.ids);
