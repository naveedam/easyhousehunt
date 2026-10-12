import { useEffect, useMemo, useState } from "react";
import EditListingModal from "@/components/EditListingModal";
import ChatModal from "@/modules/chat/ChatModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMessageVersion, useUnread } from "@/lib/messageStore";

type Tab = "messages" | "listings" | "saved";

type Convo = { otherId: string; name: string; count: number; unread: number; last: string };
type Group = {
  propertyId: string;
  title: string;
  role: "owner" | "tenant";
  convos: Convo[];
  unread: number;
  last: string;
};

const when = (iso: string) => {
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString();
};

export default function OwnerDashboard({
  onClose,
  initialTab = "listings",
}: {
  onClose: () => void;
  initialTab?: Tab;
}) {
  const { user } = useAuth();
  const unread = useUnread();
  const version = useMessageVersion();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [rows, setRows] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [saved, setSaved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openProp, setOpenProp] = useState<string | null>(null);
  const [chat, setChat] = useState<{ propertyId: string; title: string; otherId: string; otherLabel: string } | null>(null);
  const [editListing, setEditListing] = useState<any>(null);

  // Message text is not loaded here on purpose: this screen only shows who and how many
  const loadMessages = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("messages")
      .select("id, property_id, sender_id, receiver_id, sender_name, created_at, read, properties(title, landlord_id)")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(1000);
    setRows((data as any[]) || []);
  };

  const loadListings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("properties")
      .select("id, title, rent, bhk, address, created_at, status, rejection_reason")
      .eq("market", "india")
      .eq("landlord_id", user.id)
      .order("created_at", { ascending: false });
    setListings((data as any[]) || []);
  };

  const loadSaved = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("saved_properties")
      .select("*, properties(id, title, rent, bhk, address)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setSaved((data as any[]) || []);
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      await Promise.all([loadMessages(), loadListings(), loadSaved()]);
      setLoading(false);
    })();
  }, [user?.id]);

  // New messages and read receipts arrive live
  useEffect(() => {
    if (user) void loadMessages();
  }, [version]);

  const groups = useMemo<Group[]>(() => {
    if (!user) return [];
    const byProp = new Map<string, Group>();
    const convoMaps = new Map<string, Map<string, Convo>>();
    for (const m of rows) {
      if (!m.property_id) continue;
      const prop = m.properties;
      const iOwn = !!prop && prop.landlord_id === user.id;
      const otherId: string | null = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      if (!otherId) continue;
      let g = byProp.get(m.property_id);
      if (!g) {
        g = {
          propertyId: m.property_id,
          title: prop?.title || "Listing no longer available",
          role: iOwn ? "owner" : "tenant",
          convos: [],
          unread: 0,
          last: m.created_at,
        };
        byProp.set(m.property_id, g);
        convoMaps.set(m.property_id, new Map());
      }
      const cm = convoMaps.get(m.property_id)!;
      let c = cm.get(otherId);
      if (!c) {
        c = { otherId, name: "", count: 0, unread: 0, last: m.created_at };
        cm.set(otherId, c);
        g.convos.push(c);
      }
      c.count += 1;
      if (!c.name && m.sender_id === otherId && m.sender_name) c.name = m.sender_name;
      if (m.receiver_id === user.id && !m.read) {
        c.unread += 1;
        g.unread += 1;
      }
    }
    return Array.from(byProp.values()); // newest activity first, because rows are newest first
  }, [rows, user?.id]);

  const group = groups.find((g) => g.propertyId === openProp) || null;

  const deleteListing = async (id: string) => {
    if (!confirm("Delete this listing?")) return;
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) {
      alert("Could not delete: " + error.message);
      return;
    }
    setListings((prev) => prev.filter((l) => l.id !== id));
  };

  const TABS: { key: Tab; label: string; count: number; hot?: boolean }[] = [
    { key: "messages", label: "Messages", count: unread > 0 ? unread : groups.length, hot: unread > 0 },
    { key: "listings", label: "My Listings", count: listings.length },
    { key: "saved", label: "Saved", count: saved.length },
  ];

  const convoName = (g: Group, c: Convo) => (g.role === "owner" ? c.name || "Tenant" : "Owner");

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
        <div>
          <h1 className="font-bold text-lg">My Dashboard</h1>
          <p className="text-xs text-gray-400">{user?.email}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              if (t.key !== "messages") setOpenProp(null);
            }}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 ${tab === t.key ? "text-orange-400 border-b-2 border-orange-400" : "text-gray-400"}`}
          >
            {t.label}
            <span className={`text-xs rounded-full px-1.5 ${t.hot || tab === t.key ? "bg-orange-500 text-white" : "bg-gray-700 text-gray-300"}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full">
          {loading ? (
            <p className="text-gray-400 p-4">Loading...</p>
          ) : (
            <>
              {/* MESSAGES: properties first, then the conversations inside one */}
              {tab === "messages" && !group && (
                <div className="p-4 space-y-3">
                  {groups.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <p className="text-4xl mb-2">📭</p>
                      <p>No messages yet</p>
                      <p className="text-sm text-gray-500 mt-1">Enquiries about your listings, and your own enquiries, appear here.</p>
                    </div>
                  ) : (
                    groups.map((g) => (
                      <button
                        key={g.propertyId}
                        onClick={() => setOpenProp(g.propertyId)}
                        className="w-full text-left bg-gray-800 hover:bg-gray-700 rounded-xl p-4 flex items-center gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold truncate">{g.title}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${g.role === "owner" ? "bg-green-900 text-green-400" : "bg-blue-900 text-blue-300"}`}>
                              {g.role === "owner" ? "Your listing" : "You enquired"}
                            </span>
                          </div>
                          <p className="text-gray-400 text-xs mt-1">
                            {g.role === "owner"
                              ? `${g.convos.length} enquir${g.convos.length === 1 ? "y" : "ies"}`
                              : "1 conversation"}{" "}
                            · last activity {when(g.last)}
                          </p>
                        </div>
                        {g.unread > 0 && (
                          <span className="bg-orange-500 text-white text-xs rounded-full min-w-[1.25rem] h-5 px-1 flex items-center justify-center">
                            {g.unread}
                          </span>
                        )}
                        <span className="text-gray-500">›</span>
                      </button>
                    ))
                  )}
                </div>
              )}

              {tab === "messages" && group && (
                <div className="p-4 space-y-3">
                  <button onClick={() => setOpenProp(null)} className="text-sm text-orange-400 hover:text-orange-300">
                    ‹ All properties
                  </button>
                  <div>
                    <p className="font-semibold">{group.title}</p>
                    <p className="text-xs text-gray-400">
                      {group.role === "owner" ? "People who enquired about your listing" : "Your conversation with the owner"}
                    </p>
                  </div>
                  {group.convos.map((c) => (
                    <button
                      key={c.otherId}
                      onClick={() =>
                        setChat({
                          propertyId: group.propertyId,
                          title: group.title,
                          otherId: c.otherId,
                          otherLabel: group.role === "owner" ? "Tenant" : "Property owner",
                        })
                      }
                      className="w-full text-left bg-gray-800 hover:bg-gray-700 rounded-xl p-4 flex items-center gap-3"
                    >
                      <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {convoName(group, c)[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">{convoName(group, c)}</p>
                        <p className="text-gray-400 text-xs">
                          {c.count} message{c.count === 1 ? "" : "s"} · last activity {when(c.last)}
                        </p>
                      </div>
                      {c.unread > 0 && (
                        <span className="bg-orange-500 text-white text-xs rounded-full min-w-[1.25rem] h-5 px-1 flex items-center justify-center">
                          {c.unread}
                        </span>
                      )}
                      <span className="text-gray-500">›</span>
                    </button>
                  ))}
                </div>
              )}

              {/* MY LISTINGS */}
              {tab === "listings" && (
                <div className="p-4 space-y-3">
                  {listings.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <p className="text-4xl mb-2">🏠</p>
                      <p>No listings yet</p>
                    </div>
                  ) : (
                    listings.map((l) => (
                      <div key={l.id} className="bg-gray-800 rounded-xl p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold">{l.title}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${l.status === "approved" ? "bg-green-900 text-green-400" : l.status === "rejected" ? "bg-red-900 text-red-400" : "bg-yellow-900 text-yellow-300"}`}>
                                {l.status === "approved" ? "Live" : l.status === "rejected" ? "Not approved" : "Pending review"}
                              </span>
                            </div>
                            <p className="text-green-400 font-bold">₹{l.rent?.toLocaleString()}/mo</p>
                            {l.status === "pending" && <p className="text-yellow-400 text-xs mt-1">Waiting for review. Not visible on the map yet.</p>}
                            {l.status === "rejected" && (
                              <p className="text-red-400 text-xs mt-1">
                                Not approved{l.rejection_reason ? ": " + l.rejection_reason : ""}. Update the details and save to resubmit.
                              </p>
                            )}
                            <p className="text-gray-400 text-xs mt-1">{l.bhk} BHK · {l.address}</p>
                            <p className="text-gray-500 text-xs mt-1">Listed {new Date(l.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex flex-col gap-1 ml-3">
                            <button onClick={() => setEditListing(l)} className="text-orange-400 hover:text-orange-300 text-xs">✏️ Edit</button>
                            <button onClick={() => deleteListing(l.id)} className="text-red-400 hover:text-red-300 text-xs">🗑 Delete</button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* SAVED */}
              {tab === "saved" && (
                <div className="p-4 space-y-3">
                  {saved.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <p className="text-4xl mb-2">🔖</p>
                      <p>No saved properties</p>
                    </div>
                  ) : (
                    saved.map((s) => (
                      <div key={s.id} className="bg-gray-800 rounded-xl p-4">
                        <p className="font-semibold">{s.properties?.title}</p>
                        <p className="text-green-400 font-bold">₹{s.properties?.rent?.toLocaleString()}/mo</p>
                        <p className="text-gray-400 text-xs mt-1">{s.properties?.bhk} BHK · {s.properties?.address}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {editListing && (
        <EditListingModal
          listing={editListing}
          onClose={() => setEditListing(null)}
          onSaved={() => {
            setEditListing(null);
            void loadListings();
          }}
        />
      )}

      {chat && (
        <ChatModal
          propertyId={chat.propertyId}
          propertyTitle={chat.title}
          receiverId={chat.otherId}
          otherLabel={chat.otherLabel}
          onClose={() => {
            setChat(null);
            void loadMessages();
          }}
        />
      )}
    </div>
  );
}
