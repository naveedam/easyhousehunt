import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PropertyMap from "@/components/property/PropertyMap";
import { useNavigate } from "react-router-dom";

type Property = {
  id: string;
  title: string;
  address: string;
  rent: number;
  bhk: number;
  latitude: number;
  longitude: number;
};

export default function Index() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] =
    useState<Property | null>(null);
  const [user, setUser] = useState<any>(null);

  const navigate = useNavigate();

  // -----------------------------
  // INITIAL LOAD
  // -----------------------------
  useEffect(() => {
    fetchUser();
    fetchProperties();
  }, []);

  // -----------------------------
  // FETCH USER
  // -----------------------------
  const fetchUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);
  };

  // -----------------------------
  // FETCH PROPERTIES
  // -----------------------------
  const fetchProperties = async () => {
    const { data, error } = await (supabase as any)
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching properties:", error);
      return;
    }

    const cleanData = (data || []).filter(
      (p: Property) => p.latitude && p.longitude
    );

    setProperties(cleanData);

    // default selection
    if (cleanData.length > 0) {
      setSelectedProperty(cleanData[0]);
    }

    console.log("✅ Properties loaded:", cleanData.length);
  };

  // -----------------------------
  // HANDLE SELECT (MAP SYNC)
  // -----------------------------
  const handleSelect = (property: Property) => {
    console.log("🟢 Selected:", property.title);
    setSelectedProperty(property);
  };

  return (
    <div className="flex h-screen bg-[#020617] text-white">

      {/* LEFT PANEL */}
      <div className="w-[420px] overflow-y-auto p-4 border-r border-gray-800">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl">
            {properties.length} properties
          </h2>

          {user && (
            <button
              onClick={() => navigate("/chat")}
              className="bg-green-600 px-3 py-1 rounded text-sm"
            >
              Inbox
            </button>
          )}
        </div>

        {/* ADD PROPERTY */}
        <button
          onClick={() => navigate("/add-property")}
          className="w-full bg-orange-500 hover:bg-orange-600 p-3 mb-4 rounded"
        >
          + List Your Property
        </button>

        {/* PROPERTY LIST */}
        {properties.map((p) => {
          const isSelected = selectedProperty?.id === p.id;

          return (
            <div
              key={p.id}
              onClick={() => handleSelect(p)}
              className={`p-4 mb-4 rounded cursor-pointer transition
                ${
                  isSelected
                    ? "bg-[#334155] border border-green-400"
                    : "bg-[#1e293b] hover:bg-[#334155]"
                }
              `}
            >
              <h3 className="text-lg font-semibold">{p.title}</h3>

              <p className="text-green-400">
                ₹{p.rent}/mo
              </p>

              <p className="text-sm text-gray-400">
                {p.bhk} BHK • {p.address}
              </p>

              {/* 🔥 VIEW DETAILS FIX */}
              <p
                onClick={(e) => {
                  e.stopPropagation(); // prevent map selection trigger
                  navigate(`/property/${p.id}`);
                }}
                className="text-orange-400 mt-2 hover:underline"
              >
                View Details →
              </p>
            </div>
          );
        })}
      </div>

      {/* MAP */}
      <div className="flex-1">
        <PropertyMap
          properties={properties}
          selectedProperty={selectedProperty}
        />
      </div>
    </div>
  );
}