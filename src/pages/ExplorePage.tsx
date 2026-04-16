import React, { useState } from 'react';
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
import { Coffee, Scissors, Wrench, MapPin, Clock, CalendarIcon, ArrowLeft, ShoppingBag, LogOut, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProductCard } from '@/components/ProductCard';

const categories = [
  { name: 'Cafés & Bakeries', icon: Coffee, active: true, color: 'bg-primary' },
  { name: 'Hair Salons', icon: Scissors, active: false, color: 'bg-muted' },
  { name: 'Equipment Rentals', icon: Wrench, active: false, color: 'bg-muted' },
];

const ExplorePage = () => {
  const { user, logout } = useAuth();
  const { businesses, products, addReservation } = useData();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
  const [bookingProduct, setBookingProduct] = useState<Product | null>(null);
  const [bookingDate, setBookingDate] = useState<Date>();
  const [bookingTime, setBookingTime] = useState('10:00');

  const activeBusiness = businesses.find(b => b.id === selectedBusiness);
  const businessProducts = products.filter(p => p.business_id === selectedBusiness);
  const categoryBusinesses = businesses.filter(b => b.category === selectedCategory);

  const handleBook = () => {
    if (!bookingProduct || !bookingDate || !user) return;
    const pickup = `${format(bookingDate, 'yyyy-MM-dd')}T${bookingTime}:00`;
    addReservation({
      customer_id: user.id,
      customer_name: user.full_name,
      business_id: bookingProduct.business_id,
      product_id: bookingProduct.id,
      product_name: bookingProduct.name,
      pickup_time: pickup,
    });
    toast.success('Success! Your treat is booked 🎉', {
      description: `${bookingProduct.name} — pickup at ${bookingTime} on ${format(bookingDate, 'PPP')}`,
    });
    setBookingProduct(null);
    setBookingDate(undefined);
    setBookingTime('10:00');
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
          <div className="bg-gradient-to-br from-primary/10 to-secondary rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 rounded-full ring-2 ring-background shadow-sm">
                <AvatarImage src={(activeBusiness as any).logo_url ?? undefined} alt={activeBusiness.name} />
                <AvatarFallback className="font-display text-xl bg-primary/10 text-primary">
                  {activeBusiness.name?.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-display font-bold text-foreground mb-1 truncate">
                  {activeBusiness.name}
                </h1>
                {activeBusiness.description && (
                  <p className="text-muted-foreground">
                    {activeBusiness.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <MapPin size={14} strokeWidth={2} /> Kokkola, Finland
                </div>
              </div>
            </div>
          </div>

          <Card className="rounded-2xl border-border/50 mb-8">
            <CardHeader>
              <CardTitle className="font-display">Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] rounded-xl overflow-hidden bg-secondary/20">
                <iframe
                  title="Kokkola Market Square (Kauppatori)"
                  src="https://www.google.com/maps?q=Kokkola%20Market%20Square%20(Kauppatori)&output=embed"
                  width="100%"
                  height="100%"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full border-0"
                />
              </div>
            </CardContent>
          </Card>

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
        <Dialog open={!!bookingProduct} onOpenChange={(open) => !open && setBookingProduct(null)}>
          <DialogContent className="rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Reserve {bookingProduct?.name}</DialogTitle>
              <DialogDescription>Pick a date and time for your pickup.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
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
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Pickup Time</Label>
                <Input type="time" value={bookingTime} onChange={e => setBookingTime(e.target.value)} className="rounded-xl" />
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-lg font-bold text-primary">{bookingProduct?.price}€</span>
              </div>
              <Button onClick={handleBook} className="w-full rounded-xl" disabled={!bookingDate}>
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
            {categoryBusinesses.map(biz => (
              <Card
                key={biz.id}
                className="rounded-2xl border-border/50 hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelectedBusiness(biz.id)}
              >
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Coffee size={24} strokeWidth={2} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{biz.name}</h3>
                    <p className="text-sm text-muted-foreground">{biz.description || 'Local business'}</p>
                  </div>
                  <Badge variant="secondary" className="rounded-lg">{products.filter(p => p.business_id === biz.id).length} items</Badge>
                </CardContent>
              </Card>
            ))}
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
                <CardContent className="p-6 text-center">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3",
                    cat.active ? "bg-primary/10" : "bg-muted"
                  )}>
                    <Icon size={28} strokeWidth={2} className={cat.active ? "text-primary" : "text-muted-foreground"} />
                  </div>
                  <h3 className="font-semibold text-foreground">{cat.name}</h3>
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
