import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Home } from 'lucide-react';

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await signIn(form.get('email') as string, form.get('password') as string);
      navigate('/');
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Login failed', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await signUp(form.get('email') as string, form.get('password') as string, form.get('name') as string);
      toast({ title: 'Check your email', description: 'We sent a confirmation link.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Signup failed', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center">
              <Home className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="font-heading text-2xl">Welcome to RentEase</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                <Input name="email" type="email" placeholder="Email" required />
                <Input name="password" type="password" placeholder="Password" required />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Login'}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                <Input name="name" placeholder="Full Name" required />
                <Input name="email" type="email" placeholder="Email" required />
                <Input name="password" type="password" placeholder="Password (min 6 chars)" required minLength={6} />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
