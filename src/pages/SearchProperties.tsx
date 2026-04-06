import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import PropertyCard from '@/components/property/PropertyCard';
import PropertyFilters, { Filters, defaultFilters } from '@/components/property/PropertyFilters';
import PropertyMap from '@/components/property/PropertyMap';
import { Button } from '@/components/ui/button';
import { Map, List, Loader2 } from 'lucide-react';

interface Property {
  id: string;
  title: string;
  address: string;
  rent: number;
  bhk: number;
  area_sqft: number | null;
  furnishing: string;
  property_type: string;
  is_verified: boolean;
  is_instant_move_in: boolean;
  latitude: number | null;
  longitude: number | null;
  property_images: { image_url: string; is_primary: boolean }[];
}

export default function SearchProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, [filters]);

  const fetchProperties = async () => {
    setLoading(true);
    let query = supabase
      .from('properties')
      .select('id, title, address, rent, bhk, area_sqft, furnishing, property_type, is_verified, is_instant_move_in, latitude, longitude, property_images(image_url, is_primary)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (filters.bhk) query = query.eq('bhk', parseInt(filters.bhk));
    if (filters.furnishing) query = query.eq('furnishing', filters.furnishing);
    if (filters.property_type) query = query.eq('property_type', filters.property_type);
    if (filters.min_rent) query = query.gte('rent', parseFloat(filters.min_rent));
    if (filters.max_rent) query = query.lte('rent', parseFloat(filters.max_rent));
    if (filters.search) query = query.or(`title.ilike.%${filters.search}%,address.ilike.%${filters.search}%`);

    const { data } = await query;
    setProperties((data as Property[]) || []);
    setLoading(false);
  };

  const getPrimaryImage = (images: Property['property_images']) => {
    const primary = images?.find(i => i.is_primary);
    return primary?.image_url || images?.[0]?.image_url;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Browse Properties</h1>
          <p className="text-muted-foreground text-sm">{properties.length} properties found</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowMap(!showMap)}>
          {showMap ? <><List className="h-4 w-4 mr-1" /> List</> : <><Map className="h-4 w-4 mr-1" /> Map</>}
        </Button>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <PropertyFilters filters={filters} onChange={setFilters} onClear={() => setFilters(defaultFilters)} />
        </div>

        <div className="lg:col-span-3">
          {showMap ? (
            <PropertyMap properties={properties} />
          ) : loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No properties found. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {properties.map(p => (
                <PropertyCard
                  key={p.id}
                  {...p}
                  image_url={getPrimaryImage(p.property_images)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
