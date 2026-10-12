import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { syncSavedForUser } from "@/lib/saved";

// Mounted once: loads this person's saved listings when they sign in, clears them on sign out
export default function SavedSync() {
  const { user } = useAuth();
  useEffect(() => {
    void syncSavedForUser(user?.id ?? null);
  }, [user?.id]);
  return null;
}
