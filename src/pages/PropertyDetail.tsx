import { useParams, Link } from "react-router-dom";

export default function PropertyDetail() {
  const { id } = useParams();

  // TEMP MOCK (replace with Supabase later)
  const property = {
    id,
    title: "Sample Property",
    price: 25000,
    description: "Spacious apartment in Bengaluru",
    image: "https://via.placeholder.com/800x400",
  };

  if (!id) {
    return <div className="p-6 text-white">Invalid property</div>;
  }

  return (
    <div className="min-h-screen bg-[#0B1220] text-white p-6">
      <Link to="/" className="text-orange-400">← Back</Link>

      <div className="mt-4">
        <img
          src={property.image}
          alt="property"
          className="w-full h-[300px] object-cover rounded"
        />

        <h1 className="text-2xl mt-4 font-bold">{property.title}</h1>
        <p className="text-green-400 text-xl">₹{property.price}/mo</p>

        <p className="mt-4 text-gray-300">{property.description}</p>
      </div>
    </div>
  );
}