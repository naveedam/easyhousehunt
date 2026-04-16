import { Link } from "react-router-dom";

type Property = {
  id: string;
  title: string;
  society?: string;
  rent: number;
  bhk: number;
};

type PropertyCardProps = {
  property: Property;
};

export default function PropertyCard({ property }: PropertyCardProps) {
  return (
    <div className="bg-slate-800 p-4 rounded-xl shadow hover:shadow-lg transition">
      <h2 className="text-lg font-semibold text-white">
        {property.title || `${property.bhk} BHK`}
      </h2>

      <p className="text-sm text-gray-400">
        {property.society || "Unknown location"}
      </p>

      <p className="text-green-400 font-bold mt-2">
        ₹{property.rent}/mo
      </p>

      <p className="text-sm text-gray-300 mt-1">
        {property.bhk} BHK
      </p>

      <Link
        to={`/property/${property.id}`}
        className="text-orange-400 mt-3 inline-block"
      >
        View Details →
      </Link>
    </div>
  );
}