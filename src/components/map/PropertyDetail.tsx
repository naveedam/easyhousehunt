import { useEffect, useState } from "react";
import { Property } from "../../types/property";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import PhotoGallery from "./PhotoGallery";
import SaveButton from "@/components/SaveButton";
import { httpPhotos } from "@/lib/photos";
import { addRecent } from "@/lib/recentlyViewed";

export default function PropertyDetail({
  property,
  onClose,
  onConnectClick,
}: {
  property: Property;
  onClose: () => void;
  onConnectClick: () => void;
}) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  useEffect(() => { addRecent(property.id); }, [property.id]);

  const toggleSave = async () => {
    if (!user) return;
    if (saved) {
      await supabase.from("saved_properties").delete()
        .eq("user_id", user.id).eq("property_id", property.id);
      setSaved(false);
    } else {
      await supabase.from("saved_properties").insert({
        user_id: user.id, property_id: property.id
      });
      setSaved(true);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60">
      <div className="bg-gray-900 text-white w-full sm:w-[480px] rounded-t-2xl sm:rounded-2xl p-6 max-h-[85vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl"
        >
          ✕
        </button>

        {/* Photos */}
        <div className="mb-4">
          <PhotoGallery
            key={property.id}
            urls={httpPhotos(property.media_urls)}
            alt={property.title || "Listing"}
            heightClass="h-56"
          />
        </div>

        {/* Title & Price */}
        {property.is_sample && (
          <div className="mb-3 rounded-lg bg-yellow-900/60 px-3 py-2 text-center text-xs font-semibold tracking-wide text-yellow-200">
            SAMPLE LISTING · for demonstration only, not a real home or price
          </div>
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold">{property.title || "Untitled"}</h2>
            <p className="text-green-400 text-2xl font-bold mt-1">
              ₹{property.rent?.toLocaleString()}/mo
            </p>
          </div>
          {!property.is_sample && <SaveButton propertyId={property.id} className="flex-shrink-0" />}
        </div>

        {/* Key details */}
        <div className="flex gap-3 mt-3 flex-wrap">
          {property.property_type && (
            <span className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full text-sm">
              {property.property_type}
            </span>
          )}
          {property.property_type === "PG" && property.occupancy ? (
            <span className="bg-gray-700 px-3 py-1 rounded-full text-sm">
              {property.occupancy} Occupancy
            </span>
          ) : property.bhk ? (
            <span className="bg-gray-700 px-3 py-1 rounded-full text-sm">
              {property.bhk} BHK
            </span>
          ) : null}
          {property.furnishing && (
            <span className="bg-gray-700 px-3 py-1 rounded-full text-sm">
              {property.furnishing}
            </span>
          )}
          {property.area_sqft && (
            <span className="bg-gray-700 px-3 py-1 rounded-full text-sm">
              {property.area_sqft} sqft
            </span>
          )}
          {property.deposit && (
            <span className="bg-gray-700 px-3 py-1 rounded-full text-sm">
              Deposit: ₹{property.deposit.toLocaleString()}
            </span>
          )}
        </div>

        {/* Address */}
        {property.address && (
          <p className="text-gray-400 text-sm mt-3">📍 {property.address}</p>
        )}

        {/* Description */}
        {property.description && (
          <p className="text-gray-300 text-sm mt-4">{property.description}</p>
        )}

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <div className="mt-4">
            <p className="text-gray-400 text-xs uppercase mb-2">Amenities</p>
            <div className="flex flex-wrap gap-2">
              {property.amenities.map((a) => (
                <span key={a} className="bg-gray-700 text-xs px-2 py-1 rounded">
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={property.is_sample ? undefined : onConnectClick}
          disabled={!!property.is_sample}
          className="mt-6 w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold text-lg disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {property.is_sample ? "Sample listing · cannot be contacted" : user ? "📞 Connect with Owner" : "🔐 Login to Connect"}
        </button>
      </div>
    </div>
  );
}
