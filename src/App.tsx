import { useEffect, useState } from "react";
import MapView from "./components/map/MapView";
import PropertyList from "./components/map/PropertyList";
import PropertyDetail from "./components/map/PropertyDetail";
import AuthModal from "@/components/ui/AuthModal";
import ListingWizard from "./modules/chat/ListingWizard";
import ChatModal from "./modules/chat/ChatModal";
import Inbox from "./modules/chat/Inbox";
import SearchFilters, { Filters } from "./components/SearchFilters";
import { supabase } from "./integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
  const [filters, setFilters] = useState<Filters>({
    bhk: [], minRent: 0, maxRent: 200000, furnishing: [], search: ""
  });

  async function fetchProperties() {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("id, title, rent, bhk, address, latitude, longitude, deposit, furnishing, area_sqft, description, amenities, media_urls, landlord_id")
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
        landlord_id: p.landlord_id ?? null,
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

  const filteredProperties = properties.filter((p) => {
    if (filters.bhk.length > 0 && !filters.bhk.includes(p.bhk ?? 0)) return false;
    if (p.rent < filters.minRent || p.rent > filters.maxRent) return false;
    if (filters.furnishing.length > 0 && !filters.furnishing.includes(p.furnishing ?? "")) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!p.title?.toLowerCase().includes(q) && !p.address?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleListProperty = () => {
    if (user) { setWizardOpen(true); }
    else { setAuthIntent("owner"); setAuthModalOpen(true); }
  };

  const handleConnectWithOwner = () => {
    if (user) { setChatProperty(detailProperty); setDetailProperty(null); }
    else { setAuthIntent("tenant"); setAuthModalOpen(true); }
  };

  return (
    <div className="flex h-screen w-full">
      <div className="w-[350px] bg-black text-white overflow-y-auto flex flex-col">
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-orange-500 font-bold text-lg">EasyHouseHunt</h1>
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 truncate max-w-[80px]">
                  {user.email?.split("@")[0]}
                </span>
                <button
                  onClick={() => setInboxOpen(true)}
                  className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded-full"
                >
                  💬
                </button>
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

        <SearchFilters onChange={setFilters} />

        {loading ? (
          <p className="text-gray-400 px-4">Loading...</p>
        ) : (
          <PropertyList
            properties={filteredProperties}
            onSelect={(p) => { setSelectedProperty(p); setDetailProperty(p); }}
          />
        )}
      </div>

      <div className="flex-1">
        <MapView
          properties={filteredProperties}
          selectedProperty={selectedProperty}
          onMarkerClick={(p) => { setSelectedProperty(p); setDetailProperty(p); }}
        />
      </div>

      {detailProperty && (
        <PropertyDetail
          property={detailProperty}
          onClose={() => setDetailProperty(null)}
          onConnectClick={handleConnectWithOwner}
        />
      )}

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
          onSuccess={() => {
            setWizardOpen(false);
            fetchProperties();
            alert("Your property is now live on the map!");
          }}
        />
      )}

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}

export default App;
