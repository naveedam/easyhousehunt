import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle, Zap, MapPin, BedDouble, Maximize, Phone, MessageCircle,
  CalendarDays, IndianRupee, Loader2, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [property, setProperty] = useState<any>(null);
  const [landlord, setLandlord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enquiryMsg, setEnquiryMsg] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (id) fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    const { data } = await supabase
      .from('properties')
      .select('*, property_images(*)')
      .eq('id', id!)
      .single();

    if (data) {
      setProperty(data);
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('user_id', data.landlord_id)
        .single();
      setLandlord(profile);
    }
    setLoading(false);
  };

  const handleEnquiry = async () => {
    if (!user) { toast({ variant: 'destructive', title: 'Please login first' }); return; }
    setSending(true);
    const { error } = await supabase.from('enquiries').insert({
      property_id: id!,
      tenant_id: user.id,
      message: enquiryMsg,
      visit_date: visitDate || null,
    });
    if (error) toast({ variant: 'destructive', title: 'Failed to send enquiry' });
    else {
      toast({ title: 'Enquiry sent!', description: 'The landlord will contact you soon.' });
      setEnquiryMsg('');
      setVisitDate('');
    }
    setSending(false);
  };

  const whatsappLink = landlord?.phone
    ? `https://wa.me/${landlord.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I'm interested in "${property?.title}". Is it still available?`)}`
    : null;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (!property) return (
    <div className="text-center py-20">
      <p className="text-muted-foreground">Property not found.</p>
      <Button asChild variant="link" className="mt-4"><Link to="/search">Back to search</Link></Button>
    </div>
  );

  const images = property.property_images || [];

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <Link to="/search" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to search
      </Link>

      {/* Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {images.length > 0 ? images.slice(0, 4).map((img: any, i: number) => (
          <div key={img.id} className={`rounded-xl overflow-hidden bg-muted ${i === 0 ? 'md:row-span-2 h-64 md:h-full' : 'h-48'}`}>
            <img src={img.image_url} alt={property.title} className="w-full h-full object-cover" />
          </div>
        )) : (
          <div className="col-span-2 h-64 bg-muted rounded-xl flex items-center justify-center">
            <BedDouble className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {property.is_verified && (
                <Badge className="bg-primary text-primary-foreground gap-1"><CheckCircle className="h-3 w-3" /> Verified</Badge>
              )}
              {property.is_instant_move_in && (
                <Badge className="bg-accent text-accent-foreground gap-1"><Zap className="h-3 w-3" /> Instant Move-in</Badge>
              )}
              <Badge variant="secondary" className="capitalize">{property.property_type}</Badge>
            </div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold mb-2">{property.title}</h1>
            <p className="text-muted-foreground flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {property.address}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: IndianRupee, label: 'Rent', value: `₹${Number(property.rent).toLocaleString('en-IN')}/mo` },
              { icon: IndianRupee, label: 'Deposit', value: property.deposit ? `₹${Number(property.deposit).toLocaleString('en-IN')}` : 'N/A' },
              { icon: BedDouble, label: 'Config', value: `${property.bhk} BHK` },
              { icon: Maximize, label: 'Area', value: property.area_sqft ? `${property.area_sqft} sqft` : 'N/A' },
            ].map(item => (
              <div key={item.label} className="bg-card border rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                <p className="font-heading font-semibold text-sm">{item.value}</p>
              </div>
            ))}
          </div>

          {property.description && (
            <div>
              <h2 className="font-heading font-semibold text-lg mb-2">Description</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{property.description}</p>
            </div>
          )}

          <div>
            <h2 className="font-heading font-semibold text-lg mb-2">Details</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between bg-muted/50 rounded-lg p-2">
                <span className="text-muted-foreground">Furnishing</span>
                <span className="capitalize font-medium">{property.furnishing.replace('-', ' ')}</span>
              </div>
              <div className="flex justify-between bg-muted/50 rounded-lg p-2">
                <span className="text-muted-foreground">Available</span>
                <span className="font-medium">{property.availability_date || 'Immediately'}</span>
              </div>
            </div>
          </div>

          {property.amenities?.length > 0 && (
            <div>
              <h2 className="font-heading font-semibold text-lg mb-2">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((a: string) => (
                  <Badge key={a} variant="secondary">{a}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {landlord && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-heading">Landlord</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="font-medium">{landlord.full_name || 'Property Owner'}</p>
                {landlord.phone && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <a href={`tel:${landlord.phone}`}><Phone className="h-4 w-4 mr-1" /> Call</a>
                    </Button>
                    {whatsappLink && (
                      <Button size="sm" className="flex-1 bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-primary-foreground" asChild>
                        <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <CalendarDays className="h-4 w-4" /> Request a Visit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} />
              <Textarea
                placeholder="Hi, I'd like to visit this property..."
                value={enquiryMsg}
                onChange={e => setEnquiryMsg(e.target.value)}
                rows={3}
              />
              <Button className="w-full" onClick={handleEnquiry} disabled={sending}>
                {sending ? 'Sending...' : 'Request Visit'}
              </Button>
            </CardContent>
          </Card>

          <Button className="w-full gradient-warm text-accent-foreground font-heading" size="lg">
            <IndianRupee className="h-4 w-4 mr-1" /> Book Now with Token
          </Button>
        </div>
      </div>
    </div>
  );
}
