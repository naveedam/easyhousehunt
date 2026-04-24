import { useEffect, useState } from "react";
import MapView from "@/components/map/MapView";
import PropertyList from "@/components/map/PropertyList";
import { supabase } from "@/integrations/supabase/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ListingWizard from "@/modules/chat/ListingWizard";
import { AuthProvider } from "@/hooks/useAuth";

export default function App() {
  const [properties, setProperties] = useState<any[]>([]);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    const { data, error } = await supabase.from("properties").select("*");

    if (error) {
      console.error("❌ Fetch error:", error);
      return;
    }

    console.log("📦 properties:", data);
    setProperties(data || []);
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* HOME */}
          <Route
            path="/"
            element={
              <div className="flex h-screen bg-black text-white">
                <div className="w-[400px] overflow-y-auto border-r border-gray-800">
                  <PropertyList properties={properties} />
                </div>

                <div className="flex-1 h-full">
                  <MapView properties={properties} />
                </div>
              </div>
            }
          />

          {/* ADD PROPERTY */}
          <Route
            path="/add-property"
            element={
              <div className="min-h-screen bg-black text-white">
                <ListingWizard />
              </div>
            }
          />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}