import { toggleSaved, useIsSaved } from "@/lib/saved";

export default function SaveButton({
  propertyId,
  className = "",
  size = "md",
}: {
  propertyId: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const saved = useIsSaved(propertyId);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save this listing"}
      title={saved ? "Saved. Tap to remove" : "Save"}
      onClick={(e) => {
        e.stopPropagation();
        void toggleSaved(propertyId);
      }}
      className={`flex items-center justify-center rounded-full hover:bg-white/10 ${
        size === "sm" ? "h-7 w-7 text-lg" : "h-9 w-9 text-xl"
      } ${saved ? "text-red-500" : "text-gray-300 hover:text-red-400"} ${className}`}
    >
      {saved ? "♥" : "♡"}
    </button>
  );
}
