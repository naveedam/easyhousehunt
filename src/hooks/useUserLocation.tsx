import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
import { BENGALURU_CENTER, MAX_CITY_RADIUS_M, distanceMeters } from "@/lib/geo";

export type UserLocation = { lat: number; lng: number; accuracy: number };

export type LocateResult =
  | { ok: true; location: UserLocation }
  | { ok: false; reason: "denied" | "unavailable" | "outside" };

type Ctx = {
  location: UserLocation | null;
  locate: () => Promise<LocateResult>;
  clear: () => void;
};

const LocationContext = createContext<Ctx | null>(null);

// Location lives only in memory in the browser. It is never sent anywhere or stored.
export function UserLocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<UserLocation | null>(null);

  const locate = useCallback((): Promise<LocateResult> => {
    return new Promise((resolve) => {
      if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
        resolve({ ok: false, reason: "unavailable" });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: UserLocation = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          if (distanceMeters(loc, BENGALURU_CENTER) > MAX_CITY_RADIUS_M) {
            setLocation(null);
            resolve({ ok: false, reason: "outside" });
            return;
          }
          setLocation(loc);
          resolve({ ok: true, location: loc });
        },
        (err) => resolve({ ok: false, reason: err.code === err.PERMISSION_DENIED ? "denied" : "unavailable" }),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
      );
    });
  }, []);

  const clear = useCallback(() => setLocation(null), []);
  const value = useMemo(() => ({ location, locate, clear }), [location, locate, clear]);

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

const FALLBACK: Ctx = {
  location: null,
  locate: async () => ({ ok: false, reason: "unavailable" }),
  clear: () => {},
};

export function useUserLocation(): Ctx {
  return useContext(LocationContext) ?? FALLBACK;
}
