import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Clock,
  CheckCircle2,
  ShoppingBag,
  LogOut,
  User as UserIcon,
  Compass,
  CalendarDays,
  History,
  MapPin,
  XCircle,
  Hash,
} from 'lucide-react';
import { format, isAfter } from 'date-fns';
import { toast } from 'sonner';
import {
  AddressAutocomplete,
  type AddressValue,
} from '@/components/AddressAutocomplete';

const CustomerDashboard = () => {
  const { user, logout, updateAddress } = useAuth();
  const { businesses, reservations } = useData();

  const hasSavedAddress =
    !!user?.address && user?.latitude != null && user?.longitude != null;
  const savedAddressValue: AddressValue | null = hasSavedAddress
    ? {
        address: user!.address!,
        latitude: user!.latitude!,
        longitude: user!.longitude!,
      }
    : null;

  const [addressOpen, setAddressOpen] = useState(false);
  const [draftAddress, setDraftAddress] = useState<AddressValue | null>(
    savedAddressValue,
  );
  const [savingAddress, setSavingAddress] = useState(false);

  const openAddressDialog = () => {
    setDraftAddress(savedAddressValue);
    setAddressOpen(true);
  };

  const handleSaveAddress = async () => {
    setSavingAddress(true);
    try {
      if (draftAddress) {
        await updateAddress(
          draftAddress.address,
          draftAddress.latitude,
          draftAddress.longitude,
        );
        toast.success('Address saved');
      } else {
        await updateAddress(null, null, null);
        toast.success('Address cleared');
      }
      setAddressOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not save your address',
      );
    } finally {
      setSavingAddress(false);
    }
  };

  const myReservations = useMemo(
    () =>
      reservations
        .filter(r => r.customer_id === user?.id)
        .sort(
          (a, b) =>
            new Date(b.pickup_time).getTime() -
            new Date(a.pickup_time).getTime(),
        ),
    [reservations, user?.id],
  );

  const now = new Date();
  const upcomingReservations = myReservations.filter(
    r => r.status !== 'rejected' && isAfter(new Date(r.pickup_time), now),
  );
  const pastReservations = myReservations.filter(
    r => r.status === 'rejected' || !isAfter(new Date(r.pickup_time), now),
  );

  const pendingCount = myReservations.filter(r => r.status === 'pending').length;
  const approvedCount = myReservations.filter(r => r.status === 'approved').length;

  const businessName = (id: string) =>
    businesses.find(b => b.id === id)?.name ?? 'Local business';

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-warning/10 text-warning border-0 rounded-lg gap-1">
            <Clock size={12} strokeWidth={2} /> Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-success/10 text-success border-0 rounded-lg gap-1">
            <CheckCircle2 size={12} strokeWidth={2} /> Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="secondary" className="rounded-lg gap-1">
            <XCircle size={12} strokeWidth={2} /> Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const ReservationCard = ({
    reservation,
  }: {
    reservation: (typeof myReservations)[number];
  }) => (
    <Card className="rounded-2xl border-border/50 hover:shadow-md transition-all">
      <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
          <ShoppingBag size={22} strokeWidth={2} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">
              {reservation.product_name}
            </h3>
            {statusBadge(reservation.status)}
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin size={12} strokeWidth={2} />
            {businessName(reservation.business_id)}
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
            <Hash size={12} strokeWidth={2} />
            Quantity: {reservation.quantity ?? 1}
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
            <CalendarDays size={12} strokeWidth={2} />
            {format(new Date(reservation.pickup_time), 'PPp')}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-display text-xl font-bold text-foreground">
            ShareLoop
          </span>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="rounded-lg hidden sm:flex gap-1"
            >
              <UserIcon size={14} strokeWidth={2} /> Customer
            </Badge>
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.full_name}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={openAddressDialog}
              className="rounded-xl relative"
              aria-label={
                hasSavedAddress ? 'Change your address' : 'Set your address'
              }
              title={
                hasSavedAddress
                  ? 'Change your address'
                  : 'Set your address for distance to shops'
              }
            >
              <MapPin size={18} strokeWidth={2} />
              {!hasSavedAddress && (
                <span
                  aria-hidden
                  className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-warning ring-2 ring-card"
                />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="rounded-xl"
            >
              <LogOut size={18} strokeWidth={2} />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl animate-fade-in">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Welcome back, {user?.full_name?.split(' ')[0] ?? 'friend'} 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your reservations and discover more local businesses.
            </p>
            {hasSavedAddress ? (
              <button
                type="button"
                onClick={openAddressDialog}
                className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <MapPin size={12} strokeWidth={2} />
                <span className="truncate max-w-[260px] sm:max-w-md">
                  Showing distances from {user?.address}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={openAddressDialog}
                className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <MapPin size={12} strokeWidth={2} />
                Set your address to see distance to shops
              </button>
            )}
          </div>
          <Button asChild className="rounded-xl gap-2">
            <Link to="/explore">
              <Compass size={16} strokeWidth={2} /> Explore
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-warning/10 rounded-2xl flex items-center justify-center">
                <Clock size={24} strokeWidth={2} className="text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">
                  {pendingCount}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-success/10 rounded-2xl flex items-center justify-center">
                <CheckCircle2
                  size={24}
                  strokeWidth={2}
                  className="text-success"
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-foreground">
                  {approvedCount}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                <ShoppingBag
                  size={24}
                  strokeWidth={2}
                  className="text-primary"
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">
                  {myReservations.length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList className="rounded-xl">
            <TabsTrigger value="upcoming" className="rounded-lg gap-1">
              <CalendarDays size={14} strokeWidth={2} /> Upcoming
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg gap-1">
              <History size={14} strokeWidth={2} /> History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-3">
            {upcomingReservations.length === 0 ? (
              <Card className="rounded-2xl border-border/50">
                <CardContent className="p-10 flex flex-col items-center text-center gap-3">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <CalendarDays
                      size={26}
                      strokeWidth={2}
                      className="text-primary"
                    />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground">
                      No upcoming pickups
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Reserve something fresh from a local business to see it
                      here.
                    </p>
                  </div>
                  <Button asChild className="rounded-xl gap-2 mt-2">
                    <Link to="/explore">
                      <Compass size={16} strokeWidth={2} /> Browse marketplace
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              upcomingReservations.map(r => (
                <ReservationCard key={r.id} reservation={r} />
              ))
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-3">
            {pastReservations.length === 0 ? (
              <Card className="rounded-2xl border-border/50">
                <CardContent className="p-10 text-center">
                  <p className="text-muted-foreground">
                    Your past reservations will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-2xl border-border/50">
                <CardHeader>
                  <CardTitle className="font-display">Past pickups</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pastReservations.map(r => (
                    <ReservationCard key={r.id} reservation={r} />
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={addressOpen} onOpenChange={setAddressOpen}>
          <DialogContent className="rounded-2xl max-w-md flex max-h-[85vh] flex-col p-0 gap-0">
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle className="font-display">Your address</DialogTitle>
              <DialogDescription>
                We'll use this to show how far each shop is from you. We never
                share it with vendors.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2">
              <AddressAutocomplete
                value={draftAddress}
                onChange={setDraftAddress}
                placeholder="Search a Finnish address…"
              />
              {draftAddress && (
                <p className="text-xs text-muted-foreground">
                  {draftAddress.latitude.toFixed(5)},{' '}
                  {draftAddress.longitude.toFixed(5)}
                </p>
              )}
            </div>
            <DialogFooter className="border-t px-6 py-3 gap-2 sm:gap-2">
              {hasSavedAddress && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setDraftAddress(null)}
                  disabled={savingAddress}
                  className="rounded-xl"
                >
                  Clear
                </Button>
              )}
              <Button
                type="button"
                onClick={handleSaveAddress}
                disabled={savingAddress}
                className="rounded-xl"
              >
                {savingAddress ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CustomerDashboard;
