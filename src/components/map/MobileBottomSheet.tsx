import { useRef, useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, X } from 'lucide-react';
import type { MapProperty } from '@/hooks/useMapBounds';
import PropertyList from './PropertyList';

interface Props {
  properties: MapProperty[];
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
  loading: boolean;
}

type SheetState = 'collapsed' | 'half' | 'full';

export default function MobileBottomSheet({ properties, selectedId, onHover, onClick, loading }: Props) {
  const [state, setState] = useState<SheetState>('collapsed');
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const startState = useRef<SheetState>('collapsed');

  const heights: Record<SheetState, string> = {
    collapsed: 'h-16',
    half: 'h-[50vh]',
    full: 'h-[85vh]',
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    startState.current = state;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = startY.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) < 30) return;
    if (diff > 0) {
      // Swipe up
      setState(s => s === 'collapsed' ? 'half' : s === 'half' ? 'full' : 'full');
    } else {
      // Swipe down
      setState(s => s === 'full' ? 'half' : s === 'half' ? 'collapsed' : 'collapsed');
    }
  };

  return (
    <div
      ref={sheetRef}
      className={`fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border rounded-t-2xl transition-all duration-300 ease-out ${heights[state]}`}
    >
      {/* Handle bar */}
      <div
        className="flex items-center justify-center py-2 cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => setState(s => s === 'collapsed' ? 'half' : s === 'half' ? 'full' : 'collapsed')}
      >
        <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
      </div>

      {/* Summary row when collapsed */}
      {state === 'collapsed' && (
        <div className="px-4 pb-2 flex items-center justify-between">
          <span className="text-sm font-heading font-semibold">
            {properties.length} {properties.length === 1 ? 'property' : 'properties'} found
          </span>
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* List when expanded */}
      {state !== 'collapsed' && (
        <div className="overflow-hidden" style={{ height: 'calc(100% - 32px)' }}>
          <PropertyList
            properties={properties}
            selectedId={selectedId}
            onHover={onHover}
            onClick={(id) => { onClick(id); setState('collapsed'); }}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
}
