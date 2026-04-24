import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import AuthModal from "@/components/ui/AuthModal";

const SOCIETIES = [
  "Karle Zenith Residences",
  "LNT Raintree Boulevard",
  "Embassy Lake Terraces",
  "Brigade Northridge",
  "Sobha City",
  "Godrej Woodman Estate",
  "RMZ Latitude",
  "Prestige Misty Waters",
  "SNN Clermont",
  "Nikoo Homes",
  "Icon North",
  "Other",
];

export default function ListingWizard() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    society: "",
    customSociety: "",
    address: "",
    rent: "",
    deposit: "",
    bhk: "",
    area_sqft: "",
    furnishing: "",
    description: "",
  });

  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ NEW
  const [showAuth, setShowAuth] = useState(false);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const geocodeAddress = async (address: string) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}`,
      { headers: { "User-Agent": "easyhousehunt-app" } }
    );

    const data = await res.json();

    if (!data || data.length === 0) {
      throw new Error("Geocoding failed");
    }

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  };

  const uploadFiles = async (userId: string) => {
    if (!files || files.length === 0) return [];

    const uploadedUrls: string[] = [];

    for (const file of Array.from(files)) {
      const filePath = `${userId}/${Date.now()}-${file.name}`;

      const { error } = await supabase.storage
        .from("property-media")
        .upload(filePath, file);

      if (error) continue;

      const { data } = supabase.storage
        .from("property-media")
        .getPublicUrl(filePath);

      uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls;
  };

  // ----------------------------
  // SUBMIT (FIXED AUTH FLOW)
  // ----------------------------
  const handleSubmit = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 🔥 FIX
    if (!user) {
      setShowAuth(true);
      setLoading(false);
      return;
    }

    try {
      if (!form.title || !form.address || !form.rent || !form.bhk) {
        alert("Please fill all required fields");
        setLoading(false);
        return;
      }

      const finalSociety =
        form.society === "Other"
          ? form.customSociety
          : form.society;

      const fullAddress = [
        finalSociety,
        form.address,
        "Bangalore",
        "Karnataka",
        "India",
      ]
        .filter(Boolean)
        .join(", ");

      let coords;
      try {
        coords = await geocodeAddress(fullAddress);
      } catch {
        alert("Please enter a more precise address");
        setLoading(false);
        return;
      }

      const jitter = () => (Math.random() - 0.5) * 0.0005;
      coords.lat += jitter();
      coords.lng += jitter();

      const mediaUrls = await uploadFiles(user.id);

      const payload = {
        title: form.title,
        address: `${finalSociety}, ${form.address}`,
        rent: Number(form.rent),
        bhk: Number(form.bhk),
        description: form.description,
        deposit: Number(form.deposit) || 0,
        furnishing: form.furnishing,
        area_sqft: Number(form.area_sqft) || 0,
        amenities: [],
        media_urls: mediaUrls,
        latitude: coords.lat,
        longitude: coords.lng,
        landlord_id: user.id,
      };

      const { error } = await (supabase as any)
        .from("properties")
        .insert([payload]);

      if (error) {
        alert("Error saving property");
        setLoading(false);
        return;
      }

      alert("Property saved!");
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-6 text-white">
      <h1 className="text-2xl mb-6">List Your Property</h1>

      <input name="title" value={form.title} onChange={handleChange} placeholder="Property Title" className="w-full p-3 mb-4 bg-[#1e293b] rounded" />

      <select name="society" value={form.society} onChange={handleChange} className="w-full p-3 mb-4 bg-[#1e293b] rounded">
        <option value="">Select Society</option>
        {SOCIETIES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {form.society === "Other" && (
        <input name="customSociety" value={form.customSociety} onChange={handleChange} placeholder="Enter Society Name" className="w-full p-3 mb-4 bg-[#1e293b] rounded" />
      )}

      <input name="address" value={form.address} onChange={handleChange} placeholder="Full Address" className="w-full p-3 mb-4 bg-[#1e293b] rounded" />
      <input name="rent" value={form.rent} onChange={handleChange} placeholder="Rent (₹ / month)" className="w-full p-3 mb-4 bg-[#1e293b] rounded" />
      <input name="deposit" value={form.deposit} onChange={handleChange} placeholder="Deposit (₹)" className="w-full p-3 mb-4 bg-[#1e293b] rounded" />
      <input name="bhk" value={form.bhk} onChange={handleChange} placeholder="BHK" className="w-full p-3 mb-4 bg-[#1e293b] rounded" />
      <input name="area_sqft" value={form.area_sqft} onChange={handleChange} placeholder="Area (sq ft)" className="w-full p-3 mb-4 bg-[#1e293b] rounded" />
      <input name="furnishing" value={form.furnishing} onChange={handleChange} placeholder="Furnishing" className="w-full p-3 mb-4 bg-[#1e293b] rounded" />

      <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="w-full p-3 mb-4 bg-[#1e293b] rounded" />

      <input type="file" multiple onChange={(e) => setFiles(e.target.files)} className="mb-4" />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className={`w-full p-3 rounded ${loading ? "bg-gray-500" : "bg-green-600 hover:bg-green-700"}`}
      >
        {loading ? "Saving..." : "Save Property"}
      </button>

      {/* 🔥 AUTH MODAL */}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={() => {
            setShowAuth(false);
            handleSubmit();
          }}
        />
      )}
    </div>
  );
}