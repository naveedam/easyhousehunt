import MapView from "@/components/map/MapView";
import PropertyList from "@/components/map/PropertyList";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ListingWizard from "@/modules/chat/ListingWizard";
import { AuthProvider } from "@/hooks/useAuth";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* HOME */}
          <Route
            path="/"
            element={
              <div className="flex h-screen bg-black text-white">
                {/* LEFT PANEL */}
                <div className="w-[400px] overflow-y-auto border-r border-gray-800">
                  <PropertyList properties={[]} selectedId={""} onHover={function (id: string | null): void {
                    throw new Error("Function not implemented.");
                  } } onClick={function (id: string): void {
                    throw new Error("Function not implemented.");
                  } } loading={false} />
                </div>

                {/* MAP */}
                <div className="flex-1 h-full">
                  <MapView />
                </div>
              </div>
            }
          />

          {/* LIST PROPERTY */}
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