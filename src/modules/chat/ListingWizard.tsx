import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "@/components/ui/AuthModal";

const PROJECTS = [
  "Embassy Lake Terraces", "RMZ Latitude", "Godrej Woodman Estate",
  "SNN Clermont", "Karle Zenith Residences", "Other",
];

const AMENITY_OPTIONS = [
  "Gym", "Swimming Pool", "Parking", "Security", "Power Backup",
  "Lift", "Club House", "Garden", "CCTV", "Intercom",
  "Water Supply 24/7", "Gas Pipeline", "Pet Friendly", "Visitor Parking",
];

const inp = "w-full bg-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500";

export default function ListingWizard({ onClose, onSuccess }: {
  onClose?: () => void;
  onSuccess?: () => void;
}) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [showAuth, setShowAuth] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [customProject, setCustomProject] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [geoStatus, setGeoStatus] = useState("");

  const [form, setForm] = useState({
    address: "", rent: "", deposit: "", bhk: "2",
    area_sqft: "", furnishing: "Semi", description: "",
    latitude: "", longitude: "", media_urls: "",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const toggleAmenity = (a: string) =>
    setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const handleGeocode = async () => {
    if (!form.address) return;
    setGeoStatus("Searching...");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(form.address + ", Bangalore")}&format=json&limit=1`
      );
      const data = await res.json();
      if (data[0]) {
        set("latitude", data[0].lat);
        set("longitude", data[0].lon);
        setGeoStatus(`✓ Found: ${parseFloat(data[0].lat).toFixed(4)}, ${parseFloat(data[0].lon).toFixed(4)}`);
      } else {
        setGeoStatus("Not found. Try a more specific address.");
      }
    } catch { setGeoStatus("Geocoding failed."); }
  };

  const saveProperty = async () => {
    if (!user) return;
    setSaving(true);
    setError("");
    console.log("Attempting insert, user:", user?.id);
    const { data: insertData, error: err } = await supabase.from("properties").insert({
      title: selectedProject === "Other" ? customProject : selectedProject,
      address: form.address,
      rent: parseInt(form.rent) || 0,
      deposit: parseInt(form.deposit) || null,
      bhk: parseInt(form.bhk),
      area_sqft: parseInt(form.area_sqft) || null,
      furnishing: form.furnishing,
      description: form.description,
      latitude: parseFloat(form.latitude) || null,
      longitude: parseFloat(form.longitude) || null,
      amenities,
      media_urls: form.media_urls.split("\n").filter(u => u.trim()),
      landlord_id: user.id,
    });
    setSaving(false);
    console.log("Insert result - data:", insertData, "error:", err);
    if (err) { setError(err.message); return; }
    onSuccess?.();
  };

  const handleSubmit = async () => {
    if (!user) { setShowAuth(true); return; }
    await saveProperty();
  };

  useEffect(() => {
    if (user && showAuth) { setShowAuth(false); saveProperty(); }
  }, [user]);

  const STEPS = ["Property", "Pricing", "Details", "Amenities", "Location"];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-gray-900 text-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="font-bold text-lg">List Your Property</h2>
          {onClose && <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>}
        </div>

        {/* Progress */}
        <div className="flex px-6 pt-4 gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1 rounded-full ${i < step ? "bg-orange-500" : "bg-gray-700"}`} />
              <p className={`text-xs mt-1 ${i + 1 === step ? "text-orange-400" : "text-gray-500"}`}>{s}</p>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">

          {/* Step 1: Property */}
          {step === 1 && (
            <>
              <div>
                <label className="text-sm text-gray-400">Apartment / Project *</label>
                <select className={inp + " mt-1"} value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
                  <option value="">Select...</option>
                  {PROJECTS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              {selectedProject === "Other" && (
                <div>
                  <label className="text-sm text-gray-400">Apartment Name *</label>
                  <input className={inp + " mt-1"} placeholder="Enter name" value={customProject} onChange={e => setCustomProject(e.target.value)} />
                </div>
              )}
              <div>
                <label className="text-sm text-gray-400">Full Address *</label>
                <div className="flex gap-2 mt-1">
                  <input className={inp + " flex-1"} placeholder="e.g. Embassy Lake Terraces, Hebbal" value={form.address} onChange={e => set("address", e.target.value)} />
                  <button onClick={handleGeocode} className="bg-orange-500 hover:bg-orange-600 px-3 rounded-lg text-sm font-medium">Pin</button>
                </div>
                {geoStatus && <p className={`text-xs mt-1 ${geoStatus.startsWith("✓") ? "text-green-400" : "text-yellow-400"}`}>{geoStatus}</p>}
              </div>
            </>
          )}

          {/* Step 2: Pricing */}
          {step === 2 && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-400">Monthly Rent (₹) *</label>
                <input type="number" className={inp + " mt-1"} placeholder="e.g. 35000" value={form.rent} onChange={e => set("rent", e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-gray-400">Deposit (₹)</label>
                <input type="number" className={inp + " mt-1"} placeholder="e.g. 100000" value={form.deposit} onChange={e => set("deposit", e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-gray-400">BHK *</label>
                <select className={inp + " mt-1"} value={form.bhk} onChange={e => set("bhk", e.target.value)}>
                  {["1","2","3","4","5"].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400">Area (sqft)</label>
                <input type="number" className={inp + " mt-1"} placeholder="e.g. 1200" value={form.area_sqft} onChange={e => set("area_sqft", e.target.value)} />
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {step === 3 && (
            <>
              <div>
                <label className="text-sm text-gray-400">Furnishing</label>
                <div className="flex gap-2 mt-2">
                  {["Unfurnished","Semi","Fully Furnished"].map(f => (
                    <button key={f} onClick={() => set("furnishing", f)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border ${form.furnishing === f ? "bg-orange-500 border-orange-500 text-white" : "bg-gray-800 border-gray-600 text-gray-300"}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400">Description</label>
                <textarea className={inp + " mt-1 h-28 resize-none"} placeholder="Lake view, quiet floor, near metro..." value={form.description} onChange={e => set("description", e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-gray-400">Photo URLs (one per line)</label>
                <textarea className={inp + " mt-1 h-20 resize-none text-sm"} placeholder={"https://i.imgur.com/photo1.jpg\nhttps://i.imgur.com/photo2.jpg"} value={form.media_urls} onChange={e => set("media_urls", e.target.value)} />
              </div>
            </>
          )}

          {/* Step 4: Amenities */}
          {step === 4 && (
            <div>
              <label className="text-sm text-gray-400 mb-3 block">Select all that apply</label>
              <div className="grid grid-cols-2 gap-2">
                {AMENITY_OPTIONS.map(a => (
                  <button key={a} onClick={() => toggleAmenity(a)}
                    className={`py-2 px-3 rounded-lg text-sm text-left border ${amenities.includes(a) ? "bg-orange-500/20 border-orange-500 text-orange-300" : "bg-gray-800 border-gray-600 text-gray-300"}`}>
                    {amenities.includes(a) ? "✓ " : ""}{a}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Confirm */}
          {step === 5 && (
            <div className="space-y-2 text-sm">
              <p className="text-gray-400 mb-3">Review before publishing:</p>
              <div className="bg-gray-800 rounded-lg p-4 space-y-2">
                <p><span className="text-gray-400">Property:</span> {selectedProject === "Other" ? customProject : selectedProject}</p>
                <p><span className="text-gray-400">Address:</span> {form.address}</p>
                <p><span className="text-gray-400">Rent:</span> ₹{parseInt(form.rent).toLocaleString()}/mo</p>
                <p><span className="text-gray-400">BHK:</span> {form.bhk} BHK · {form.furnishing}</p>
                {form.area_sqft && <p><span className="text-gray-400">Area:</span> {form.area_sqft} sqft</p>}
                {amenities.length > 0 && <p><span className="text-gray-400">Amenities:</span> {amenities.join(", ")}</p>}
                {geoStatus.startsWith("✓") && <p className="text-green-400 text-xs">📍 Location pinned</p>}
              </div>
              {error && <p className="text-red-400">{error}</p>}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex justify-between">
          <button onClick={() => step === 1 ? onClose?.() : setStep(s => s - 1)} className="text-gray-400 hover:text-white px-4 py-2">
            {step === 1 ? "Cancel" : "← Back"}
          </button>
          {step < 5 ? (
            <button onClick={() => setStep(s => s + 1)} className="bg-orange-500 hover:bg-orange-600 px-6 py-2 rounded-lg font-semibold">
              Next →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving} className="bg-green-500 hover:bg-green-600 disabled:opacity-40 px-6 py-2 rounded-lg font-semibold">
              {saving ? "Publishing..." : "🏠 Publish Listing"}
            </button>
          )}
        </div>
      </div>
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}
