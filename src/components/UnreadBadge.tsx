import { useUnread } from "@/lib/messageStore";

export default function UnreadBadge() {
  const n = useUnread();
  if (n <= 0) return null;
  return (
    <span className="ml-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-orange-500 px-1 text-xs font-semibold text-white">
      {n > 99 ? "99+" : n}
    </span>
  );
}
