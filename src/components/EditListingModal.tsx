import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface EditProps {
  listing: any;
  onClose: () => void;
  onSaved: () => void;
  adminMode?: boolean;
}

const inp = "w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500";

export default function EditListingModal({ listing, onClose, onSaved, adminMode }: EditProps) {
  const [form, setForm] = useState({
    title: listing.title || "",
    rent: String(listing.rent || ""),
    deposit: String(listing.deposit || ""),
    bhk: String(listing.bhk || "2"),
    area_sqft: String(listing.area_sqft || ""),
    furnishing: listing.furnishing || "Semi",
    description: listing.description || "",
    address: listing.address || "",
    latitude: String(listing.latitude || ""),
    longitude: String(listing.longitude || ""),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [geoStatus, setGeoStatus] = useState("");
  const [geoFailed, setGeoFailed] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleGeocode = async () => {
    if (!form.address) return;
    setGeoStatus("Searching...");
    setGeoFailed(false);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(form.address + ", Bangalore")}&format=json&limit=1`
      );
      const data = await res.json();
      if (data[0]) {
        set("latitude", data[0].lat);
        set("longitude", data[0].lon);
        setGeoStatus(`✓ Pinned: ${parseFloat(data[0].lat).toFixed(4)}, ${parseFloat(data[0].lon).toFixed(4)}`);
        setGeoFailed(false);
      } else {
        setGeoStatus("");
        setGeoFailed(true);
      }
    } catch {
      setGeoFailed(true);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const { error: err } = await supabase
      .from("properties")
      .update({
        title: form.title,
        rent: parseInt(form.rent) || 0,
        deposit: parseInt(form.deposit) || null,
        bhk: parseInt(form.bhk),
        area_sqft: parseInt(form.area_sqft) || null,
        furnishing: form.furnishing,
        description: form.description,
        address: form.address,
        latitude: parseFloat(form.latitude) || null,
        longitude: parseFloat(form.longitude) || null,
      })
      .eq("id", listing.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-gray-900 text-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <h2 className="font-bold text-base">
            {adminMode ? "⚙️ Fix Listing" : "✏️ Edit Listing"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Title */}
          <div>
            <label className="text-xs text-gray-400">Title</label>
            <input className={inp + " mt-1"} value={form.title} onChange={e => set("title", e.target.value)} />
          </div>

          {/* Rent + Deposit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400">Rent (₹/mo)</label>
              <input type="number" className={inp + " mt-1"} value={form.rent} onChange={e => set("rent", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-400">Deposit (₹)</label>
              <input type="number" className={inp + " mt-1"} value={form.deposit} onChange={e => set("deposit", e.target.value)} />
            </div>
          </div>

          {/* BHK + Area */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400">BHK</label>
              <select className={inp + " mt-1"} value={form.bhk} onChange={e => set("bhk", e.target.value)}>
                {["1","2","3","4","5"].map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400">Area (sqft)</label>
              <input type="number" className={inp + " mt-1"} value={form.area_sqft} onChange={e => set("area_sqft", e.target.value)} />
            </div>
          </div>

          {/* Furnishing */}
          <div>
            <label className="text-xs text-gray-400">Furnishing</label>
            <div className="flex gap-2 mt-1">
              {["Unfurnished","Semi","Fully Furnished"].map(f => (
                <button key={f} onClick={() => set("furnishing", f)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${form.furnishing === f ? "bg-orange-500 border-orange-500 text-white" : "bg-gray-800 border-gray-600 text-gray-300"}`}>
                  {f === "Fully Furnished" ? "Full" : f}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-gray-400">Description</label>
            <textarea className={inp + " mt-1 h-20 resize-none"} value={form.description} onChange={e => set("description", e.target.value)} />
          </div>

          {/* Address + Pin */}
          <div>
            <label className="text-xs text-gray-400">Address</label>
            <div className="flex gap-2 mt-1">
              <input className={inp + " flex-1"} value={form.address} onChange={e => { set("address", e.target.value); setGeoFailed(false); setGeoStatus(""); }} />
              <button onClick={handleGeocode} className="bg-orange-500 hover:bg-orange-600 px-3 rounded-lg text-xs font-medium whitespace-nowrap">
                Pin 📍
              </button>
            </div>
            {geoStatus && <p className="text-green-400 text-xs mt-1">{geoStatus}</p>}
          </div>

          {/* Location — always shown in admin mode or if no coords */}
          {(adminMode || !listing.latitude || geoFailed) && (
            <div className={`rounded-lg p-3 space-y-2 ${!listing.latitude ? "bg-red-900/30 border border-red-700" : "bg-gray-800"}`}>
              {!listing.latitude && (
                <p className="text-red-400 text-xs font-semibold">⚠️ No location set — listing won't show on map</p>
              )}
              <label className="text-xs text-gray-400 block">Coordinates</label>
              <div className="flex gap-2">
                <input
                  className={inp + " flex-1"}
                  placeholder="Latitude e.g. 13.0358"
                  value={form.latitude}
                  onChange={e => set("latitude", e.target.value)}
                />
                <input
                  className={inp + " flex-1"}
                  placeholder="Longitude e.g. 77.5970"
                  value={form.longitude}
                  onChange={e => set("longitude", e.target.value)}
                />
              </div>
              <button
                onClick={() => {
                  navigator.geolocation?.getCurrentPosition(
                    pos => {
                      set("latitude", String(pos.coords.latitude));
                      set("longitude", String(pos.coords.longitude));
                      setGeoStatus("✓ Using current location");
                    }
                  );
                }}
                className="w-full bg-gray-700 hover:bg-gray-600 text-xs py-2 rounded-lg"
              >
                📱 Use Current Location
              </button>
              <p className="text-xs text-gray-500">
                Or open <a href={`https://maps.google.com/maps?q=${encodeURIComponent(form.address)}`} target="_blank" rel="noreferrer" className="text-orange-400 underline">Google Maps</a> → search address → right click → "What's here?" → copy coords
              </p>
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-700 flex justify-between">
          <button onClick={onClose} className="text-gray-400 hover:text-white px-4 py-2 text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 px-6 py-2 rounded-lg font-semibold text-sm">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
