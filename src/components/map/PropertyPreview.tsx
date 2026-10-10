import { Property } from "../../types/property";

export default function PropertyPreview({
  property,
  onClose,
  onViewDetails,
  bottom,
}: {
  property: Property;
  onClose: () => void;
  onViewDetails: () => void;
  bottom?: string;
}) {
  const photo = property.media_urls?.[0];
  const sizeLabel =
    property.property_type === "PG" && property.occupancy
      ? `${property.occupancy} Occupancy`
      : property.bhk
      ? `${property.bhk} BHK`
      : null;

  return (
    <div
      className="absolute bottom-4 left-1/2 z-[25] w-[92%] max-w-sm -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-gray-900 text-white shadow-2xl"
      style={bottom ? { bottom } : undefined}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        aria-label="Close preview"
        className="absolute right-2 top-2 z-10 rounded-full bg-black/60 px-2 py-0.5 text-sm text-white hover:bg-black/80"
      >
        ✕
      </button>

      <div className="flex gap-3 p-3">
        {photo ? (
          <img src={photo} alt={property.title} loading="lazy"
               className="h-24 w-24 flex-shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-lg bg-gray-700 text-xs text-gray-500">
            No photo
          </div>
        )}

        <div className="min-w-0 flex-1 pr-5">
          <h3 className="truncate text-sm font-semibold">{property.title || "Untitled"}</h3>
          <p className="text-lg font-bold text-green-400">
            {property.rent ? `₹${property.rent.toLocaleString("en-IN")}` : "Price on request"}
            {property.rent ? <span className="text-xs font-normal text-gray-400">/mo</span> : null}
          </p>
          <p className="truncate text-xs text-gray-300">
            {[property.property_type, sizeLabel, property.furnishing].filter(Boolean).join(" · ")}
          </p>
          {property.address && (
            <p className="truncate text-xs text-gray-400">📍 {property.address}</p>
          )}
        </div>
      </div>

      {property.description && (
        <p className="line-clamp-2 px-3 pb-2 text-xs text-gray-400">{property.description}</p>
      )}

      <div className="px-3 pb-3">
        <button
          onClick={onViewDetails}
          className="w-full rounded-lg bg-orange-500 py-2 text-sm font-semibold hover:bg-orange-600"
        >
          View details
        </button>
      </div>
    </div>
  );
}
