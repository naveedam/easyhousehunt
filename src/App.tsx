import { useEffect, useState } from "react";
import MapView from "./components/map/MapView";
import PropertyList from "./components/map/PropertyList";
import PropertyDetail from "./components/map/PropertyDetail";
import AuthModal from "@/components/ui/AuthModal";
import { supabase } from "./integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ListingWizard from "./modules/chat/ListingWizard";
import ChatModal from "./modules/chat/ChatModal";
import Inbox from "./modules/chat/Inbox";
import { Property } from "./types/property";

function App() {
  const { user, signOut } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [detailProperty, setDetailProperty] = useState<Property | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authIntent, setAuthIntent] = useState<"owner" | "tenant">("tenant");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [chatProperty, setChatProperty] = useState<Property | null>(null);
  const [inboxOpen, setInboxOpen] = useState(false);

  async function fetchProperties() {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("id, title, rent, bhk, address, latitude, longitude, deposit, furnishing, area_sqft, description, amenities, media_urls")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .limit(100);

      if (error) { console.error("Supabase error:", error.message); setProperties([]); return; }

      const mapped: Property[] = (data || []).map((p: any) => ({
        id: String(p.id),
        title: p.title ?? "Untitled",
        rent: p.rent ?? 0,
        bhk: p.bhk ?? null,
        address: p.address ?? "",
        latitude: p.latitude,
        longitude: p.longitude,
        deposit: p.deposit ?? null,
        furnishing: p.furnishing ?? null,
        area_sqft: p.area_sqft ?? null,
        description: p.description ?? null,
        amenities: p.amenities ?? [],
        media_urls: p.media_urls ?? [],
        image_url: p.media_urls?.[0] ?? null,
      }));

      setProperties(mapped);
    } catch (err) {
      console.error("Fetch error:", err);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchProperties(); }, []);

  const handleListProperty = () => {
    if (user) {
      setWizardOpen(true);
    } else {
      setAuthIntent("owner");
      setAuthModalOpen(true);
    }
  };

  const handleConnectWithOwner = () => {
    if (user) {
      setChatProperty(detailProperty); setDetailProperty(null);
    } else {
      setAuthIntent("tenant");
      setAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    setAuthModalOpen(false);
    if (authIntent === "owner") {
      alert("Owner form coming soon!");
    } else {
      alert("You can now connect with the owner!");
    }
  };

  return (
    <div className="flex h-screen w-full">
      {/* LEFT PANEL */}
      <div className="w-[350px] bg-black text-white overflow-y-auto flex flex-col">
        <div className="p-4 space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-orange-500 font-bold text-lg">EasyHouseHunt</h1>
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 truncate max-w-[100px]">
                  {user.email?.split("@")[0]}
                </span>
                <button
                  onClick={signOut}
                  className="text-xs text-gray-500 hover:text-white"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setAuthIntent("tenant"); setAuthModalOpen(true); }}
                className="text-xs text-orange-400 hover:text-orange-300"
              >
                Sign in
              </button>
            )}
          </div>

          <button
            onClick={handleListProperty}
            className="bg-orange-500 hover:bg-orange-600 w-full py-3 rounded font-semibold"
          >
            + List Your Property
          </button>
        </div>

        {loading ? (
          <p className="text-gray-400 px-4">Loading...</p>
        ) : (
          <PropertyList
            properties={properties}
            onSelect={(p) => { setSelectedProperty(p); setDetailProperty(p); }}
          />
        )}
      </div>

      {/* MAP */}
      <div className="flex-1">
        <MapView
          properties={properties}
          selectedProperty={selectedProperty}
          onMarkerClick={(p) => { setSelectedProperty(p); setDetailProperty(p); }}
        />
      </div>

      {/* PROPERTY DETAIL */}
      {detailProperty && (
        <PropertyDetail
          property={detailProperty}
          onClose={() => setDetailProperty(null)}
          onConnectClick={handleConnectWithOwner}
        />
      )}

      {/* AUTH MODAL */}
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {chatProperty && (
        <ChatModal
          propertyId={chatProperty.id}
          propertyTitle={chatProperty.title}
          receiverId={chatProperty.landlord_id || ""}
          onClose={() => setChatProperty(null)}
        />
      )}

      {inboxOpen && <Inbox onClose={() => setInboxOpen(false)} />}

      {wizardOpen && (
        <ListingWizard
          onClose={() => setWizardOpen(false)}
          onSuccess={() => { setWizardOpen(false); fetchProperties(); }}
        />
      )}
    </div>
  );
}

export default App;
