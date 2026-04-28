import { useEffect, useState } from "react";
import EditListingModal from "@/components/EditListingModal";
import { supabase } from "@/integrations/supabase/client";

export default function AdminDashboard({ onClose }: { onClose: () => void }) {
  const [listings, setListings] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [tab, setTab] = useState<"listings" | "messages" | "users">("listings");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ listings: 0, messages: 0, users: 0 });
  const [editListing, setEditListing] = useState<any>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);

    const { data: props, count: pCount } = await supabase
      .from("properties")
      .select("id, title, rent, bhk, address, created_at, landlord_id, latitude, longitude", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(100);

    const { data: msgs, count: mCount } = await supabase
      .from("messages")
      .select("*, properties(title)", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(100);

    const { data: profs, count: uCount } = await supabase
      .from("profiles")
      .select("id, email, role, is_admin", { count: "exact" })
      .order("id", { ascending: false })
      .limit(100);

    setListings(props || []);
    setMessages(msgs || []);
    setUsers(profs || []);
    setStats({ listings: pCount || 0, messages: mCount || 0, users: uCount || 0 });
    setLoading(false);
  };

  const deleteListing = async (id: string) => {
    if (!confirm("Delete this listing?")) return;
    await supabase.from("properties").delete().eq("id", id);
    setListings(prev => prev.filter(l => l.id !== id));
    setStats(s => ({ ...s, listings: s.listings - 1 }));
  };

  const deleteMessage = async (id: string) => {
    await supabase.from("messages").delete().eq("id", id);
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const TABS = [
    { key: "listings", label: "Listings", count: stats.listings },
    { key: "messages", label: "Messages", count: stats.messages },
    { key: "users", label: "Users", count: stats.users },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800 bg-gray-900">
        <div>
          <h1 className="font-bold text-lg">⚙️ Admin Dashboard</h1>
          <p className="text-xs text-gray-400">EasyHouseHunt</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-px bg-gray-800">
        {[
          { label: "Listings", value: stats.listings, color: "text-orange-400" },
          { label: "Messages", value: stats.messages, color: "text-blue-400" },
          { label: "Users", value: stats.users, color: "text-green-400" },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 px-4 py-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 ${tab === t.key ? "text-orange-400 border-b-2 border-orange-400" : "text-gray-400"}`}>
            {t.label}
            <span className={`text-xs rounded-full px-1.5 ${tab === t.key ? "bg-orange-500 text-white" : "bg-gray-700 text-gray-300"}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? <p className="text-gray-400">Loading...</p> : (
          <>
            {/* LISTINGS */}
            {tab === "listings" && listings.map(l => (
              <div key={l.id} className="bg-gray-800 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{l.title}</p>
                    <p className="text-green-400 font-bold">₹{l.rent?.toLocaleString()}/mo</p>
                    <p className="text-gray-400 text-xs mt-1 truncate">{l.address}</p>
                    <div className="flex gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${l.latitude ? "bg-green-900 text-green-400" : "bg-red-900 text-red-400"}`}>
                        {l.latitude ? "📍 Pinned" : "No location"}
                      </span>
                      <span className="text-xs text-gray-500">{new Date(l.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 ml-3 flex-shrink-0">
                    <button onClick={() => setEditListing(l)}
                      className="text-orange-400 hover:text-orange-300 text-xs">
                      ✏️
                    </button>
                    <button onClick={() => deleteListing(l.id)}
                      className="text-red-400 hover:text-red-300 text-xs">
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* MESSAGES */}
            {tab === "messages" && messages.map(m => (
              <div key={m.id} className="bg-gray-800 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-orange-400 text-xs font-semibold truncate">{m.properties?.title}</p>
                    {m.sender_name && <p className="text-white text-sm font-medium">{m.sender_name}</p>}
                    {m.sender_phone && <p className="text-gray-400 text-xs">📞 {m.sender_phone}</p>}
                    <p className="text-gray-300 text-sm mt-1">{m.message}</p>
                    <p className="text-gray-500 text-xs mt-1">{new Date(m.created_at).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => deleteMessage(m.id)}
                    className="text-red-400 hover:text-red-300 text-xs ml-3 flex-shrink-0">
                    🗑
                  </button>
                </div>
              </div>
            ))}

            {/* USERS */}
            {tab === "users" && users.map(u => (
              <div key={u.id} className="bg-gray-800 rounded-xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {u.email?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{u.email}</p>
                  <div className="flex gap-2 mt-1">
                    {u.is_admin && <span className="text-xs bg-purple-900 text-purple-300 px-2 py-0.5 rounded-full">Admin</span>}
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">{u.role || "tenant"}</span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      {editListing && (
        <EditListingModal
          listing={editListing}
          adminMode={true}
          onClose={() => setEditListing(null)}
          onSaved={() => { setEditListing(null); fetchAll(); }}
        />
      )}
    </div>
  );
}
