import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PropertyMap from "@/components/property/PropertyMap";

type Property = {
  id: string;
  title: string;
  price: number;
  latitude?: number;
  longitude?: number;
};

export default function Index() {
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    // TEMP MOCK DATA (replace with Supabase later)
    setProperties([
      {
        id: "1",
        title: "Test Property with image",
        price: 10000,
        latitude: 12.9716,
        longitude: 77.5946,
      },
      {
        id: "2",
        title: "2 BHK – Emerald Grandeur",
        price: 25000,
        latitude: 12.9616,
        longitude: 77.5846,
      },
      {
        id: "3",
        title: "3BHK – semi furnished",
        price: 400000,
        latitude: 12.9816,
        longitude: 77.6046,
      },
    ]);
  }, []);

  return (
    <div className="flex h-screen bg-[#0B1220] text-white">
      
      {/* LEFT PANEL */}
      <div className="w-[420px] p-4 overflow-y-auto border-r border-gray-800">
        <h2 className="text-xl mb-4">{properties.length} properties</h2>

        <Link to="/add-property">
          <button className="w-full bg-orange-500 hover:bg-orange-600 py-3 rounded mb-4">
            + List Your Property
          </button>
        </Link>

        <div className="space-y-4">
          {properties.map((p) => (
            <div key={p.id} className="bg-[#1E293B] p-4 rounded">
              <h3 className="font-semibold">{p.title}</h3>
              <p className="text-green-400">₹{p.price}/mo</p>

              <Link to={`/property/${p.id}`}>
                <p className="text-orange-400 mt-2 cursor-pointer">
                  View Details →
                </p>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL - MAP */}
      <div className="flex-1 h-screen">
        <PropertyMap properties={properties} />
      </div>
    </div>
  );
}