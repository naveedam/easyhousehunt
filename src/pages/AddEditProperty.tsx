import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { PROPERTY_TYPES, BHK_OPTIONS, FURNISHING_OPTIONS, AMENITIES_LIST } from '@/lib/constants';
import { ArrowLeft, Upload, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AddEditProperty() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', property_type: 'apartment', bhk: 2, rent: '',
    deposit: '', furnishing: 'semi-furnished', area_sqft: '', address: '',
    latitude: '', longitude: '', availability_date: '', amenities: [] as string[],
  });

  useEffect(() => {
    if (isEdit) fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    const { data } = await supabase.from('properties').select('*').eq('id', id!).single();
    if (data) {
      setForm({
        title: data.title, description: data.description || '', property_type: data.property_type,
        bhk: data.bhk, rent: String(data.rent), deposit: data.deposit ? String(data.deposit) : '',
        furnishing: data.furnishing, area_sqft: data.area_sqft ? String(data.area_sqft) : '',
        address: data.address, latitude: data.latitude ? String(data.latitude) : '',
        longitude: data.longitude ? String(data.longitude) : '',
        availability_date: data.availability_date || '', amenities: data.amenities || [],
      });
    }
  };

  const update = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const toggleAmenity = (a: string) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(a) ? prev.amenities.filter(x => x !== a) : [...prev.amenities, a],
    }));
  };

  const handleImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !id) return;
    setUploading(true);
    for (const file of Array.from(e.target.files)) {
      const path = `${user!.id}/${id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('property-images').upload(path, file);
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('property-images').getPublicUrl(path);
        await supabase.from('property_images').insert({ property_id: id, image_url: publicUrl });
      }
    }
    setUploading(false);
    toast({ title: 'Images uploaded!' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const payload = {
      landlord_id: user.id,
      title: form.title,
      description: form.description || null,
      property_type: form.property_type,
      bhk: form.bhk,
      rent: parseFloat(form.rent),
      deposit: form.deposit ? parseFloat(form.deposit) : null,
      furnishing: form.furnishing,
      area_sqft: form.area_sqft ? parseInt(form.area_sqft) : null,
      address: form.address,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      availability_date: form.availability_date || null,
      amenities: form.amenities,
    };

    let error;
    if (isEdit) {
      ({ error } = await supabase.from('properties').update(payload).eq('id', id!));
    } else {
      ({ error } = await supabase.from('properties').insert(payload));
    }

    if (error) {
      toast({ variant: 'destructive', title: 'Failed to save property', description: error.message });
    } else {
      toast({ title: isEdit ? 'Property updated!' : 'Property submitted for review!' });
      navigate('/landlord');
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <Link to="/landlord" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to dashboard
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">{isEdit ? 'Edit Property' : 'Add New Property'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input placeholder="Property Title *" value={form.title} onChange={e => update('title', e.target.value)} required />
            <Textarea placeholder="Description" value={form.description} onChange={e => update('description', e.target.value)} rows={3} />
            <Input placeholder="Full Address *" value={form.address} onChange={e => update('address', e.target.value)} required />

            <div className="grid grid-cols-2 gap-3">
              <Select value={form.property_type} onValueChange={v => update('property_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={String(form.bhk)} onValueChange={v => update('bhk', parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BHK_OPTIONS.map(b => <SelectItem key={b} value={String(b)}>{b} BHK</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="Rent (₹/month) *" value={form.rent} onChange={e => update('rent', e.target.value)} required />
              <Input type="number" placeholder="Deposit (₹)" value={form.deposit} onChange={e => update('deposit', e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select value={form.furnishing} onValueChange={v => update('furnishing', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FURNISHING_OPTIONS.map(f => <SelectItem key={f} value={f} className="capitalize">{f.replace('-', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" placeholder="Area (sqft)" value={form.area_sqft} onChange={e => update('area_sqft', e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input type="number" step="any" placeholder="Latitude" value={form.latitude} onChange={e => update('latitude', e.target.value)} />
              <Input type="number" step="any" placeholder="Longitude" value={form.longitude} onChange={e => update('longitude', e.target.value)} />
            </div>

            <Input type="date" value={form.availability_date} onChange={e => update('availability_date', e.target.value)} />

            <div>
              <p className="text-sm font-medium mb-2">Amenities</p>
              <div className="flex flex-wrap gap-3">
                {AMENITIES_LIST.map(a => (
                  <label key={a} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <Checkbox checked={form.amenities.includes(a)} onCheckedChange={() => toggleAmenity(a)} />
                    {a}
                  </label>
                ))}
              </div>
            </div>

            {isEdit && (
              <div>
                <p className="text-sm font-medium mb-2">Upload Photos</p>
                <label className="flex items-center gap-2 p-3 border border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <span className="text-sm text-muted-foreground">{uploading ? 'Uploading...' : 'Click to upload images'}</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImages} disabled={uploading} />
                </label>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Property' : 'Submit for Review'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
