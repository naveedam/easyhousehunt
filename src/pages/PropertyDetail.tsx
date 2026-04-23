import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ChatModal from "@/modules/chat/ChatModal";
import AuthModal from "@/components/ui/AuthModal";

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [showChat, setShowChat] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const [user, setUser] = useState<any>(null);

  // -----------------------------
  // INITIAL LOAD
  // -----------------------------
  useEffect(() => {
    fetchUser();
    fetchProperty();
  }, [id]);

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
  // FETCH PROPERTY
  // -----------------------------
  const fetchProperty = async () => {
    const { data, error } = await (supabase as any)
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("❌ Error fetching property:", error);
    } else {
      setProperty(data);
    }

    setLoading(false);
  };

  // -----------------------------
  // CONTACT OWNER
  // -----------------------------
  const handleContactOwner = async () => {
    console.log("CONTACT OWNER CLICKED");

    if (!user) {
      setShowAuth(true);
      return;
    }

    if (user.id === property.landlord_id) {
      alert("This is your own property");
      return;
    }

    setShowChat(true);
  };

  if (loading) {
    return <div className="p-4 text-white">Loading...</div>;
  }

  if (!property) {
    return <div className="p-4 text-white">Property not found</div>;
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4">

      {/* BACK BUTTON */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-sm text-orange-400 hover:underline"
      >
        ← Back
      </button>

      <div className="grid md:grid-cols-2 gap-6">

        {/* IMAGE SECTION */}
        <div>
          {property.media_urls?.length > 0 ? (
            <>
              <img
                src={property.media_urls[0]}
                alt="property"
                className="w-full h-[400px] object-cover rounded"
              />

              <div className="flex gap-2 mt-2">
                {property.media_urls.map((url: string, i: number) => (
                  <img
                    key={i}
                    src={url}
                    className="w-20 h-20 object-cover rounded border border-orange-500"
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="h-[400px] bg-gray-800 flex items-center justify-center rounded">
              No Image
            </div>
          )}
        </div>

        {/* DETAILS */}
        <div>
          <h1 className="text-2xl font-semibold mb-2">
            {property.title}
          </h1>

          <p className="text-green-400 text-xl mb-2">
            ₹{property.rent}/month
          </p>

          <p className="text-gray-400 mb-2">
            {property.bhk} BHK • {property.area_sqft} sq ft •{" "}
            {property.furnishing}
          </p>

          <p className="text-gray-300 mb-4">
            {property.address}
          </p>

          {/* DESCRIPTION */}
          <div className="bg-[#1e293b] p-4 rounded mb-4">
            <h2 className="mb-2 font-semibold">Description</h2>
            <p>{property.description || "No description"}</p>
          </div>

          {/* CONTACT BUTTON */}
          <button
            onClick={handleContactOwner}
            className="w-full bg-orange-500 hover:bg-orange-600 p-3 rounded font-medium"
          >
            Contact Owner
          </button>
        </div>
      </div>

      {/* CHAT MODAL */}
      {showChat && (
        <ChatModal
          propertyId={property.id}
          receiverId={property.landlord_id}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* 🔥 AUTH MODAL */}
      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} />
      )}
    </div>
  );
}