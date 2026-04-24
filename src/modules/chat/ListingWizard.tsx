import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "@/components/ui/AuthModal";

export default function ListingWizard() {
  const { user } = useAuth();

  const [showAuth, setShowAuth] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  const [form, setForm] = useState({
    title: "",
    address: "",
    rent: "",
    deposit: "",
    bhk: "",
    area: "",
    furnishing: "",
    description: "",
    latitude: "",
    longitude: "",
  });

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const saveProperty = async () => {
    if (!user) return;

    const payload = {
      title: form.title,
      address: form.address,
      rent: Number(form.rent),
      deposit: Number(form.deposit),
      bhk: Number(form.bhk),
      area: Number(form.area),
      furnishing: form.furnishing,
      description: form.description,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      user_id: user.id,
    };

    const { error } = await (supabase as any)
      .from("properties")
      .insert([payload]);

    if (error) {
      console.error("❌ Insert error:", error);
      alert("Failed to save property");
      return;
    }

    alert("✅ Property listed successfully");
  };

  const handleSubmit = async () => {
    if (!user) {
      setShowAuth(true);
      setPendingSubmit(true);
      return;
    }

    await saveProperty();
  };

  // ✅ Resume after login
  useEffect(() => {
    if (user && pendingSubmit) {
      setPendingSubmit(false);
      saveProperty();
    }
  }, [user]);

  return (
    <div className="max-w-xl mx-auto p-6 text-white">
      <h1 className="text-2xl mb-4">List Your Property</h1>

      <input placeholder="Title" onChange={(e) => handleChange("title", e.target.value)} />
      <input placeholder="Full Address" onChange={(e) => handleChange("address", e.target.value)} />
      <input placeholder="Rent" onChange={(e) => handleChange("rent", e.target.value)} />
      <input placeholder="Deposit" onChange={(e) => handleChange("deposit", e.target.value)} />
      <input placeholder="BHK" onChange={(e) => handleChange("bhk", e.target.value)} />
      <input placeholder="Area" onChange={(e) => handleChange("area", e.target.value)} />
      <input placeholder="Furnishing" onChange={(e) => handleChange("furnishing", e.target.value)} />
      <textarea placeholder="Description" onChange={(e) => handleChange("description", e.target.value)} />

      <input placeholder="Latitude" onChange={(e) => handleChange("latitude", e.target.value)} />
      <input placeholder="Longitude" onChange={(e) => handleChange("longitude", e.target.value)} />

      <button
        onClick={handleSubmit}
        className="w-full bg-green-600 mt-4 p-3 rounded"
      >
        Save Property
      </button>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}