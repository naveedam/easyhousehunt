import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { BHK_OPTIONS, FURNISHING_OPTIONS, PROPERTY_TYPES } from '@/lib/constants';

export interface Filters {
  search: string;
  bhk: string;
  furnishing: string;
  property_type: string;
  min_rent: string;
  max_rent: string;
}

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onClear: () => void;
}

export const defaultFilters: Filters = {
  search: '', bhk: '', furnishing: '', property_type: '', min_rent: '', max_rent: '',
};

export default function PropertyFilters({ filters, onChange, onClear }: Props) {
  const update = (key: keyof Filters, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const hasFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="bg-card rounded-xl border p-4 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <SlidersHorizontal className="h-4 w-4 text-primary" />
        <span className="font-heading font-semibold text-sm">Filters</span>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="ml-auto text-xs" onClick={onClear}>
            <X className="h-3 w-3 mr-1" /> Clear
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search location, property..."
          className="pl-9"
          value={filters.search}
          onChange={e => update('search', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Select value={filters.bhk} onValueChange={v => update('bhk', v === 'all' ? '' : v)}>
          <SelectTrigger className="text-xs"><SelectValue placeholder="BHK" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any BHK</SelectItem>
            {BHK_OPTIONS.map(b => <SelectItem key={b} value={String(b)}>{b} BHK</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.furnishing} onValueChange={v => update('furnishing', v === 'all' ? '' : v)}>
          <SelectTrigger className="text-xs"><SelectValue placeholder="Furnishing" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any</SelectItem>
            {FURNISHING_OPTIONS.map(f => <SelectItem key={f} value={f} className="capitalize">{f.replace('-', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.property_type} onValueChange={v => update('property_type', v === 'all' ? '' : v)}>
          <SelectTrigger className="text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Type</SelectItem>
            {PROPERTY_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="flex gap-1">
          <Input
            type="number"
            placeholder="Min ₹"
            className="text-xs"
            value={filters.min_rent}
            onChange={e => update('min_rent', e.target.value)}
          />
          <Input
            type="number"
            placeholder="Max ₹"
            className="text-xs"
            value={filters.max_rent}
            onChange={e => update('max_rent', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
