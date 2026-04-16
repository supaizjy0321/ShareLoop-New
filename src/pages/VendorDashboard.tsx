import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, DollarSign, Clock, Plus, Trash2, Check, X, Store, LogOut, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const VendorDashboard = () => {
  const { user, logout } = useAuth();
  const { businesses, products, reservations, addBusiness, updateBusiness, addProduct, removeProduct, updateReservationStatus } = useData();

  const myBusiness = businesses.find(b => b.owner_id === user?.id);
  const myProducts = products.filter(p => p.business_id === myBusiness?.id);
  const myReservations = reservations.filter(r => r.business_id === myBusiness?.id);
  const pendingCount = myReservations.filter(r => r.status === 'pending').length;
  const totalRevenue = myReservations.filter(r => r.status === 'approved').reduce((sum, r) => {
    const prod = products.find(p => p.id === r.product_id);
    return sum + (prod?.price || 0);
  }, 0);

  // Business form
  const [bizName, setBizName] = useState(myBusiness?.name || '');
  const [bizDesc, setBizDesc] = useState(myBusiness?.description || '');
  const [bizCategory, setBizCategory] = useState(myBusiness?.category || 'Cafés & Bakeries');

  // Product form
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');

  const handleSaveBusiness = () => {
    if (!bizName.trim()) return toast.error('Business name is required');
    if (myBusiness) {
      updateBusiness(myBusiness.id, { name: bizName, description: bizDesc, category: bizCategory });
      toast.success('Business updated!');
    } else if (user) {
      addBusiness({ name: bizName, description: bizDesc, category: bizCategory, owner_id: user.id });
      toast.success('Business created!');
    }
  };

  const handleAddProduct = () => {
    if (!prodName.trim() || !prodPrice) return toast.error('Fill in all fields');
    if (!myBusiness) return toast.error('Create your business first');
    addProduct({ name: prodName, price: parseFloat(prodPrice), business_id: myBusiness.id });
    setProdName('');
    setProdPrice('');
    toast.success('Product added!');
  };

  const handleApprove = (id: string) => {
    updateReservationStatus(id, 'approved');
    toast.success('Order approved ✅');
  };

  const handleReject = (id: string) => {
    updateReservationStatus(id, 'rejected');
    toast('Order rejected');
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-warning/10 text-warning border-0 rounded-lg">Pending</Badge>;
      case 'approved': return <Badge className="bg-success/10 text-success border-0 rounded-lg">Approved</Badge>;
      case 'rejected': return <Badge variant="secondary" className="rounded-lg">Rejected</Badge>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-display text-xl font-bold text-foreground">ShareLoop</span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="rounded-lg hidden sm:flex gap-1">
              <Store size={14} strokeWidth={2} /> Vendor
            </Badge>
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.full_name}</span>
            <Button variant="ghost" size="icon" onClick={logout} className="rounded-xl">
              <LogOut size={18} strokeWidth={2} />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl animate-fade-in">
        <h1 className="text-3xl font-display font-bold mb-6 text-foreground">Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-warning/10 rounded-2xl flex items-center justify-center">
                <Clock size={24} strokeWidth={2} className="text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Orders</p>
                <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-success/10 rounded-2xl flex items-center justify-center">
                <DollarSign size={24} strokeWidth={2} className="text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground">{totalRevenue}€</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Package size={24} strokeWidth={2} className="text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Products</p>
                <p className="text-2xl font-bold text-foreground">{myProducts.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList className="rounded-xl">
            <TabsTrigger value="orders" className="rounded-lg gap-1"><ShoppingBag size={14} strokeWidth={2} /> Orders</TabsTrigger>
            <TabsTrigger value="business" className="rounded-lg gap-1"><Store size={14} strokeWidth={2} /> Business</TabsTrigger>
            <TabsTrigger value="products" className="rounded-lg gap-1"><Package size={14} strokeWidth={2} /> Products</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card className="rounded-2xl border-border/50">
              <CardHeader>
                <CardTitle className="font-display">Reservations</CardTitle>
              </CardHeader>
              <CardContent>
                {myReservations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No orders yet. Share your shop link with customers!</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Pickup</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {myReservations.map(r => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{r.customer_name}</TableCell>
                            <TableCell>{r.product_name}</TableCell>
                            <TableCell className="text-sm">
                              {format(new Date(r.pickup_time), 'PPp')}
                            </TableCell>
                            <TableCell>{statusBadge(r.status)}</TableCell>
                            <TableCell className="text-right">
                              {r.status === 'pending' && (
                                <div className="flex gap-2 justify-end">
                                  <Button size="sm" onClick={() => handleApprove(r.id)} className="rounded-xl gap-1 bg-success hover:bg-success/90">
                                    <Check size={14} strokeWidth={2} /> Approve
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleReject(r.id)} className="rounded-xl gap-1">
                                    <X size={14} strokeWidth={2} /> Reject
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="business">
            <Card className="rounded-2xl border-border/50">
              <CardHeader>
                <CardTitle className="font-display">Business Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Input value={bizName} onChange={e => setBizName(e.target.value)} placeholder="My Bakery" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={bizDesc} onChange={e => setBizDesc(e.target.value)} placeholder="A short description..." className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select
                    value={bizCategory}
                    onChange={e => setBizCategory(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option>Cafés & Bakeries</option>
                    <option>Hair Salons</option>
                    <option>Equipment Rentals</option>
                  </select>
                </div>
                <Button onClick={handleSaveBusiness} className="rounded-xl">
                  {myBusiness ? 'Update Business' : 'Create Business'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card className="rounded-2xl border-border/50">
              <CardHeader>
                <CardTitle className="font-display">Inventory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!myBusiness ? (
                  <p className="text-center text-muted-foreground py-4">Create your business first to add products.</p>
                ) : (
                  <>
                    <div className="flex gap-3 items-end">
                      <div className="flex-1 space-y-2">
                        <Label>Product Name</Label>
                        <Input value={prodName} onChange={e => setProdName(e.target.value)} placeholder="Cinnamon Roll" className="rounded-xl" />
                      </div>
                      <div className="w-28 space-y-2">
                        <Label>Price (€)</Label>
                        <Input type="number" value={prodPrice} onChange={e => setProdPrice(e.target.value)} placeholder="5" className="rounded-xl" />
                      </div>
                      <Button onClick={handleAddProduct} className="rounded-xl gap-1">
                        <Plus size={16} strokeWidth={2} /> Add
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {myProducts.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
                          <div>
                            <span className="font-medium text-foreground">{p.name}</span>
                            <span className="text-primary font-bold ml-3">{p.price}€</span>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeProduct(p.id)} className="rounded-xl text-destructive hover:text-destructive">
                            <Trash2 size={16} strokeWidth={2} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VendorDashboard;
