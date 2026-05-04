import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData, type Product } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Coffee, Scissors, Wrench, MapPin, CalendarIcon, ArrowLeft, ShoppingBag, LogOut, Heart, LayoutDashboard } from 'lucide-react';
import { LocationMap } from '@/components/LocationMap';
import { toast } from 'sonner';
import { format, isBefore, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProductCard } from '@/components/ProductCard';
import { formatDistance, hasCoords, haversineKm } from '@/lib/geo';

const CATEGORY_DEFINITIONS = [
  { name: 'Cafés & Bakeries', icon: Coffee },
  { name: 'Hair Salons', icon: Scissors },
  { name: 'Equipment Rentals', icon: Wrench },
] as const;

const ExplorePage = () => {
  const { user, logout } = useAuth();
  const { businesses, products, addReservation } = useData();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
  const [bookingProduct, setBookingProduct] = useState<Product | null>(null);
  const [bookingDate, setBookingDate] = useState<Date>();
  const [bookingTime, setBookingTime] = useState('10:00');
  const [bookingQty, setBookingQty] = useState(1);

  const customerPoint = useMemo(() => (hasCoords(user) ? user : null), [user]);

  const distanceTo = (b: { latitude?: number | null; longitude?: number | null }) => {
    if (!customerPoint || !hasCoords(b)) return null;
    return haversineKm(customerPoint, b);
  };

  // Categories are "active" only when a vendor has actually added a business in them.
  const categories = useMemo(
    () =>
      CATEGORY_DEFINITIONS.map(c => {
        const count = businesses.filter(b => b.category === c.name).length;
        return { ...c, count, active: count > 0 };
      }),
    [businesses],
  );

  const activeBusiness = businesses.find(b => b.id === selectedBusiness);
  const businessProducts = products.filter(p => p.business_id === selectedBusiness);
  const categoryBusinesses = useMemo(() => {
    const list = businesses.filter(b => b.category === selectedCategory);
    if (!customerPoint) return list;
    return [...list].sort((a, b) => {
      const da = distanceTo(a);
      const db = distanceTo(b);
      if (da === null && db === null) return 0;
      if (da === null) return 1;
      if (db === null) return -1;
      return da - db;
    });
    // distanceTo depends on customerPoint which is the only relevant input besides the list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businesses, selectedCategory, customerPoint]);

  useEffect(() => {
    if (bookingProduct) setBookingQty(1);
  }, [bookingProduct?.id]);

  const handleBook = async () => {
    if (!bookingProduct || !bookingDate || !user) return;
    const stock = bookingProduct.quantity ?? 0;
    if (bookingQty < 1 || bookingQty > stock) {
      toast.error(`Choose a quantity between 1 and ${stock}.`);
      return;
    }
    const pickup = `${format(bookingDate, 'yyyy-MM-dd')}T${bookingTime}:00`;
    try {
      await addReservation({
        customer_id: user.id,
        customer_name: user.full_name,
        business_id: bookingProduct.business_id,
        product_id: bookingProduct.id,
        product_name: bookingProduct.name,
        quantity: bookingQty,
        pickup_time: pickup,
      });
      toast.success('Success! Your treat is booked 🎉', {
        description: `${bookingQty}× ${bookingProduct.name} — pickup at ${bookingTime} on ${format(bookingDate, 'PPP')}`,
      });
      setBookingProduct(null);
      setBookingDate(undefined);
      setBookingTime('10:00');
      setBookingQty(1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not complete reservation');
    }
  };

  // Shop View
  if (selectedBusiness && activeBusiness) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setSelectedBusiness(null)} className="gap-2 rounded-xl">
              <ArrowLeft size={18} strokeWidth={2} /> Back
            </Button>
            <span className="font-display font-semibold text-foreground">ShareLoop</span>
            <Button variant="ghost" size="icon" onClick={logout} className="rounded-xl">
              <LogOut size={18} strokeWidth={2} />
            </Button>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-2xl animate-fade-in">
          <div className="bg-gradient-to-br from-primary/10 to-secondary rounded-2xl p-5 sm:p-6 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_220px] gap-4 sm:gap-5 items-stretch">
              <div className="flex items-start gap-4 min-w-0">
                <Avatar className="h-14 w-14 rounded-full ring-2 ring-background shadow-sm shrink-0">
                  <AvatarImage src={(activeBusiness as any).logo_url ?? undefined} alt={activeBusiness.name} />
                  <AvatarFallback className="font-display text-lg bg-primary/10 text-primary">
                    {activeBusiness.name?.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-display font-bold text-foreground mb-1 truncate">
                    {activeBusiness.name}
                  </h1>
                  {activeBusiness.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {activeBusiness.description}
                    </p>
                  )}
                  <div className="space-y-1.5 mt-2 text-xs text-muted-foreground">
                    <div className="flex items-start gap-1">
                      <MapPin
                        size={12}
                        strokeWidth={2}
                        className="shrink-0 mt-0.5"
                      />
                      <span className="break-words">
                        {activeBusiness.address || 'Kokkola, Finland'}
                      </span>
                    </div>
                    {(() => {
                      const km = distanceTo(activeBusiness);
                      return km !== null ? (
                        <Badge variant="secondary" className="rounded-lg">
                          {formatDistance(km)} from you
                        </Badge>
                      ) : null;
                    })()}
                  </div>
                </div>
              </div>
              {hasCoords(activeBusiness) ? (
                <LocationMap
                  vendor={{
                    latitude: activeBusiness.latitude!,
                    longitude: activeBusiness.longitude!,
                    label: activeBusiness.name,
                  }}
                  customer={
                    customerPoint
                      ? {
                          latitude: customerPoint.latitude,
                          longitude: customerPoint.longitude,
                          label: 'You',
                        }
                      : null
                  }
                  className="h-[160px] sm:h-full sm:min-h-[160px]"
                />
              ) : (
                <div className="rounded-xl bg-background/60 border border-border/50 p-4 flex items-center justify-center text-xs text-muted-foreground text-center sm:h-full sm:min-h-[160px]">
                  This shop hasn't shared a location yet.
                </div>
              )}
            </div>
          </div>

          <h2 className="text-xl font-display font-semibold mb-4 text-foreground">Available Items</h2>
          <div className="space-y-4">
            {businessProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onReserve={() => setBookingProduct(product)}
              />
            ))}
            {businessProducts.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No products available yet.</p>
            )}
          </div>
        </div>

        {/* Booking Modal */}
        <Dialog open={!!bookingProduct} onOpenChange={(open) => { if (!open) { setBookingProduct(null); setBookingQty(1); } }}>
          <DialogContent className="rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Reserve {bookingProduct?.name}</DialogTitle>
              <DialogDescription>Pick quantity, date, and time for your pickup.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="booking-qty">Quantity</Label>
                <Input
                  id="booking-qty"
                  type="number"
                  min={1}
                  max={bookingProduct ? Math.max(1, bookingProduct.quantity ?? 0) : 1}
                  step={1}
                  value={bookingQty}
                  onChange={e => {
                    const raw = e.target.value;
                    if (raw === '') {
                      setBookingQty(1);
                      return;
                    }
                    const n = Number.parseInt(raw, 10);
                    if (Number.isNaN(n)) return;
                    const maxStock = bookingProduct
                      ? (bookingProduct.quantity ?? 0)
                      : 1;
                    setBookingQty(Math.min(maxStock, Math.max(1, n)));
                  }}
                  className="rounded-xl"
                />
                {bookingProduct && (
                  <p className="text-xs text-muted-foreground">
                    Up to {bookingProduct.quantity ?? 0} in stock ·{' '}
                    {(bookingProduct.price * bookingQty).toFixed(2)}€ total
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Pickup Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full rounded-xl justify-start text-left font-normal", !bookingDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {bookingDate ? format(bookingDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={bookingDate}
                      onSelect={setBookingDate}
                      disabled={date => isBefore(startOfDay(date), startOfDay(new Date()))}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Pickup Time</Label>
                <Input
                  type="time"
                  value={bookingTime}
                  onChange={e => setBookingTime(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-lg font-bold text-primary">
                  {bookingProduct ? (bookingProduct.price * bookingQty).toFixed(2) : '0'}€
                </span>
              </div>
              <Button
                onClick={() => void handleBook()}
                className="w-full rounded-xl"
                disabled={
                  !bookingDate ||
                  !bookingProduct ||
                  bookingQty < 1 ||
                  bookingQty > (bookingProduct?.quantity ?? 0)
                }
              >
                <Heart size={16} strokeWidth={2} className="mr-2" /> Confirm Reservation
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Category View
  if (selectedCategory) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setSelectedCategory(null)} className="gap-2 rounded-xl">
              <ArrowLeft size={18} strokeWidth={2} /> Back
            </Button>
            <span className="font-display font-semibold text-foreground">ShareLoop</span>
            <Button variant="ghost" size="icon" onClick={logout} className="rounded-xl">
              <LogOut size={18} strokeWidth={2} />
            </Button>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-2xl animate-fade-in">
          <h1 className="text-3xl font-display font-bold mb-6 text-foreground">{selectedCategory}</h1>
          <div className="space-y-4">
            {categoryBusinesses.map(biz => {
              const km = distanceTo(biz);
              return (
                <Card
                  key={biz.id}
                  className="rounded-2xl border-border/50 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setSelectedBusiness(biz.id)}
                >
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Coffee size={24} strokeWidth={2} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{biz.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{biz.description || 'Local business'}</p>
                      {km !== null && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin size={11} strokeWidth={2} />
                          {formatDistance(km)} away
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="rounded-lg shrink-0">{products.filter(p => p.business_id === biz.id).length} items</Badge>
                  </CardContent>
                </Card>
              );
            })}
            {categoryBusinesses.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No businesses in this category yet.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Marketplace Home
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-display text-xl font-bold text-foreground">ShareLoop</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:block">Hi, {user?.full_name} 👋</span>
            {user?.role === 'customer' && (
              <Button asChild variant="ghost" size="icon" className="rounded-xl">
                <Link to="/customer-dashboard" aria-label="My dashboard">
                  <LayoutDashboard size={18} strokeWidth={2} />
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={logout} className="rounded-xl">
              <LogOut size={18} strokeWidth={2} />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl animate-fade-in">
        {/* Hero */}
        <div className="bg-gradient-to-br from-primary/10 via-secondary to-primary/5 rounded-2xl p-8 md:p-12 mb-8 text-center">
          <Badge className="rounded-full mb-4 bg-primary/10 text-primary border-0 px-4 py-1">🇫🇮 Kokkola Region</Badge>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-3">
            Support Local
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Reserve fresh goods and services from your favorite local businesses in Central Ostrobothnia.
          </p>
        </div>

        {/* Categories */}
        <h2 className="text-2xl font-display font-semibold mb-4 text-foreground">Browse Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <Card
                key={cat.name}
                className={cn(
                  "rounded-2xl border-border/50 transition-all relative overflow-hidden",
                  cat.active
                    ? "hover:shadow-lg cursor-pointer hover:-translate-y-1"
                    : "grayscale opacity-60 cursor-not-allowed"
                )}
                onClick={() => cat.active && setSelectedCategory(cat.name)}
              >
                {!cat.active && (
                  <Badge className="absolute top-3 right-3 bg-muted text-muted-foreground border-0 rounded-lg text-xs">
                    Coming Soon
                  </Badge>
                )}
                {cat.active && (
                  <Badge className="absolute top-3 right-3 bg-primary/10 text-primary border-0 rounded-lg text-xs">
                    {cat.count} {cat.count === 1 ? 'shop' : 'shops'}
                  </Badge>
                )}
                <CardContent className="p-6 text-center">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3",
                    cat.active ? "bg-primary/10" : "bg-muted"
                  )}>
                    <Icon size={28} strokeWidth={2} className={cat.active ? "text-primary" : "text-muted-foreground"} />
                  </div>
                  <h3 className="font-semibold text-foreground">{cat.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {cat.active ? 'Browse local shops' : 'No shops yet'}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;
