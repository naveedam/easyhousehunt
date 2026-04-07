import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BHK_OPTIONS, FURNISHING_OPTIONS, PROPERTY_TYPES } from '@/lib/constants';

export interface SearchFilters {
  search: string;
  bhk: string;
  furnishing: string;
  property_type: string;
  min_rent: string;
  max_rent: string;
}

export const defaultSearchFilters: SearchFilters = {
  search: '',
  bhk: '',
  furnishing: '',
  property_type: '',
  min_rent: '',
  max_rent: '',
};

interface Props {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  propertyCount: number;
}

export default function SearchBar({ filters, onChange, propertyCount }: Props) {
  const [showFilters, setShowFilters] = useState(false);
  const hasActiveFilters = filters.bhk || filters.furnishing || filters.property_type || filters.min_rent || filters.max_rent;

  return (
    <div className="glass rounded-2xl shadow-elevated">
      {/* Main search row */}
      <div className="flex items-center gap-2 p-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={e => onChange({ ...filters, search: e.target.value })}
            placeholder="Search neighbourhood or area..."
            className="pl-9 bg-secondary/50 border-border/50 h-10 text-sm"
          />
        </div>
        <Button
          variant={hasActiveFilters ? "default" : "secondary"}
          size="sm"
          className="h-10 px-3 gap-1.5"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-accent" />
          )}
        </Button>
        <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">
          {propertyCount} {propertyCount === 1 ? 'property' : 'properties'}
        </span>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="px-3 pb-3 border-t border-border/50">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3">
            <Select value={filters.bhk} onValueChange={v => onChange({ ...filters, bhk: v === 'all' ? '' : v })}>
              <SelectTrigger className="h-9 text-xs bg-secondary/50">
                <SelectValue placeholder="BHK" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any BHK</SelectItem>
                {BHK_OPTIONS.map(b => (
                  <SelectItem key={b} value={String(b)}>{b} BHK</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.furnishing} onValueChange={v => onChange({ ...filters, furnishing: v === 'all' ? '' : v })}>
              <SelectTrigger className="h-9 text-xs bg-secondary/50">
                <SelectValue placeholder="Furnishing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                {FURNISHING_OPTIONS.map(f => (
                  <SelectItem key={f} value={f} className="capitalize">{f.replace('-', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.property_type} onValueChange={v => onChange({ ...filters, property_type: v === 'all' ? '' : v })}>
              <SelectTrigger className="h-9 text-xs bg-secondary/50">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Type</SelectItem>
                {PROPERTY_TYPES.map(t => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              value={filters.min_rent}
              onChange={e => onChange({ ...filters, min_rent: e.target.value })}
              placeholder="Min ₹"
              className="h-9 text-xs bg-secondary/50"
            />
            <Input
              type="number"
              value={filters.max_rent}
              onChange={e => onChange({ ...filters, max_rent: e.target.value })}
              placeholder="Max ₹"
              className="h-9 text-xs bg-secondary/50"
            />
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-xs text-muted-foreground hover:text-foreground gap-1"
              onClick={() => onChange(defaultSearchFilters)}
            >
              <X className="h-3 w-3" /> Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
