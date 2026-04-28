import { useEffect, useState } from "react";
import EditListingModal from "@/components/EditListingModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Listing {
  id: string;
  title: string;
  rent: number;
  bhk: number;
  address: string;
  created_at: string;
  is_active: boolean;
  enquiry_count?: number;
}

export default function OwnerDashboard({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [saved, setSaved] = useState<any[]>([]);
  const [tab, setTab] = useState<"listings" | "enquiries" | "saved">("listings");
  const [loading, setLoading] = useState(true);
  const [editListing, setEditListing] = useState<any>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);

    const { data: props } = await supabase
      .from("properties")
      .select("id, title, rent, bhk, address, created_at")
      .eq("landlord_id", user.id)
      .order("created_at", { ascending: false });

    const { data: enqs } = await supabase
      .from("messages")
      .select("*, properties(title)")
      .eq("receiver_id", user.id)
      .order("created_at", { ascending: false });

    const { data: saves } = await supabase
      .from("saved_properties")
      .select("*, properties(id, title, rent, bhk, address)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setListings(props || []);
    setEnquiries(enqs || []);
    setSaved(saves || []);
    setLoading(false);
  };

  const deleteListing = async (id: string) => {
    if (!confirm("Delete this listing?")) return;
    await supabase.from("properties").delete().eq("id", id);
    setListings(prev => prev.filter(l => l.id !== id));
  };

  const TABS = [
    { key: "listings", label: "My Listings", count: listings.length },
    { key: "enquiries", label: "Enquiries", count: enquiries.length },
    { key: "saved", label: "Saved", count: saved.length },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
        <div>
          <h1 className="font-bold text-lg">Owner Dashboard</h1>
          <p className="text-xs text-gray-400">{user?.email}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
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
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="text-gray-400 p-4">Loading...</p>
        ) : (
          <>
            {/* LISTINGS TAB */}
            {tab === "listings" && (
              <div className="p-4 space-y-3">
                {listings.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-4xl mb-2">🏠</p>
                    <p>No listings yet</p>
                  </div>
                ) : listings.map(l => (
                  <div key={l.id} className="bg-gray-800 rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold">{l.title}</p>
                        <p className="text-green-400 font-bold">₹{l.rent?.toLocaleString()}/mo</p>
                        <p className="text-gray-400 text-xs mt-1">{l.bhk} BHK · {l.address}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          Listed {new Date(l.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 ml-3">
                        <button onClick={() => setEditListing(l)}
                          className="text-orange-400 hover:text-orange-300 text-xs">
                          ✏️ Edit
                        </button>
                        <button onClick={() => deleteListing(l.id)}
                          className="text-red-400 hover:text-red-300 text-xs">
                          🗑 Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ENQUIRIES TAB */}
            {tab === "enquiries" && (
              <div className="p-4 space-y-3">
                {enquiries.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-4xl mb-2">📭</p>
                    <p>No enquiries yet</p>
                  </div>
                ) : enquiries.map(e => (
                  <div key={e.id} className="bg-gray-800 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-orange-400 text-xs font-semibold">{e.properties?.title}</p>
                      <p className="text-gray-500 text-xs">{new Date(e.created_at).toLocaleDateString()}</p>
                    </div>
                    {e.sender_name && <p className="text-white text-sm font-medium">{e.sender_name}</p>}
                    {e.sender_phone && <p className="text-gray-400 text-xs">📞 {e.sender_phone}</p>}
                    <p className="text-gray-300 text-sm mt-1">{e.message}</p>
                  </div>
                ))}
              </div>
            )}

            {/* SAVED TAB */}
            {tab === "saved" && (
              <div className="p-4 space-y-3">
                {saved.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-4xl mb-2">🔖</p>
                    <p>No saved properties</p>
                  </div>
                ) : saved.map(s => (
                  <div key={s.id} className="bg-gray-800 rounded-xl p-4">
                    <p className="font-semibold">{s.properties?.title}</p>
                    <p className="text-green-400 font-bold">₹{s.properties?.rent?.toLocaleString()}/mo</p>
                    <p className="text-gray-400 text-xs mt-1">{s.properties?.bhk} BHK · {s.properties?.address}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      {editListing && (
        <EditListingModal
          listing={editListing}
          onClose={() => setEditListing(null)}
          onSaved={() => { setEditListing(null); fetchAll(); }}
        />
      )}
    </div>
  );
}
