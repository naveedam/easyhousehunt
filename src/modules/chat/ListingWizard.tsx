import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "@/components/ui/AuthModal";

export default function ListingWizard() {
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [showAuth, setShowAuth] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  const [selectedProject, setSelectedProject] = useState("");
  const [customProject, setCustomProject] = useState("");

  const projects = [
    "Embassy Lake Terraces",
    "RMZ Latitude",
    "Godrej Woodman Estate",
    "SNN Clermont",
    "Karle Zenith Residences",
    "Other",
  ];

  const [form, setForm] = useState({
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

  const next = () => setStep((s) => Math.min(s + 1, 5));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const saveProperty = async () => {
    if (!user) return;

    const payload = {
      title:
        selectedProject === "Other"
          ? customProject
          : selectedProject,
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

  useEffect(() => {
    if (user && pendingSubmit) {
      setPendingSubmit(false);
      saveProperty();
    }
  }, [user]);

  return (
    <div className="max-w-2xl mx-auto p-6 text-white">
      <h1 className="text-3xl mb-6 text-center">List Your Property</h1>

      <div className="space-y-4 bg-[#0f172a] p-6 rounded-xl">

        {/* STEP 1 — PROJECT + ADDRESS */}
        {step === 1 && (
          <>
            <select
              className="input"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="">Select Apartment</option>
              {projects.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            {selectedProject === "Other" && (
              <input
                className="input"
                placeholder="Enter Apartment Name"
                onChange={(e) => setCustomProject(e.target.value)}
              />
            )}

            <input
              className="input"
              placeholder="Full Address"
              onChange={(e) => handleChange("address", e.target.value)}
            />
          </>
        )}

        {/* STEP 2 — RENT */}
        {step === 2 && (
          <div className="grid grid-cols-2 gap-4">
            <input
              className="input"
              placeholder="Rent"
              onChange={(e) => handleChange("rent", e.target.value)}
            />
            <input
              className="input"
              placeholder="Deposit"
              onChange={(e) => handleChange("deposit", e.target.value)}
            />
          </div>
        )}

        {/* STEP 3 — PROPERTY DETAILS */}
        {step === 3 && (
          <div className="grid grid-cols-2 gap-4">
            <input
              className="input"
              placeholder="BHK"
              onChange={(e) => handleChange("bhk", e.target.value)}
            />
            <input
              className="input"
              placeholder="Area (sq ft)"
              onChange={(e) => handleChange("area", e.target.value)}
            />
          </div>
        )}

        {/* STEP 4 — DESCRIPTION */}
        {step === 4 && (
          <>
            <input
              className="input"
              placeholder="Furnishing (semi/full/unfurnished)"
              onChange={(e) => handleChange("furnishing", e.target.value)}
            />
            <textarea
              className="input"
              placeholder="Description"
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </>
        )}

        {/* STEP 5 — LOCATION */}
        {step === 5 && (
          <div className="grid grid-cols-2 gap-4">
            <input
              className="input"
              placeholder="Latitude"
              onChange={(e) => handleChange("latitude", e.target.value)}
            />
            <input
              className="input"
              placeholder="Longitude"
              onChange={(e) => handleChange("longitude", e.target.value)}
            />
          </div>
        )}

        {/* NAV */}
        <div className="flex justify-between pt-4">
          {step > 1 && (
            <button
              onClick={back}
              className="px-4 py-2 bg-gray-600 rounded"
            >
              Back
            </button>
          )}

          {step < 5 ? (
            <button
              onClick={next}
              className="ml-auto px-4 py-2 bg-blue-600 rounded"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="ml-auto px-6 py-3 bg-green-600 rounded"
            >
              Save Property
            </button>
          )}
        </div>
      </div>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}