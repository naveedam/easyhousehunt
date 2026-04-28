import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function TenantDashboard({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [tab, setTab] = useState<"saved" | "enquiries" | "recent">("saved");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);

    const { data: saves } = await supabase
      .from("saved_properties")
      .select("*, properties(id, title, rent, bhk, address, furnishing)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const { data: enqs } = await supabase
      .from("messages")
      .select("*, properties(title)")
      .eq("sender_id", user.id)
      .order("created_at", { ascending: false });

    setSaved(saves || []);
    setEnquiries(enqs || []);
    setLoading(false);
  };

  const unsaveProperty = async (id: string) => {
    await supabase.from("saved_properties").delete().eq("id", id);
    setSaved(prev => prev.filter(s => s.id !== id));
  };

  const TABS = [
    { key: "saved", label: "Saved", count: saved.length },
    { key: "enquiries", label: "Enquiries", count: enquiries.length },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 text-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
        <div>
          <h1 className="font-bold text-lg">My Dashboard</h1>
          <p className="text-xs text-gray-400">{user?.email}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
      </div>

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

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? <p className="text-gray-400">Loading...</p> : (
          <>
            {tab === "saved" && (
              saved.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-4xl mb-2">🔖</p>
                  <p>No saved properties yet</p>
                  <p className="text-sm mt-1">Tap the bookmark on any listing to save it</p>
                </div>
              ) : saved.map(s => (
                <div key={s.id} className="bg-gray-800 rounded-xl p-4 flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{s.properties?.title}</p>
                    <p className="text-green-400 font-bold">₹{s.properties?.rent?.toLocaleString()}/mo</p>
                    <p className="text-gray-400 text-xs mt-1">{s.properties?.bhk} BHK · {s.properties?.furnishing}</p>
                    <p className="text-gray-500 text-xs truncate">{s.properties?.address}</p>
                  </div>
                  <button onClick={() => unsaveProperty(s.id)} className="text-gray-500 hover:text-red-400 text-lg ml-2">🔖</button>
                </div>
              ))
            )}

            {tab === "enquiries" && (
              enquiries.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-4xl mb-2">💬</p>
                  <p>No enquiries sent yet</p>
                </div>
              ) : enquiries.map(e => (
                <div key={e.id} className="bg-gray-800 rounded-xl p-4">
                  <p className="text-orange-400 text-xs font-semibold">{e.properties?.title}</p>
                  <p className="text-gray-300 text-sm mt-1">{e.message}</p>
                  <p className="text-gray-500 text-xs mt-1">{new Date(e.created_at).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
