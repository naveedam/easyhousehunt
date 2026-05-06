import { useEffect, useState } from "react";
import MapView from "./components/map/MapView";
import PropertyList from "./components/map/PropertyList";
import PropertyDetail from "./components/map/PropertyDetail";
import AuthModal from "@/components/ui/AuthModal";
import ListingWizard from "./modules/chat/ListingWizard";
import ChatModal from "./modules/chat/ChatModal";
import Inbox from "./modules/chat/Inbox";
import SearchFilters, { Filters } from "./components/SearchFilters";
import OwnerDashboard from "./pages/OwnerDashboard";
import TenantDashboard from "./pages/TenantDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import MobileLayout from "./components/MobileLayout";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [ownerDashOpen, setOwnerDashOpen] = useState(false);
  const [tenantDashOpen, setTenantDashOpen] = useState(false);
  const [adminDashOpen, setAdminDashOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    bhk: [], minRent: 0, maxRent: 200000, furnishing: [], search: "", propertyType: "All"
  });

  async function fetchProperties() {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("id, title, rent, bhk, address, latitude, longitude, deposit, furnishing, area_sqft, description, amenities, media_urls, landlord_id, property_type, occupancy")
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
        property_type: p.property_type ?? "Apartment",
        occupancy: p.occupancy ?? null,
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

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("is_admin").eq("id", user.id).single()
      .then(({ data }) => setIsAdmin(data?.is_admin || false));
  }, [user]);

  // Also check by email as fallback
  const adminEmail = "naveedahmedm@gmail.com";
  const isAdminByEmail = user?.email === adminEmail;
  const effectiveAdmin = isAdmin || isAdminByEmail;

  const filteredProperties = properties.filter((p) => {
    if (filters.bhk.length > 0 && !filters.bhk.includes(p.bhk ?? 0)) return false;
    if (p.rent < filters.minRent || p.rent > filters.maxRent) return false;
    if (filters.furnishing.length > 0 && !filters.furnishing.includes(p.furnishing ?? "")) return false;
    if (filters.propertyType !== "All" && p.property_type !== filters.propertyType) return false;
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

  const sharedProps = {
    properties: filteredProperties,
    loading,
    filters,
    onFiltersChange: setFilters,
    onSelectProperty: (p: Property) => { setSelectedProperty(p); setDetailProperty(p); },
    onListProperty: handleListProperty,
    onOpenInbox: () => setInboxOpen(true),
    onSignIn: () => { setAuthIntent("tenant"); setAuthModalOpen(true); },
    onSignOut: signOut,
    onOwnerDash: () => setOwnerDashOpen(true),
    isAdmin,
    onAdminDash: () => setAdminDashOpen(true),
    detailProperty,
    onCloseDetail: () => setDetailProperty(null),
    onConnectOwner: handleConnectWithOwner,
  };

  return (
    <>
      {/* MOBILE */}
      <div className="block md:hidden h-screen">
        <MobileLayout {...sharedProps} />
      </div>

      {/* DESKTOP */}
      <div className="hidden md:flex h-screen w-full">
        <div className="w-[350px] bg-black text-white overflow-y-auto flex flex-col">
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-orange-500 font-bold text-lg">EasyHouseHunt</h1>
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(prev => !prev)}
                    className="flex flex-col gap-1 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                  >
                    <span className="w-4 h-0.5 bg-white block"></span>
                    <span className="w-4 h-0.5 bg-white block"></span>
                    <span className="w-4 h-0.5 bg-white block"></span>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-10 bg-gray-800 rounded-xl shadow-xl z-50 w-48 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-700">
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                      <button onClick={() => { setInboxOpen(true); setMenuOpen(false); }}
                        className="w-full text-left px-4 py-3 text-sm text-white hover:bg-gray-700 flex items-center gap-2">
                        💬 Messages
                      </button>
                      <button onClick={() => { setOwnerDashOpen(true); setMenuOpen(false); }}
                        className="w-full text-left px-4 py-3 text-sm text-white hover:bg-gray-700 flex items-center gap-2">
                        🏠 My Listings
                      </button>
                      {effectiveAdmin && (
                        <button onClick={() => { setAdminDashOpen(true); setMenuOpen(false); }}
                          className="w-full text-left px-4 py-3 text-sm text-white hover:bg-gray-700 flex items-center gap-2">
                          ⚙️ Admin Panel
                        </button>
                      )}
                      <div className="border-t border-gray-700">
                        <button onClick={() => { signOut(); setMenuOpen(false); }}
                          className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2">
                          ↪ Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={() => { setAuthIntent("tenant"); setAuthModalOpen(true); }}
                  className="text-xs text-orange-400 hover:text-orange-300">
                  Sign in
                </button>
              )}
            </div>
            <button onClick={handleListProperty}
              className="bg-orange-500 hover:bg-orange-600 w-full py-3 rounded font-semibold">
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

      {ownerDashOpen && <OwnerDashboard onClose={() => setOwnerDashOpen(false)} />}
      {tenantDashOpen && <TenantDashboard onClose={() => setTenantDashOpen(false)} />}
      {adminDashOpen && <AdminDashboard onClose={() => setAdminDashOpen(false)} />}
    </>
  );
}

export default App;
