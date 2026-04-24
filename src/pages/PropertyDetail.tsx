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

  // ✅ NEW
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    const { data, error } = await (supabase as any)
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();

    if (!error) setProperty(data);

    setLoading(false);
  };

  const handleContactOwner = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 🔥 FIX
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

  if (loading) return <div className="p-4 text-white">Loading...</div>;
  if (!property) return <div className="p-4 text-white">Not found</div>;

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-orange-400"
      >
        ← Back
      </button>

      <h1 className="text-2xl">{property.title}</h1>
      <p className="text-green-400">₹{property.rent}/month</p>

      <button
        onClick={handleContactOwner}
        className="mt-4 bg-orange-500 p-3 rounded"
      >
        Contact Owner
      </button>

      {showChat && (
        <ChatModal
          propertyId={property.id}
          receiverId={property.landlord_id}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* 🔥 AUTH MODAL */}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={() => {
            setShowAuth(false);
            handleContactOwner();
          }}
        />
      )}
    </div>
  );
}