import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function ListingWizard() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const SOCIETIES = [
    "Karle Zenith Residences",
    "Prestige Misty Water",
    "Embassy Lake Terraces",
    "LNT Raintree Boulevard",
    "Godrej Woodman Estates",
    "RMZ Latitude",
    "SNN Clermont",
    "Sobha City",
    "Other",
  ];

  const [selectedSociety, setSelectedSociety] = useState("");
  const [customSociety, setCustomSociety] = useState("");

  const [form, setForm] = useState({
    title: "",
    bhk: "",
    area: "",
    rent: "",
    deposit: "",
    furnishing: "",
    description: "",
    media: [] as File[],
  });

  const update = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // ✅ STEP VALIDATION
  const validateStep = () => {
    if (step === 1) {
      if (!form.title || !selectedSociety) return "Enter title & society";
      if (selectedSociety === "Other" && !customSociety)
        return "Enter society name";
    }

    if (step === 2) {
      if (!form.bhk || !form.area || !form.rent || !form.deposit)
        return "Fill all property details";
    }

    if (step === 3 && !form.furnishing) return "Select furnishing";
    if (step === 4 && !form.description) return "Add description";

    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) return alert(err);
    setStep((s) => s + 1);
  };

  const back = () => setStep((s) => s - 1);

  // 🔥 FIXED UPLOAD FUNCTION
  const uploadFiles = async () => {
    if (!form.media.length) return [];

    const uploadedUrls: string[] = [];

    for (const file of form.media) {
      try {
        const fileName = `${Date.now()}-${file.name}`;

        console.log("Uploading:", fileName);

        const { error: uploadError } = await supabase.storage
          .from("property-media")
          .upload(fileName, file);

        if (uploadError) {
          console.error("UPLOAD ERROR:", uploadError);
          continue;
        }

        const { data } = supabase.storage
          .from("property-media")
          .getPublicUrl(fileName);

        console.log("UPLOADED URL:", data.publicUrl);

        uploadedUrls.push(data.publicUrl);
      } catch (err) {
        console.error("UPLOAD FAILED:", err);
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please login first");
      setLoading(false);
      return;
    }

    const address =
      selectedSociety === "Other" ? customSociety : selectedSociety;

    // 🔥 Upload media first
    const mediaUrls = await uploadFiles();

    console.log("FINAL MEDIA URLS:", mediaUrls);

    const { error } = await (supabase as any)
      .from("properties")
      .insert([
        {
          title: form.title,
          address,
          landlord_id: user.id,
          bhk: Number(form.bhk),
          rent: Number(form.rent),
          deposit: Number(form.deposit),
          area_sqft: Number(form.area),
          furnishing: form.furnishing,
          description: form.description,
          media_urls: mediaUrls.length ? mediaUrls : null,
        },
      ]);

    setLoading(false);

    if (error) {
      console.error("INSERT ERROR:", error);
      alert("Error saving property");
      return;
    }

    alert("Property listed successfully 🚀");
    navigate("/");
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#020617] text-white">
      <div className="bg-[#1e293b] p-6 rounded-xl w-[650px]">

        <h2 className="text-xl font-semibold mb-4">
          List Your Property (Step {step}/5)
        </h2>

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <p>Property Title</p>
            <input
              className="w-full p-2 mb-3 bg-[#020617]"
              onChange={(e) => update("title", e.target.value)}
            />

            <p>Society</p>
            <select
              className="w-full p-2 mb-3 bg-[#020617]"
              onChange={(e) => setSelectedSociety(e.target.value)}
            >
              <option value="">Select</option>
              {SOCIETIES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            {selectedSociety === "Other" && (
              <input
                placeholder="Enter society"
                className="w-full p-2 mb-3 bg-[#020617]"
                onChange={(e) => setCustomSociety(e.target.value)}
              />
            )}

            <button onClick={next} className="bg-orange-500 px-4 py-2 rounded">
              Next
            </button>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <p>BHK</p>
            <input className="w-full p-2 mb-2 bg-[#020617]" onChange={(e)=>update("bhk",e.target.value)} />

            <p>Area (sqft)</p>
            <input className="w-full p-2 mb-2 bg-[#020617]" onChange={(e)=>update("area",e.target.value)} />

            <p>Rent (₹)</p>
            <input className="w-full p-2 mb-2 bg-[#020617]" onChange={(e)=>update("rent",e.target.value)} />

            <p>Deposit (₹)</p>
            <input className="w-full p-2 mb-2 bg-[#020617]" onChange={(e)=>update("deposit",e.target.value)} />

            <button onClick={back}>Back</button>
            <button onClick={next} className="bg-orange-500 px-4 py-2 ml-2">Next</button>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <p>Furnishing</p>
            <select
              className="w-full p-2 mb-3 bg-[#020617]"
              onChange={(e)=>update("furnishing",e.target.value)}
            >
              <option value="">Select</option>
              <option>Fully Furnished</option>
              <option>Semi Furnished</option>
              <option>Unfurnished</option>
            </select>

            <button onClick={back}>Back</button>
            <button onClick={next} className="bg-orange-500 px-4 py-2 ml-2">Next</button>
          </>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <>
            <p>Description</p>
            <textarea
              className="w-full p-2 mb-3 bg-[#020617]"
              onChange={(e)=>update("description",e.target.value)}
            />

            <button onClick={back}>Back</button>
            <button onClick={next} className="bg-orange-500 px-4 py-2 ml-2">Next</button>
          </>
        )}

        {/* STEP 5 */}
        {step === 5 && (
          <>
            <p>Upload Images / Videos (Optional)</p>
            <input
              type="file"
              multiple
              onChange={(e)=>update("media", Array.from(e.target.files || []))}
            />

            <button onClick={back}>Back</button>
            <button
              onClick={handleSubmit}
              className="bg-green-500 px-4 py-2 ml-2"
            >
              {loading ? "Publishing..." : "Publish 🚀"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}