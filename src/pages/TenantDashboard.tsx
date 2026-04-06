import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, CreditCard, Loader2, CalendarDays } from 'lucide-react';

export default function TenantDashboard() {
  const { user } = useAuth();
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const [enqRes, bookRes] = await Promise.all([
      supabase.from('enquiries').select('*, properties(title, address)').eq('tenant_id', user!.id).order('created_at', { ascending: false }),
      supabase.from('bookings').select('*, properties(title, address)').eq('tenant_id', user!.id).order('created_at', { ascending: false }),
    ]);
    setEnquiries(enqRes.data || []);
    setBookings(bookRes.data || []);
    setLoading(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <h1 className="font-heading text-2xl font-bold mb-6">My Dashboard</h1>

      <Tabs defaultValue="enquiries">
        <TabsList>
          <TabsTrigger value="enquiries"><MessageSquare className="h-4 w-4 mr-1" /> My Enquiries</TabsTrigger>
          <TabsTrigger value="bookings"><CreditCard className="h-4 w-4 mr-1" /> My Bookings</TabsTrigger>
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
                  <Badge variant="secondary" className="capitalize">{e.status}</Badge>
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
      </Tabs>
    </div>
  );
}
