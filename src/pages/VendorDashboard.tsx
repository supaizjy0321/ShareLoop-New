import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, DollarSign, Clock, Plus, Trash2, Check, X, Store, LogOut, ShoppingBag, MapPin, Upload, ImageOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { AddressAutocomplete, type AddressValue } from '@/components/AddressAutocomplete';

const PRODUCT_IMAGE_BUCKET = 'product-images';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const VendorDashboard = () => {
  const { user, logout } = useAuth();
  const { businesses, products, reservations, addBusiness, updateBusiness, addProduct, removeProduct, updateReservationStatus } = useData();

  const myBusiness = businesses.find(b => b.owner_id === user?.id);
  const myProducts = products.filter(p => p.business_id === myBusiness?.id);
  const myReservations = reservations.filter(r => r.business_id === myBusiness?.id);
  const pendingCount = myReservations.filter(r => r.status === 'pending').length;
  const totalRevenue = myReservations.filter(r => r.status === 'approved').reduce((sum, r) => {
    const prod = products.find(p => p.id === r.product_id);
    const qty = r.quantity ?? 1;
    return sum + (prod?.price ?? 0) * qty;
  }, 0);

  // Business form
  const [bizName, setBizName] = useState(myBusiness?.name || '');
  const [bizDesc, setBizDesc] = useState(myBusiness?.description || '');
  const [bizCategory, setBizCategory] = useState(myBusiness?.category || 'Cafés & Bakeries');

  // Product form
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('0');
  const [prodQuantity, setProdQuantity] = useState('0');
  const [prodImageFile, setProdImageFile] = useState<File | null>(null);
  const [prodImagePreview, setProdImagePreview] = useState<string | null>(null);
  const [addingProduct, setAddingProduct] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!prodImageFile) {
      setProdImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(prodImageFile);
    setProdImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [prodImageFile]);

  const handlePickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setProdImageFile(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please pick an image file (jpg, png, webp…).');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('Image must be 5 MB or smaller.');
      e.target.value = '';
      return;
    }
    setProdImageFile(file);
  };

  const clearProductForm = () => {
    setProdName('');
    setProdPrice('0');
    setProdQuantity('0');
    setProdImageFile(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const [bizAddress, setBizAddress] = useState<AddressValue | null>(
    myBusiness && myBusiness.address && myBusiness.latitude != null && myBusiness.longitude != null
      ? {
          address: myBusiness.address,
          latitude: myBusiness.latitude,
          longitude: myBusiness.longitude,
        }
      : null,
  );

  const [savingBusiness, setSavingBusiness] = useState(false);

  useEffect(() => {
    if (!myBusiness) return;
    setBizName(myBusiness.name ?? '');
    setBizDesc(myBusiness.description ?? '');
    setBizCategory(myBusiness.category ?? 'Cafés & Bakeries');
    setBizAddress(
      myBusiness.address && myBusiness.latitude != null && myBusiness.longitude != null
        ? {
            address: myBusiness.address,
            latitude: myBusiness.latitude,
            longitude: myBusiness.longitude,
          }
        : null,
    );
  }, [
    myBusiness?.id,
    myBusiness?.name,
    myBusiness?.description,
    myBusiness?.category,
    myBusiness?.address,
    myBusiness?.latitude,
    myBusiness?.longitude,
  ]);

  const handleSaveBusiness = async () => {
    if (!bizName.trim()) return toast.error('Business name is required');
    const addressFields = {
      address: bizAddress?.address ?? null,
      latitude: bizAddress?.latitude ?? null,
      longitude: bizAddress?.longitude ?? null,
    };

    setSavingBusiness(true);
    try {
      if (myBusiness) {
        await updateBusiness(myBusiness.id, {
          name: bizName,
          description: bizDesc,
          category: bizCategory,
          ...addressFields,
        });
        toast.success('Business updated');
      } else if (user) {
        await addBusiness({
          name: bizName,
          description: bizDesc,
          category: bizCategory,
          owner_id: user.id,
          ...addressFields,
        });
        toast.success('Business created');
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not save business',
      );
    } finally {
      setSavingBusiness(false);
    }
  };

  const handleAddProduct = async () => {
    if (!prodName.trim()) return toast.error('Product name is required');
    if (prodPrice === '' || Number.isNaN(Number.parseFloat(prodPrice)))
      return toast.error('Enter a valid price');
    if (!myBusiness) return toast.error('Create your business first');

    const quantityValue =
      prodQuantity === '' ? 0 : Number.parseInt(prodQuantity, 10);
    if (Number.isNaN(quantityValue) || quantityValue < 0) {
      return toast.error('Quantity must be a non-negative integer');
    }

    setAddingProduct(true);
    try {
      let imageUrl: string | null = null;
      if (prodImageFile) {
        const ext = prodImageFile.name.split('.').pop()?.toLowerCase() ?? 'jpg';
        const objectPath = `${myBusiness.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(PRODUCT_IMAGE_BUCKET)
          .upload(objectPath, prodImageFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: prodImageFile.type,
          });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage
          .from(PRODUCT_IMAGE_BUCKET)
          .getPublicUrl(objectPath);
        imageUrl = publicUrlData.publicUrl;
      }

      await addProduct({
        name: prodName,
        price: Number.parseFloat(prodPrice),
        business_id: myBusiness.id,
        quantity: quantityValue,
        image_url: imageUrl,
      });

      clearProductForm();
      toast.success('Product added');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not add product',
      );
    } finally {
      setAddingProduct(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await updateReservationStatus(id, 'approved');
      toast.success('Order approved ✅');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not approve order');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateReservationStatus(id, 'rejected');
      toast('Order rejected');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not reject order');
    }
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
                          <TableHead className="text-right">Qty</TableHead>
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
                            <TableCell className="text-right tabular-nums">{r.quantity ?? 1}</TableCell>
                            <TableCell className="text-sm">
                              {format(new Date(r.pickup_time), 'PPp')}
                            </TableCell>
                            <TableCell>{statusBadge(r.status)}</TableCell>
                            <TableCell className="text-right">
                              {r.status === 'pending' && (
                                <div className="flex gap-2 justify-end">
                                  <Button size="sm" onClick={() => void handleApprove(r.id)} className="rounded-xl gap-1 bg-success hover:bg-success/90">
                                    <Check size={14} strokeWidth={2} /> Approve
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => void handleReject(r.id)} className="rounded-xl gap-1">
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

          <TabsContent value="business" className="space-y-4">
            {myBusiness && (
              <Card className="rounded-2xl border-success/30 bg-success/5">
                <CardContent className="p-5 flex items-center gap-3">
                  <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center shrink-0">
                    <Check size={20} strokeWidth={2} className="text-success" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate">
                      {myBusiness.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <MapPin size={12} strokeWidth={2} />
                      {myBusiness.address || 'No address yet — add one below'}
                    </p>
                  </div>
                  <Badge className="bg-success/10 text-success border-0 rounded-lg shrink-0">
                    Live
                  </Badge>
                </CardContent>
              </Card>
            )}
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
                  <Label>Business address</Label>
                  <AddressAutocomplete
                    value={bizAddress}
                    onChange={setBizAddress}
                    placeholder="Search a Finnish address…"
                  />
                  {!bizAddress && (
                    <p className="text-xs text-muted-foreground">
                      Customers won't see distance to your shop until you add this.
                    </p>
                  )}
                  {bizAddress && (
                    <p className="text-xs text-muted-foreground">
                      {bizAddress.latitude.toFixed(5)}, {bizAddress.longitude.toFixed(5)}
                    </p>
                  )}
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
                <Button
                  onClick={handleSaveBusiness}
                  disabled={savingBusiness}
                  className="rounded-xl"
                >
                  {savingBusiness
                    ? 'Saving…'
                    : myBusiness
                      ? 'Update Business'
                      : 'Create Business'}
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
                    <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_8rem_8rem] gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="prod-name">Product name</Label>
                        <Input
                          id="prod-name"
                          value={prodName}
                          onChange={e => setProdName(e.target.value)}
                          placeholder=""
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prod-price">Price (€)</Label>
                        <Input
                          id="prod-price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={prodPrice}
                          onChange={e => setProdPrice(e.target.value)}
                          placeholder="0"
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prod-qty">Quantity</Label>
                        <Input
                          id="prod-qty"
                          type="number"
                          min="0"
                          step="1"
                          value={prodQuantity}
                          onChange={e => setProdQuantity(e.target.value)}
                          placeholder="0"
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Picture (optional)</Label>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePickImage}
                        className="hidden"
                      />
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          className="h-20 w-20 rounded-xl border border-dashed border-border bg-secondary/40 hover:bg-secondary flex items-center justify-center text-muted-foreground overflow-hidden shrink-0"
                          aria-label="Pick a picture"
                        >
                          {prodImagePreview ? (
                            <img
                              src={prodImagePreview}
                              alt="Selected preview"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Upload size={20} strokeWidth={2} />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          {prodImageFile ? (
                            <>
                              <p className="text-sm text-foreground truncate">{prodImageFile.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(prodImageFile.size / 1024).toFixed(0)} KB
                              </p>
                            </>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Browse from your laptop. JPG/PNG/WEBP, up to 5 MB.
                            </p>
                          )}
                        </div>
                        {prodImageFile && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setProdImageFile(null);
                              if (imageInputRef.current) imageInputRef.current.value = '';
                            }}
                            className="rounded-xl"
                            aria-label="Remove picture"
                          >
                            <X size={16} strokeWidth={2} />
                          </Button>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={handleAddProduct}
                      disabled={addingProduct}
                      className="rounded-xl gap-1 w-full sm:w-auto"
                    >
                      {addingProduct ? (
                        <>
                          <Loader2 size={16} strokeWidth={2} className="animate-spin" /> Adding…
                        </>
                      ) : (
                        <>
                          <Plus size={16} strokeWidth={2} /> Add product
                        </>
                      )}
                    </Button>

                    <div className="space-y-2 pt-2">
                      {myProducts.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">
                          No products yet. Add your first one above.
                        </p>
                      ) : (
                        myProducts.map(p => (
                          <div key={p.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl">
                            <div className="h-12 w-12 rounded-lg bg-secondary overflow-hidden shrink-0 flex items-center justify-center text-muted-foreground">
                              {p.image_url ? (
                                <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                              ) : (
                                <ImageOff size={18} strokeWidth={2} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">{p.name}</p>
                              <p className="text-xs text-muted-foreground">
                                <span className="text-primary font-bold">{p.price}€</span>
                                {' · '}
                                {p.quantity ?? 0} in stock
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeProduct(p.id)}
                              className="rounded-xl text-destructive hover:text-destructive"
                              aria-label={`Remove ${p.name}`}
                            >
                              <Trash2 size={16} strokeWidth={2} />
                            </Button>
                          </div>
                        ))
                      )}
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
