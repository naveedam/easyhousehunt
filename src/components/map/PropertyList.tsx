type Props = {
  properties: any[];
};

export default function PropertyList({ properties }: Props) {
  return (
    <div className="p-4 space-y-4">
      <button
        onClick={() => (window.location.href = "/add-property")}
        className="w-full bg-orange-500 text-white p-3 rounded"
      >
        + List Your Property
      </button>

      {properties.length === 0 && (
        <div className="text-gray-400 text-sm">
          No properties found
        </div>
      )}

      {properties.map((p) => (
        <div
          key={p.id}
          className="bg-gray-800 p-4 rounded border border-gray-700"
        >
          <div className="font-semibold">{p.title}</div>
          <div className="text-green-400">
            ₹{p.rent}/mo
          </div>
          <div className="text-sm text-gray-400">
            {p.bhk} BHK • {p.address}
          </div>
        </div>
      ))}
    </div>
  );
}