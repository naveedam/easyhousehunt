import { useSyncExternalStore } from "react";

type Toast = { id: number; text: string };
type State = { unread: number; version: number; toast: Toast | null };

let state: State = { unread: 0, version: 0, toast: null };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export function setUnread(n: number) {
  if (state.unread === n) return;
  state = { ...state, unread: n };
  emit();
}

// Bumped whenever a message is added or marked read; open screens reload when it changes
export function bumpMessages() {
  state = { ...state, version: state.version + 1 };
  emit();
}

export function showToast(text: string) {
  state = { ...state, toast: { id: Date.now(), text } };
  emit();
}

export function dismissToast() {
  if (!state.toast) return;
  state = { ...state, toast: null };
  emit();
}

export const useUnread = () =>
  useSyncExternalStore(subscribe, () => state.unread, () => state.unread);
export const useMessageVersion = () =>
  useSyncExternalStore(subscribe, () => state.version, () => state.version);
export const useToast = () =>
  useSyncExternalStore(subscribe, () => state.toast, () => state.toast);

// The conversation that is open on screen right now, so its new messages don't also pop a toast
let activeThread: string | null = null;
export const threadKey = (propertyId: string, otherId: string) => `${propertyId}:${otherId}`;
export const setActiveThread = (key: string | null) => {
  activeThread = key;
};
export const getActiveThread = () => activeThread;

// Lets the notification toast and pill open the Messages screen owned by App
let openMessagesHandler: (() => void) | null = null;
export const setMessagesOpenHandler = (h: (() => void) | null) => {
  openMessagesHandler = h;
};
export const openMessages = () => openMessagesHandler?.();
