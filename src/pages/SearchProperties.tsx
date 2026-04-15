import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MapView from "@/components/map/MapView";
import { useNavigate } from "react-router-dom";

type Property = {
  id: string;
  title: string;
  address: string;
  bhk: number;
  rent: number;
  latitude: number;
  longitude: number;
};

export default function SearchProperties() {
  const navigate = useNavigate();

  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchProperties = async () => {
    const { data, error } = await supabase
      .from("properties")
      .select("*");

    if (error) {
      console.error(error);
      return;
    }

    setProperties(data as Property[]);
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  return (
    <div className="flex h-screen relative">

      {/* FILTERS */}
      <div className="w-[280px] bg-[#0f172a] p-4 text-white">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>

        <input
          placeholder="Search location"
          className="w-full p-2 mb-3 rounded bg-[#1e293b]"
        />

        <select className="w-full p-2 mb-3 rounded bg-[#1e293b]">
          <option>All BHK</option>
          <option>1 BHK</option>
          <option>2 BHK</option>
          <option>3 BHK</option>
        </select>

        <input
          placeholder="Min Rent"
          className="w-full p-2 mb-3 rounded bg-[#1e293b]"
        />

        <input
          placeholder="Max Rent"
          className="w-full p-2 rounded bg-[#1e293b]"
        />
      </div>

      {/* LIST */}
      <div className="w-[360px] bg-[#020617] p-4 overflow-y-auto">
        <h2 className="text-white mb-4">
          {properties.length} properties
        </h2>

        {properties.map((p) => (
          <div
            key={p.id}
            onClick={() => setSelectedId(p.id)}
            className={`p-4 rounded-xl mb-4 text-white cursor-pointer ${
              selectedId === p.id
                ? "bg-orange-500"
                : "bg-[#1e293b]"
            }`}
          >
            <h3 className="font-semibold">{p.title}</h3>
            <p className="text-sm text-gray-300">{p.address}</p>
            <p className="text-green-400 font-semibold">
              ₹{p.rent}/mo
            </p>
            <p>{p.bhk} BHK</p>

            {/* ✅ FIXED BUTTON */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // 🔥 IMPORTANT
                navigate(`/property/${p.id}`);
              }}
              className="text-orange-400 mt-2 text-sm"
            >
              View Details →
            </button>
          </div>
        ))}
      </div>

      {/* MAP */}
      <div className="flex-1">
        <MapView
          properties={properties}
          onSelect={(id) => setSelectedId(id)}
        />
      </div>

      {/* ✅ FIXED BUTTON */}
      <button
        onClick={() => navigate("/list-property")}
        className="absolute bottom-6 right-6 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full shadow-lg"
      >
        + List Your Property
      </button>
    </div>
  );
}