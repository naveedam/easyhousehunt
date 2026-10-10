import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapProperty {
  id: string;
  title: string;
  rent: number;
  bhk: number;
  address: string;
  furnishing: string;
  property_type: string;
  latitude: number;
  longitude: number;
  is_verified: boolean;
  is_instant_move_in: boolean;
  area_sqft: number | null;
  availability_date: string | null;
  image_url: string | null;
}

export function useMapBounds(debounceMs = 400) {
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [properties, setProperties] = useState<MapProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapMoved, setMapMoved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const lastFetchedBoundsRef = useRef<MapBounds | null>(null);

  const updateBounds = useCallback((newBounds: MapBounds) => {
    setBounds(newBounds);
    setMapMoved(true);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const fetchInBounds = useCallback(async (b: MapBounds) => {
    setLoading(true);
    lastFetchedBoundsRef.current = b;

    const { data } = await supabase
      .from('properties')
      .select(`
        id, title, rent, bhk, address, furnishing, property_type,
        latitude, longitude, is_verified, is_instant_move_in, area_sqft, availability_date,
        property_images(image_url, is_primary)
      `)
      .eq('status', 'approved')
      .gte('latitude', b.south)
      .lte('latitude', b.north)
      .gte('longitude', b.west)
      .lte('longitude', b.east)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(500);

    const mapped: MapProperty[] = (data || []).map((p: any) => {
      const primary = p.property_images?.find((i: any) => i.is_primary);
      const imgUrl = primary?.image_url || p.property_images?.[0]?.image_url || null;
      return {
        id: p.id,
        title: p.title,
        rent: p.rent,
        bhk: p.bhk,
        address: p.address,
        furnishing: p.furnishing,
        property_type: p.property_type,
        latitude: p.latitude,
        longitude: p.longitude,
        is_verified: p.is_verified ?? false,
        is_instant_move_in: p.is_instant_move_in ?? false,
        area_sqft: p.area_sqft,
        availability_date: p.availability_date,
        image_url: imgUrl,
      };
    });

    setProperties(mapped);
    setLoading(false);
    setMapMoved(false);
  }, []);

  const searchThisArea = useCallback(() => {
    if (bounds) fetchInBounds(bounds);
  }, [bounds, fetchInBounds]);

  // Auto-fetch on first bounds set
  useEffect(() => {
    if (bounds && !lastFetchedBoundsRef.current) {
      fetchInBounds(bounds);
    }
  }, [bounds, fetchInBounds]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { bounds, properties, loading, mapMoved, updateBounds, searchThisArea, fetchInBounds };
}
