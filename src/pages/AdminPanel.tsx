import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Shield, Home, Users, CreditCard, TrendingUp, Check, X, Loader2, Star, AlertTriangle } from 'lucide-react';

export default function AdminPanel() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [propRes, userRes, bookRes] = await Promise.all([
      supabase.from('properties').select('*, profiles:landlord_id(full_name)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*, user_roles(role)').order('created_at', { ascending: false }),
      supabase.from('bookings').select('*, properties(title), profiles:tenant_id(full_name)').order('created_at', { ascending: false }),
    ]);
    setProperties(propRes.data || []);
    setUsers(userRes.data || []);
    setBookings(bookRes.data || []);
    setLoading(false);
  };

  const updatePropertyStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('properties').update({ status }).eq('id', id);
    if (error) toast({ variant: 'destructive', title: 'Failed to update' });
    else {
      toast({ title: `Property ${status}` });
      setProperties(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    }
  };

  const toggleVerified = async (id: string, current: boolean) => {
    const { error } = await supabase.from('properties').update({ is_verified: !current }).eq('id', id);
    if (error) toast({ variant: 'destructive', title: 'Failed to update' });
    else setProperties(prev => prev.map(p => p.id === id ? { ...p, is_verified: !current } : p));
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    const { error } = await supabase.from('properties').update({ is_featured: !current }).eq('id', id);
    if (error) toast({ variant: 'destructive', title: 'Failed to update' });
    else setProperties(prev => prev.map(p => p.id === id ? { ...p, is_featured: !current } : p));
  };

  if (!hasRole('admin')) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-muted-foreground">Access denied. Admin role required.</p>
    </div>
  );

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const pendingCount = properties.filter(p => p.status === 'pending').length;

  // Flag users with >5 listings
  const userListingCounts: Record<string, number> = {};
  properties.forEach(p => {
    userListingCounts[p.landlord_id] = (userListingCounts[p.landlord_id] || 0) + 1;
  });
  const flaggedUserIds = new Set(Object.entries(userListingCounts).filter(([, c]) => c > 5).map(([id]) => id));

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="font-heading text-2xl font-bold">Admin Panel</h1>
      </div>

      <div className="grid sm:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-6 text-center">
          <p className="text-3xl font-heading font-bold text-primary">{properties.length}</p>
          <p className="text-sm text-muted-foreground">Properties</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <p className="text-3xl font-heading font-bold text-accent">{pendingCount}</p>
          <p className="text-sm text-muted-foreground">Pending Review</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <p className="text-3xl font-heading font-bold">{users.length}</p>
          <p className="text-sm text-muted-foreground">Users</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <p className="text-3xl font-heading font-bold text-success">{bookings.length}</p>
          <p className="text-sm text-muted-foreground">Bookings</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="listings">
        <TabsList>
          <TabsTrigger value="listings"><Home className="h-4 w-4 mr-1" /> Listings</TabsTrigger>
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-1" /> Users</TabsTrigger>
          <TabsTrigger value="bookings"><CreditCard className="h-4 w-4 mr-1" /> Bookings</TabsTrigger>
          <TabsTrigger value="analytics"><TrendingUp className="h-4 w-4 mr-1" /> Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="mt-4 space-y-3">
          {properties.map(p => (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm">{p.title}</h3>
                    {p.is_verified && <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5">Verified</Badge>}
                    {p.is_featured && <Badge className="bg-warning text-warning-foreground text-[10px] px-1.5">Featured</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{p.address} · by {(p.profiles as any)?.full_name || 'Unknown'}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="capitalize">{p.status}</Badge>
                  <Button size="sm" variant="ghost" title="Toggle Verified" onClick={() => toggleVerified(p.id, !!p.is_verified)}>
                    <Check className={`h-4 w-4 ${p.is_verified ? 'text-primary' : 'text-muted-foreground'}`} />
                  </Button>
                  <Button size="sm" variant="ghost" title="Toggle Featured" onClick={() => toggleFeatured(p.id, !!p.is_featured)}>
                    <Star className={`h-4 w-4 ${p.is_featured ? 'text-warning' : 'text-muted-foreground'}`} />
                  </Button>
                  {p.status === 'pending' && (
                    <>
                      <Button size="sm" variant="ghost" className="text-success" onClick={() => updatePropertyStatus(p.id, 'approved')}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updatePropertyStatus(p.id, 'rejected')}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="users" className="mt-4 space-y-3">
          {users.map(u => (
            <Card key={u.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                  <div>
                    <p className="font-medium text-sm">{u.full_name || 'Unnamed'}</p>
                    <p className="text-xs text-muted-foreground">{u.phone || 'No phone'}</p>
                  </div>
                  {flaggedUserIds.has(u.user_id) && (
                    <Badge variant="destructive" className="text-[10px] gap-0.5">
                      <AlertTriangle className="h-3 w-3" /> Flagged
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  {(u.user_roles as any[])?.map((r: any) => (
                    <Badge key={r.role} variant="secondary" className="capitalize text-xs">{r.role}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="bookings" className="mt-4 space-y-3">
          {bookings.map(b => (
            <Card key={b.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-sm">{(b.properties as any)?.title}</p>
                  <p className="text-xs text-muted-foreground">by {(b.profiles as any)?.full_name} · ₹{Number(b.token_amount).toLocaleString('en-IN')}</p>
                </div>
                <Badge variant="secondary" className="capitalize">{b.booking_status}</Badge>
              </CardContent>
            </Card>
          ))}
          {bookings.length === 0 && <p className="text-center text-muted-foreground py-8">No bookings yet.</p>}
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="font-heading">Analytics</CardTitle></CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-muted-foreground">Approval Rate</p>
                  <p className="text-2xl font-heading font-bold text-primary">
                    {properties.length ? Math.round((properties.filter(p => p.status === 'approved').length / properties.length) * 100) : 0}%
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-muted-foreground">Avg Rent</p>
                  <p className="text-2xl font-heading font-bold">
                    ₹{properties.length ? Math.round(properties.reduce((s, p) => s + Number(p.rent), 0) / properties.length).toLocaleString('en-IN') : 0}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-muted-foreground">Flagged Users (&gt;5 listings)</p>
                  <p className="text-2xl font-heading font-bold text-destructive">{flaggedUserIds.size}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-muted-foreground">Featured Listings</p>
                  <p className="text-2xl font-heading font-bold text-warning">{properties.filter(p => p.is_featured).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
