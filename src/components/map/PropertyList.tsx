import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, BedDouble, Maximize, CheckCircle, Zap } from 'lucide-react';
import type { MapProperty } from '@/hooks/useMapBounds';

interface Props {
  properties: MapProperty[];
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
  loading: boolean;
}

function formatRent(rent: number) {
  return `₹${rent.toLocaleString('en-IN')}`;
}

export default function PropertyList({ properties, selectedId, onHover, onClick, loading }: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Scroll to selected card
  useEffect(() => {
    if (selectedId && cardRefs.current.has(selectedId)) {
      cardRefs.current.get(selectedId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedId]);

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl bg-secondary h-28" />
        ))}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <MapPin className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground text-sm">No properties in this area.<br/>Try zooming out or searching a different location.</p>
      </div>
    );
  }

  return (
    <div ref={listRef} className="space-y-2 p-3 overflow-y-auto h-full">
      {properties.map(p => (
        <div
          key={p.id}
          ref={el => { if (el) cardRefs.current.set(p.id, el); }}
          className={`rounded-xl border transition-all duration-200 cursor-pointer group
            ${selectedId === p.id
              ? 'border-primary bg-primary/5 shadow-card-hover'
              : 'border-border bg-card hover:border-primary/30 hover:shadow-card'
            }`}
          onMouseEnter={() => onHover(p.id)}
          onMouseLeave={() => onHover(null)}
          onClick={() => onClick(p.id)}
        >
          <div className="flex gap-3 p-3">
            {/* Image */}
            <div className="w-24 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-secondary">
              {p.image_url ? (
                <img src={p.image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <BedDouble className="h-6 w-6" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-heading font-semibold text-sm text-foreground line-clamp-1">{p.title}</h3>
                <span className="font-heading font-bold text-primary text-sm whitespace-nowrap">
                  {formatRent(p.rent)}<span className="text-muted-foreground font-normal text-xs">/mo</span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 line-clamp-1">
                <MapPin className="h-3 w-3 flex-shrink-0" /> {p.address}
              </p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <BedDouble className="h-3 w-3" /> {p.bhk} BHK
                </span>
                {p.area_sqft && (
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                    <Maximize className="h-3 w-3" /> {p.area_sqft} sqft
                  </span>
                )}
                <span className="text-xs text-muted-foreground capitalize">{p.furnishing.replace('-', ' ')}</span>
                {p.is_verified && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold">
                    <CheckCircle className="h-2.5 w-2.5" /> Verified
                  </span>
                )}
                {p.is_instant_move_in && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-accent/15 text-accent text-[10px] font-semibold">
                    <Zap className="h-2.5 w-2.5" /> Instant
                  </span>
                )}
              </div>
            </div>
          </div>
          {/* Link to detail */}
          <Link to={`/property/${p.id}`} className="block px-3 pb-2">
            <span className="text-[11px] text-primary hover:underline font-medium">View Details →</span>
          </Link>
        </div>
      ))}
    </div>
  );
}
