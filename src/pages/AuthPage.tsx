import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store, ShoppingBag, LogIn, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const AuthPage = () => {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupRole, setSignupRole] = useState<'vendor' | 'customer'>('customer');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(loginEmail, loginPassword);
      toast.success('Welcome back!');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signup(signupEmail, signupPassword, signupName, signupRole);
      toast.success('Account created! Welcome to ShareLoop 🎉');
    } catch (err: any) {
      toast.error(err.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-foreground mb-2">ShareLoop</h1>
          <p className="text-muted-foreground">Support local businesses in Kokkola</p>
        </div>

        <Card className="rounded-2xl shadow-lg border-border/50">
          <Tabs defaultValue="login">
            <CardHeader className="pb-2">
              <TabsList className="grid w-full grid-cols-2 rounded-xl">
                <TabsTrigger value="login" className="rounded-lg gap-2">
                  <LogIn size={16} strokeWidth={2} /> Log In
                </TabsTrigger>
                <TabsTrigger value="signup" className="rounded-lg gap-2">
                  <UserPlus size={16} strokeWidth={2} /> Sign Up
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" placeholder="you@example.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input id="login-password" type="password" placeholder="••••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required className="rounded-xl" />
                  </div>
                  <Button type="submit" className="w-full rounded-xl" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Log In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input id="signup-name" placeholder="Your name" value={signupName} onChange={e => setSignupName(e.target.value)} required className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" placeholder="you@example.com" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" type="password" placeholder="••••••••" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} required className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>I am a...</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSignupRole('customer')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                          signupRole === 'customer'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <ShoppingBag size={24} strokeWidth={2} className={signupRole === 'customer' ? 'text-primary' : 'text-muted-foreground'} />
                        <span className={`text-sm font-medium ${signupRole === 'customer' ? 'text-primary' : 'text-muted-foreground'}`}>Customer</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignupRole('vendor')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                          signupRole === 'vendor'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <Store size={24} strokeWidth={2} className={signupRole === 'vendor' ? 'text-primary' : 'text-muted-foreground'} />
                        <span className={`text-sm font-medium ${signupRole === 'vendor' ? 'text-primary' : 'text-muted-foreground'}`}>Vendor</span>
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full rounded-xl" disabled={isLoading}>
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
