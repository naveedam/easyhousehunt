import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChatModal from '@/modules/chat/ChatModal';
import { Plus, Home, MessageSquare, CalendarDays, Loader2, MessageCircle } from 'lucide-react';

export default function LandlordDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeEnquiryId, setActiveEnquiryId] = useState<string | null>(null);
  const [chatParticipants, setChatParticipants] = useState<any[]>([]);
  const [chatTitle, setChatTitle] = useState('');

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const propRes = await supabase.from('properties').select('*').eq('landlord_id', user!.id).order('created_at', { ascending: false });
    const propIds = propRes.data?.map(p => p.id) || [];

    const enqRes = propIds.length > 0
      ? await supabase.from('enquiries').select('*, properties(title)').in('property_id', propIds).order('created_at', { ascending: false })
      : { data: [] };

    setProperties(propRes.data || []);
    setEnquiries(enqRes.data || []);
    setLoading(false);
  };

  const openChat = async (enquiry: any) => {
    const { data: tenantProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', enquiry.tenant_id)
      .single();

    setChatParticipants([
      { id: user!.id, name: 'You', role: 'owner' },
      { id: enquiry.tenant_id, name: tenantProfile?.full_name || 'Tenant', role: 'tenant' },
    ]);
    setChatTitle((enquiry.properties as any)?.title || 'Chat');
    setActiveEnquiryId(enquiry.id);
    setChatOpen(true);
  };

  const statusColor = (s: string) => {
    if (s === 'approved') return 'bg-success text-success-foreground';
    if (s === 'rejected') return 'bg-destructive text-destructive-foreground';
    return 'bg-muted text-muted-foreground';
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold">My Listings</h1>
        <Button onClick={() => navigate('/landlord/add')}>
          <Plus className="h-4 w-4 mr-1" /> Add Property
        </Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="pt-6 text-center">
          <p className="text-3xl font-heading font-bold text-primary">{properties.length}</p>
          <p className="text-sm text-muted-foreground">Total Properties</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <p className="text-3xl font-heading font-bold text-accent">{enquiries.length}</p>
          <p className="text-sm text-muted-foreground">Enquiries</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <p className="text-3xl font-heading font-bold text-success">{properties.filter(p => p.status === 'approved').length}</p>
          <p className="text-sm text-muted-foreground">Live Listings</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="properties">
        <TabsList>
          <TabsTrigger value="properties"><Home className="h-4 w-4 mr-1" /> Properties</TabsTrigger>
          <TabsTrigger value="enquiries"><MessageSquare className="h-4 w-4 mr-1" /> Enquiries</TabsTrigger>
        </TabsList>
        <TabsContent value="properties" className="mt-4 space-y-3">
          {properties.map(p => (
            <Card key={p.id} className="cursor-pointer hover:shadow-card-hover transition-shadow" onClick={() => navigate(`/landlord/edit/${p.id}`)}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <h3 className="font-heading font-semibold">{p.title}</h3>
                  <p className="text-sm text-muted-foreground">{p.address} · ₹{Number(p.rent).toLocaleString('en-IN')}/mo</p>
                </div>
                <Badge className={statusColor(p.status)}>{p.status}</Badge>
              </CardContent>
            </Card>
          ))}
          {properties.length === 0 && <p className="text-center text-muted-foreground py-8">No properties yet. Add your first listing!</p>}
        </TabsContent>
        <TabsContent value="enquiries" className="mt-4 space-y-3">
          {enquiries.map(e => (
            <Card key={e.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{(e.properties as any)?.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{e.message || 'No message'}</p>
                    {e.visit_date && (
                      <p className="text-xs text-primary mt-1 flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" /> Visit: {e.visit_date}
                      </p>
                    )}
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
