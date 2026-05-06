import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "@/components/ui/AuthModal";

const PROJECTS = [
  "Embassy Lake Terraces", "RMZ Latitude", "Godrej Woodman Estate",
  "SNN Clermont", "Karle Zenith Residences", "Prestige Lakeside Habitat",
  "Sobha City", "Nikoo Homes", "Brigade Cornerstone Utopia",
  "Purva Atmosphere", "Other",
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
  const [geoFailed, setGeoFailed] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    address: "", rent: "", deposit: "", bhk: "2",
    area_sqft: "", furnishing: "Semi", description: "",
    latitude: "", longitude: "", property_type: "Apartment", occupancy: "Single",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const toggleAmenity = (a: string) =>
    setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

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
      setGeoStatus("");
      setGeoFailed(true);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => f.size < 10 * 1024 * 1024); // 10MB limit
    setPhotos(prev => [...prev, ...valid].slice(0, 6)); // max 6 photos
  };

  const removePhoto = (i: number) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== i));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (photos.length === 0) return [];
    setUploading(true);
    const urls: string[] = [];
    for (const photo of photos) {
      const ext = photo.name.split(".").pop();
      const path = `${user!.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from("property-photos")
        .upload(path, photo, { contentType: photo.type });
      if (!error) {
        const { data } = supabase.storage.from("property-photos").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
    }
    setUploading(false);
    return urls;
  };

  const saveProperty = async () => {
    if (!user) return;
    setSaving(true);
    setError("");

    const uploadedUrls = await uploadPhotos();

    const { error: err } = await supabase.from("properties").insert({
      title: form.property_type === "PG" ? customProject : (selectedProject === "Other" ? customProject : selectedProject),
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
      media_urls: uploadedUrls,
      landlord_id: user.id,
      property_type: form.property_type,
      occupancy: form.property_type === "PG" ? form.occupancy : null,
    });

    setSaving(false);
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

  const STEPS = ["Property", "Pricing", "Details", "Amenities", "Photos"];

  const canNext = () => {
    if (step === 1) return selectedProject && form.address && form.latitude;
    if (step === 2) return form.rent;
    return true;
  };

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

          {/* Step 1: Property + Address */}
          {step === 1 && (
            <>
              <div>
                <label className="text-sm text-gray-400">Property Type *</label>
                <div className="flex gap-2 mt-1 mb-3">
                  {["Apartment", "Independent House", "PG"].map(t => (
                    <button key={t} onClick={() => set("property_type", t)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border ${form.property_type === t ? "bg-orange-500 border-orange-500 text-white" : "bg-gray-800 border-gray-600 text-gray-300"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              <label className="text-sm text-gray-400">{form.property_type === "PG" ? "PG Name *" : "Apartment / Project *"}</label>
                {form.property_type === "PG" ? (
                  <input className={inp + " mt-1"} placeholder="e.g. Sri Sai PG, Rajajinagar" value={customProject} onChange={e => setCustomProject(e.target.value)} />
                ) : (
                <select className={inp + " mt-1"} value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
                  <option value="">Select...</option>
                  {PROJECTS.map(p => <option key={p}>{p}</option>)}
                </select>
                )}
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
                  <input
                    className={inp + " flex-1"}
                    placeholder="e.g. Embassy Lake Terraces, Hebbal, Bangalore 560024"
                    value={form.address}
                    onChange={e => { set("address", e.target.value); setGeoFailed(false); setGeoStatus(""); }}
                  />
                  <button onClick={handleGeocode} className="bg-orange-500 hover:bg-orange-600 px-3 rounded-lg text-sm font-medium whitespace-nowrap">
                    Pin 📍
                  </button>
                </div>

                {/* Success */}
                {geoStatus && !geoFailed && (
                  <p className="text-green-400 text-xs mt-1">{geoStatus}</p>
                )}

                {/* Failure tooltip */}
                {geoFailed && (
                  <div className="mt-2 bg-yellow-900/40 border border-yellow-600 rounded-lg p-3 text-xs text-yellow-300 space-y-2">
                    <p className="font-semibold">📍 Could not auto-locate this address.</p>
                    <p>Try these options:</p>
                    <ol className="list-decimal list-inside space-y-1 text-yellow-200">
                      <li>Add pincode to the address (e.g. "Hebbal, Bangalore 560024")</li>
                      <li>
                        Open <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="underline text-orange-400">Google Maps</a>, search your address, right-click → "What's here?" → copy the coordinates
                      </li>
                      <li>Or enable location below to use your current position</li>
                    </ol>
                    <button
                      onClick={() => {
                        if (!navigator.geolocation) return;
                        setGeoStatus("Getting your location...");
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            set("latitude", String(pos.coords.latitude));
                            set("longitude", String(pos.coords.longitude));
                            setGeoStatus(`✓ Using your current location`);
                            setGeoFailed(false);
                          },
                          () => setGeoStatus("Location access denied.")
                        );
                      }}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium mt-1"
                    >
                      📱 Use My Current Location
                    </button>
                    <div className="flex gap-2 mt-1">
                      <input
                        className="flex-1 bg-gray-800 rounded px-2 py-1 text-white text-xs"
                        placeholder="Paste latitude e.g. 13.0358"
                        onChange={e => set("latitude", e.target.value)}
                      />
                      <input
                        className="flex-1 bg-gray-800 rounded px-2 py-1 text-white text-xs"
                        placeholder="Paste longitude e.g. 77.5970"
                        onChange={e => set("longitude", e.target.value)}
                      />
                    </div>
                  </div>
                )}
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
                {form.property_type === "PG" ? (
                  <>
                    <label className="text-sm text-gray-400">Occupancy *</label>
                    <select className={inp + " mt-1"} value={form.occupancy} onChange={e => set("occupancy", e.target.value)}>
                      {["Single", "Double", "Triple"].map(n => <option key={n}>{n}</option>)}
                    </select>
                  </>
                ) : (
                  <>
                    <label className="text-sm text-gray-400">BHK *</label>
                    <select className={inp + " mt-1"} value={form.bhk} onChange={e => set("bhk", e.target.value)}>
                      {["1","2","3","4","5"].map(n => <option key={n}>{n}</option>)}
                    </select>
                  </>
                )}
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
                      {f === "Fully Furnished" ? "Full" : f}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400">Description</label>
                <textarea className={inp + " mt-1 h-28 resize-none"} placeholder="Lake view, quiet floor, near metro..." value={form.description} onChange={e => set("description", e.target.value)} />
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

          {/* Step 5: Photos */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Photos <span className="text-gray-500">(optional, max 6)</span></label>
                <p className="text-xs text-gray-500 mb-3">Good photos get 3x more enquiries. Add photos of living room, bedroom, kitchen, bathroom.</p>

                {/* Upload button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo, i) => (
                    <div key={i} className="relative aspect-square">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt=""
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {photos.length < 6 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-orange-500 hover:text-orange-400"
                    >
                      <span className="text-2xl">📷</span>
                      <span className="text-xs mt-1">Add Photo</span>
                    </button>
                  )}
                </div>

                {/* Source hint */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.removeAttribute("capture");
                        fileInputRef.current.click();
                      }
                    }}
                    className="flex-1 bg-gray-800 border border-gray-600 rounded-lg py-2 text-xs text-gray-300 flex items-center justify-center gap-1"
                  >
                    🖼️ From Gallery
                  </button>
                  <button
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.setAttribute("capture", "environment");
                        fileInputRef.current.click();
                      }
                    }}
                    className="flex-1 bg-gray-800 border border-gray-600 rounded-lg py-2 text-xs text-gray-300 flex items-center justify-center gap-1"
                  >
                    📸 Take Photo
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-800 rounded-lg p-3 text-xs space-y-1">
                <p className="text-gray-400 font-semibold mb-2">Listing Summary</p>
                <p><span className="text-gray-400">Property:</span> <span className="text-white">{selectedProject === "Other" ? customProject : selectedProject}</span></p>
                <p><span className="text-gray-400">Rent:</span> <span className="text-green-400 font-bold">₹{parseInt(form.rent || "0").toLocaleString()}/mo</span></p>
                <p><span className="text-gray-400">BHK:</span> <span className="text-white">{form.bhk} BHK · {form.furnishing}</span></p>
                {form.area_sqft && <p><span className="text-gray-400">Area:</span> <span className="text-white">{form.area_sqft} sqft</span></p>}
                {amenities.length > 0 && <p><span className="text-gray-400">Amenities:</span> <span className="text-white">{amenities.length} selected</span></p>}
                <p><span className="text-gray-400">Photos:</span> <span className="text-white">{photos.length} added</span></p>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex justify-between">
          <button onClick={() => step === 1 ? onClose?.() : setStep(s => s - 1)}
            className="text-gray-400 hover:text-white px-4 py-2">
            {step === 1 ? "Cancel" : "← Back"}
          </button>
          {step < 5 ? (
            <button
              onClick={() => { setError(""); setStep(s => s + 1); }}
              disabled={!canNext()}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-semibold"
            >
              Next →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving || uploading}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-40 px-6 py-2 rounded-lg font-semibold">
              {uploading ? "Uploading..." : saving ? "Publishing..." : "🏠 Publish"}
            </button>
          )}
        </div>
      </div>
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}
