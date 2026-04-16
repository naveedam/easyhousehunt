import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function SearchProperties() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<any[]>([]);

  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching properties:", error);
      } else {
        setProperties(data || []);
      }
    };

    fetchProperties();
  }, []);

  return (
    <div className="flex h-screen text-white">
      {/* LEFT PANEL */}
      <div className="w-1/3 p-4 overflow-y-auto bg-[#0b1220]">
        <h2 className="text-xl font-semibold mb-4">
          {properties.length} properties
        </h2>

        {/* LIST PROPERTY BUTTON */}
        <button
          onClick={() => navigate("/add-property")} // ✅ FIXED ROUTE
          className="bg-orange-500 px-4 py-2 rounded-lg mb-4 w-full"
        >
          + List Your Property
        </button>

        {/* PROPERTY LIST */}
        <div className="space-y-4">
          {properties.map((property) => (
            <div
              key={property.id}
              className="bg-[#1c2538] p-4 rounded-lg"
            >
              <h3 className="text-lg font-semibold">
                {property.title || `${property.bhk} BHK`}
              </h3>

              <p className="text-gray-400">
                {property.society}
              </p>

              <p className="text-green-400 font-bold">
                ₹{property.rent}/mo
              </p>

              <button
                onClick={() =>
                  navigate(`/property/${property.id}`)
                }
                className="text-orange-400 mt-2"
              >
                View Details →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE (MAP PLACEHOLDER) */}
      <div className="w-2/3 bg-black flex items-center justify-center">
        <p className="text-gray-500">Map view (optional)</p>
      </div>
    </div>
  );
}