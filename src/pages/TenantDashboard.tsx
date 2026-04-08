import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSavedProperties } from '@/hooks/useSavedProperties';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChatModal from '@/modules/chat/ChatModal';
import { MessageSquare, CreditCard, Loader2, CalendarDays, Heart, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TenantDashboard() {
  const { user } = useAuth();
  const { savedProperties, loading: savedLoading, toggleSave } = useSavedProperties();
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeEnquiryId, setActiveEnquiryId] = useState<string | null>(null);
  const [chatParticipants, setChatParticipants] = useState<any[]>([]);
  const [chatTitle, setChatTitle] = useState('');

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const [enqRes, bookRes] = await Promise.all([
      supabase.from('enquiries').select('*, properties(title, address, landlord_id)').eq('tenant_id', user!.id).order('created_at', { ascending: false }),
      supabase.from('bookings').select('*, properties(title, address)').eq('tenant_id', user!.id).order('created_at', { ascending: false }),
    ]);
    setEnquiries(enqRes.data || []);
    setBookings(bookRes.data || []);
    setLoading(false);
  };

  const openChat = async (enquiry: any) => {
    const landlordId = (enquiry.properties as any)?.landlord_id;
    let ownerName = 'Owner';
    if (landlordId) {
      const { data } = await supabase.from('profiles').select('full_name').eq('user_id', landlordId).single();
      ownerName = data?.full_name || 'Owner';
    }
    setChatParticipants([
      { id: user!.id, name: 'You', role: 'tenant' },
      { id: landlordId, name: ownerName, role: 'owner' },
    ]);
    setChatTitle((enquiry.properties as any)?.title || 'Chat');
    setActiveEnquiryId(enquiry.id);
    setChatOpen(true);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <h1 className="font-heading text-2xl font-bold mb-6">My Dashboard</h1>

      <Tabs defaultValue="enquiries">
        <TabsList>
          <TabsTrigger value="enquiries"><MessageSquare className="h-4 w-4 mr-1" /> Enquiries</TabsTrigger>
          <TabsTrigger value="bookings"><CreditCard className="h-4 w-4 mr-1" /> Bookings</TabsTrigger>
          <TabsTrigger value="saved"><Heart className="h-4 w-4 mr-1" /> Saved</TabsTrigger>
        </TabsList>

        <TabsContent value="enquiries" className="mt-4 space-y-3">
          {enquiries.map(e => (
            <Card key={e.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{(e.properties as any)?.title}</p>
                    <p className="text-xs text-muted-foreground">{(e.properties as any)?.address}</p>
                    {e.visit_date && <p className="text-xs text-primary mt-1 flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {e.visit_date}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">{e.status}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => openChat(e)}>
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {enquiries.length === 0 && <p className="text-center text-muted-foreground py-8">No enquiries yet.</p>}
        </TabsContent>

        <TabsContent value="bookings" className="mt-4 space-y-3">
          {bookings.map(b => (
            <Card key={b.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{(b.properties as any)?.title}</p>
                    <p className="text-xs text-muted-foreground">Token: ₹{Number(b.token_amount).toLocaleString('en-IN')}</p>
                  </div>
                  <Badge variant="secondary" className="capitalize">{b.booking_status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {bookings.length === 0 && <p className="text-center text-muted-foreground py-8">No bookings yet.</p>}
        </TabsContent>

        <TabsContent value="saved" className="mt-4 space-y-3">
          {savedProperties.map((p: any) => (
            <Card key={p.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <Link to={`/property/${p.id}`} className="flex-1">
                    <p className="font-medium text-sm hover:text-primary">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.address} · {p.bhk} BHK · ₹{Number(p.rent).toLocaleString('en-IN')}/mo</p>
                  </Link>
                  <Button size="sm" variant="ghost" onClick={() => toggleSave(p.id)}>
                    <Heart className="h-4 w-4 fill-destructive text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {savedProperties.length === 0 && <p className="text-center text-muted-foreground py-8">No saved properties yet.</p>}
        </TabsContent>
      </Tabs>

      <ChatModal
        open={chatOpen}
        onOpenChange={setChatOpen}
        enquiryId={activeEnquiryId}
        propertyTitle={chatTitle}
        participants={chatParticipants}
      />
    </div>
  );
}
