import { Property } from "../../types/property";

type Props = {
  properties: Property[];
  onSelect: (p: Property) => void;
};

export default function PropertyList({ properties, onSelect }: Props) {
  if (!Array.isArray(properties)) {
    return <div className="text-white p-4">Failed to load properties</div>;
  }

  if (properties.length === 0) {
    return <div className="text-gray-400 p-4 text-sm">No properties found.</div>;
  }

  return (
    <div className="space-y-3 px-4 pb-4">
      {properties.map((p) => (
        <div
          key={p.id}
          onClick={() => onSelect(p)}
          className="bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
        >
          <h3 className="text-white font-semibold text-sm">{p.title || "Untitled"}</h3>
          <p className="text-green-400 font-bold">₹{p.rent?.toLocaleString()}/mo</p>
          {p.property_type === "PG" ? (
            <p className="text-gray-300 text-xs">PG · {p.occupancy || "Single"} Occupancy</p>
          ) : p.bhk ? (
            <p className="text-gray-300 text-xs">{p.bhk} BHK · {p.property_type || "Apartment"}</p>
          ) : null}
          <p className="text-gray-400 text-xs mt-1 truncate">{p.address}</p>
          {p.is_verified && (
            <span className="text-xs text-blue-400 mt-1 inline-block">✓ Verified</span>
          )}
        </div>
      ))}
    </div>
  );
}