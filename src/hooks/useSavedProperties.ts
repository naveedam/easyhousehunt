import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function useSavedProperties() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savedProperties, setSavedProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('saved_properties')
      .select('*, properties(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const items = (data as any[]) || [];
    setSavedProperties(items.map(s => s.properties));
    setSavedIds(new Set(items.map(s => s.property_id)));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchSaved(); }, [fetchSaved]);

  const toggleSave = async (propertyId: string) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Please login to save properties' });
      return;
    }

    if (savedIds.has(propertyId)) {
      await supabase.from('saved_properties').delete().eq('user_id', user.id).eq('property_id', propertyId);
      setSavedIds(prev => { const n = new Set(prev); n.delete(propertyId); return n; });
      toast({ title: 'Removed from saved' });
    } else {
      await supabase.from('saved_properties').insert({ user_id: user.id, property_id: propertyId });
      setSavedIds(prev => new Set(prev).add(propertyId));
      toast({ title: 'Property saved!' });
    }
    fetchSaved();
  };

  const isSaved = (propertyId: string) => savedIds.has(propertyId);

  return { savedProperties, savedIds, loading, toggleSave, isSaved };
}
