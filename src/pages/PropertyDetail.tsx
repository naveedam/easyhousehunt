import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperty = async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
        return;
      }

      setProperty(data);
      setLoading(false);
    };

    fetchProperty();
  }, [id]);

  // 🔥 CONTACT OWNER LOGIC
  const handleContact = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please login to contact owner");
      return;
    }

    navigate(`/chat/${property.id}`);
  };

  if (loading) return <div className="text-white p-6">Loading...</div>;
  if (!property) return <div className="text-white p-6">Property not found</div>;

  return (
    <div className="p-6 text-white bg-[#020617] min-h-screen">

      <h1 className="text-2xl font-bold mb-4">{property.title}</h1>

      {/* ✅ MEDIA DISPLAY */}
      {property.media_urls && property.media_urls.length > 0 ? (
        <div className="mb-6">
          {property.media_urls.map((url: string, idx: number) => (
            <div key={idx} className="mb-4">
              {url.match(/\.(mp4|webm|ogg)$/) ? (
                <video controls className="w-full rounded">
                  <source src={url} />
                </video>
              ) : (
                <img src={url} alt="property" className="w-full rounded" />
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-4">No media uploaded</p>
      )}

      {/* DETAILS */}
      <p><b>Society:</b> {property.address}</p>
      <p><b>BHK:</b> {property.bhk}</p>
      <p><b>Area:</b> {property.area_sqft} sqft</p>
      <p><b>Rent:</b> ₹{property.rent}</p>
      <p><b>Deposit:</b> ₹{property.deposit}</p>
      <p><b>Furnishing:</b> {property.furnishing}</p>
      <p><b>Description:</b> {property.description}</p>

      {/* 🔥 CONTACT BUTTON */}
      <button
        onClick={handleContact}
        className="bg-orange-500 px-4 py-2 rounded mt-6"
      >
        Contact Owner 💬
      </button>
    </div>
  );
}