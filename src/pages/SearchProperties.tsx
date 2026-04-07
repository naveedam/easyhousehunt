import { useState, useMemo } from 'react';
import { useMapBounds } from '@/hooks/useMapBounds';
import MapView from '@/components/map/MapView';
import PropertyList from '@/components/map/PropertyList';
import SearchBar, { SearchFilters, defaultSearchFilters } from '@/components/map/SearchBar';
import MobileBottomSheet from '@/components/map/MobileBottomSheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function SearchProperties() {
  const { properties, loading, mapMoved, updateBounds, searchThisArea, fetchInBounds, bounds } = useMapBounds();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>(defaultSearchFilters);
  const isMobile = useIsMobile();

  // Client-side filter on loaded properties
  const filtered = useMemo(() => {
    let result = properties;
    if (filters.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(p => p.title.toLowerCase().includes(s) || p.address.toLowerCase().includes(s));
    }
    if (filters.bhk) result = result.filter(p => p.bhk === parseInt(filters.bhk));
    if (filters.furnishing) result = result.filter(p => p.furnishing === filters.furnishing);
    if (filters.property_type) result = result.filter(p => p.property_type === filters.property_type);
    if (filters.min_rent) result = result.filter(p => p.rent >= parseFloat(filters.min_rent));
    if (filters.max_rent) result = result.filter(p => p.rent <= parseFloat(filters.max_rent));
    return result;
  }, [properties, filters]);

  const handlePropertyClick = (id: string) => {
    setSelectedId(prev => prev === id ? null : id);
  };

  return (
    <div className="fixed inset-0 flex flex-col">
      {/* Full-screen layout */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Sidebar - desktop */}
        {!isMobile && (
          <div className="w-[380px] xl:w-[420px] flex-shrink-0 flex flex-col bg-background border-r border-border z-10">
            <div className="p-3 border-b border-border">
              <SearchBar filters={filters} onChange={setFilters} propertyCount={filtered.length} />
            </div>
            <div className="flex-1 overflow-hidden">
              <PropertyList
                properties={filtered}
                selectedId={selectedId}
                onHover={setHoveredId}
                onClick={handlePropertyClick}
                loading={loading}
              />
            </div>
          </div>
        )}

        {/* Map */}
        <div className="flex-1 relative">
          <MapView
            properties={filtered}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onBoundsChange={updateBounds}
            onPropertyClick={handlePropertyClick}
          />

          {/* Mobile search bar overlay */}
          {isMobile && (
            <div className="absolute top-3 left-3 right-3 z-20">
              <SearchBar filters={filters} onChange={setFilters} propertyCount={filtered.length} />
            </div>
          )}

          {/* Search this area button */}
          {mapMoved && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20" style={isMobile ? { top: '80px' } : {}}>
              <Button
                size="sm"
                className="glass-strong rounded-full shadow-elevated gap-2 text-xs font-heading font-semibold px-4 hover:scale-105 transition-transform"
                onClick={searchThisArea}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Search this area
              </Button>
            </div>
          )}
        </div>

        {/* Mobile bottom sheet */}
        {isMobile && (
          <MobileBottomSheet
            properties={filtered}
            selectedId={selectedId}
            onHover={setHoveredId}
            onClick={handlePropertyClick}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}
