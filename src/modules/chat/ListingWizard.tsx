import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "@/components/ui/AuthModal";

export default function ListingWizard() {
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [showAuth, setShowAuth] = useState(false);

  // -----------------------------
  // FORM STATE
  // -----------------------------
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [rent, setRent] = useState("");
  const [deposit, setDeposit] = useState("");
  const [bhk, setBhk] = useState("");
  const [area, setArea] = useState("");
  const [furnishing, setFurnishing] = useState("");
  const [description, setDescription] = useState("");

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // -----------------------------
  // GEOCODE ADDRESS
  // -----------------------------
  const geocodeAddress = async () => {
    if (!address) {
      alert("Please enter address first");
      return;
    }

    console.log("🌍 Geocoding:", address);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          address
        )}`
      );

      const data = await res.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);

        setLatitude(lat);
        setLongitude(lon);

        console.log("📍 Coordinates:", lat, lon);
      } else {
        alert("Could not find location");
      }
    } catch (err) {
      console.error("❌ Geocode error:", err);
    }
  };

  // -----------------------------
  // SAVE PROPERTY
  // -----------------------------
  const handleSave = async () => {
    console.log("🟡 Save clicked");

    if (!user) {
      console.log("🔴 Not logged in → show modal");
      setShowAuth(true);
      return;
    }

    if (!latitude || !longitude) {
      alert("Please fetch location from address");
      return;
    }

    console.log("🟢 Saving as:", user.email);

    const { data, error } = await (supabase as any)
      .from("properties")
      .insert([
        {
          title,
          address,
          rent: Number(rent),
          deposit: Number(deposit),
          bhk: Number(bhk),
          area: Number(area),
          furnishing,
          description,
          latitude,
          longitude,
          user_id: user.id,
        },
      ]);

    if (error) {
      console.error("❌ Save error:", error);
      alert(error.message);
      return;
    }

    console.log("✅ Property saved:", data);
    alert("Property listed successfully!");

    // Reset form
    setStep(1);
    setTitle("");
    setAddress("");
    setRent("");
    setDeposit("");
    setBhk("");
    setArea("");
    setFurnishing("");
    setDescription("");
    setLatitude(null);
    setLongitude(null);
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="max-w-xl mx-auto p-6 text-white">
      <h1 className="text-2xl mb-6">List Your Property</h1>

      {/* STEP 1 */}
      {step === 1 && (
        <>
          <input
            placeholder="Title (e.g. 3BHK in Hebbal)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 mb-4 bg-slate-800 rounded"
          />

          <button
            onClick={() => setStep(2)}
            className="w-full bg-blue-600 p-3 rounded"
          >
            Next
          </button>
        </>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <>
          <input
            placeholder="Full Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full p-3 mb-4 bg-slate-800 rounded"
          />

          <button
            onClick={geocodeAddress}
            className="w-full bg-purple-600 p-3 rounded mb-3"
          >
            Get Location
          </button>

          {latitude && (
            <p className="text-green-400 mb-4">
              📍 Location detected
            </p>
          )}

          <button
            onClick={() => setStep(3)}
            className="w-full bg-blue-600 p-3 rounded"
          >
            Next
          </button>
        </>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <>
          <input
            placeholder="Rent"
            value={rent}
            onChange={(e) => setRent(e.target.value)}
            className="w-full p-3 mb-4 bg-slate-800 rounded"
          />

          <input
            placeholder="Deposit"
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
            className="w-full p-3 mb-4 bg-slate-800 rounded"
          />

          <button
            onClick={() => setStep(4)}
            className="w-full bg-blue-600 p-3 rounded"
          >
            Next
          </button>
        </>
      )}

      {/* STEP 4 */}
      {step === 4 && (
        <>
          <input
            placeholder="BHK"
            value={bhk}
            onChange={(e) => setBhk(e.target.value)}
            className="w-full p-3 mb-4 bg-slate-800 rounded"
          />

          <input
            placeholder="Area (sq ft)"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="w-full p-3 mb-4 bg-slate-800 rounded"
          />

          <input
            placeholder="Furnishing"
            value={furnishing}
            onChange={(e) => setFurnishing(e.target.value)}
            className="w-full p-3 mb-4 bg-slate-800 rounded"
          />

          <button
            onClick={() => setStep(5)}
            className="w-full bg-blue-600 p-3 rounded"
          >
            Next
          </button>
        </>
      )}

      {/* STEP 5 */}
      {step === 5 && (
        <>
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 mb-4 bg-slate-800 rounded"
          />

          <button
            onClick={handleSave}
            className="w-full bg-green-600 p-3 rounded"
          >
            Save Property
          </button>
        </>
      )}

      {/* AUTH MODAL */}
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}