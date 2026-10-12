import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  bumpMessages,
  dismissToast,
  getActiveThread,
  openMessages,
  setUnread,
  showToast,
  threadKey,
  useToast,
  useUnread,
} from "@/lib/messageStore";

// Mounted once for the whole app. Listens for new messages and read receipts (Supabase Realtime),
// keeps the unread count, shows a toast for new messages, and puts the count in the tab title.
export default function MessageNotifier() {
  const { user } = useAuth();
  const unread = useUnread();
  const toast = useToast();
  const baseTitle = useRef(typeof document !== "undefined" ? document.title : "");

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    const uid = user.id;
    let timer: number | undefined;

    const refreshUnread = async () => {
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", uid)
        .not("read", "is", true);
      setUnread(count ?? 0);
    };

    const scheduleRefresh = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(refreshUnread, 300);
    };

    const onChange = () => {
      bumpMessages();
      scheduleRefresh();
    };

    const onIncoming = async (payload: any) => {
      onChange();
      const m = payload?.new;
      if (!m || getActiveThread() === threadKey(m.property_id, m.sender_id)) return;
      let title = "";
      try {
        const { data } = await supabase
          .from("properties")
          .select("title")
          .eq("id", m.property_id)
          .maybeSingle();
        title = data?.title || "";
      } catch {
        // the toast still works without the title
      }
      showToast([m.sender_name, title].filter(Boolean).join(" · ") || "Tap to read it");
    };

    const channel = supabase
      .channel(`messages-${uid}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${uid}` }, onIncoming)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `sender_id=eq.${uid}` }, onChange)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `receiver_id=eq.${uid}` }, onChange)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `sender_id=eq.${uid}` }, onChange)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") refreshUnread();
      });

    // Catch up after the tab was in the background or the connection dropped
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        bumpMessages();
        refreshUnread();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    refreshUnread();

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(dismissToast, 6000);
    return () => window.clearTimeout(t);
  }, [toast?.id]);

  useEffect(() => {
    document.title = unread > 0 ? `(${unread}) ${baseTitle.current}` : baseTitle.current;
  }, [unread]);

  if (!user) return null;

  return (
    <>
      {unread > 0 && !toast && (
        <button
          type="button"
          onClick={() => openMessages()}
          className="fixed left-1/2 top-3 z-40 -translate-x-1/2 rounded-full bg-orange-500 px-4 py-1.5 text-xs font-semibold text-white shadow-lg hover:bg-orange-600"
        >
          💬 {unread} unread message{unread === 1 ? "" : "s"}
        </button>
      )}
      {toast && (
        <button
          type="button"
          onClick={() => {
            dismissToast();
            openMessages();
          }}
          className="fixed left-1/2 top-3 z-[80] w-[92%] max-w-sm -translate-x-1/2 rounded-xl bg-gray-900 px-4 py-3 text-left text-white shadow-2xl ring-1 ring-white/15"
        >
          <span className="block text-sm font-semibold">💬 New message</span>
          <span className="block truncate text-xs text-gray-300">{toast.text}</span>
        </button>
      )}
    </>
  );
}
