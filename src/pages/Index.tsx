import { useState } from "react";
import ListingWizard from "../modules/chat/ListingWizard";
import MapView from "../components/map/MapView";

export default function Index() {
  const [openListing, setOpenListing] = useState(false);

  const [properties, setProperties] = useState([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="w-full h-screen">

      {/* 🔥 WRAPPER (IMPORTANT) */}
      <div className="relative w-full h-full">

        {/* MAP */}
        <MapView
          properties={properties}
          selectedId={selectedId}
          hoveredId={hoveredId}
          onBoundsChange={() => {}}
          onPropertyClick={(id: string) => setSelectedId(id)}
        />

        {/* 🔥 BUTTON INSIDE SAME STACK */}
        <div className="absolute bottom-6 right-6 z-[9999]">
          <button
            onClick={() => setOpenListing(true)}
            className="bg-red-500 text-white p-4 fixed top-10 left-10 z-[99999]"
          >
            + List Your Property
          </button>
        </div>

      </div>

      {/* MODAL */}
      <ListingWizard
        open={openListing}
        onClose={() => setOpenListing(false)}
      />
    </div>
  );
}