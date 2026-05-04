import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Business {
  id: string;
  name: string;
  category: string;
  owner_id: string;
  description?: string;
  logo_url?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  business_id: string;
  description?: string;
  image_url?: string | null;
  quantity?: number;
}

export interface Reservation {
  id: string;
  customer_id: string;
  customer_name: string;
  business_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  pickup_time: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface DataContextType {
  businesses: Business[];
  products: Product[];
  reservations: Reservation[];
  addBusiness: (b: Omit<Business, 'id'>) => Promise<Business>;
  updateBusiness: (id: string, b: Partial<Business>) => Promise<void>;
  addProduct: (p: Omit<Product, 'id'>) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  addReservation: (r: Omit<Reservation, 'id' | 'created_at' | 'status'>) => Promise<void>;
  updateReservationStatus: (id: string, status: 'approved' | 'rejected') => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  const loadAll = useCallback(async () => {
    if (!user) {
      setBusinesses([]);
      setProducts([]);
      setReservations([]);
      return;
    }

    const [{ data: businessesData, error: businessesError }, { data: productsData, error: productsError }, { data: reservationsData, error: reservationsError }] =
      await Promise.all([
        supabase
          .from('businesses')
          .select('id, name, category, owner_id, description, logo_url, address, latitude, longitude')
          .order('created_at', { ascending: false }),
        supabase
          .from('products')
          .select('id, name, price, business_id, description, image_url, quantity')
          .order('created_at', { ascending: false }),
        supabase
          .from('reservations')
          .select(`
            id,
            customer_id,
            business_id,
            product_id,
            quantity,
            pickup_time,
            status,
            created_at,
            profiles:customer_id ( full_name ),
            products:product_id ( name )
          `)
          .order('created_at', { ascending: false }),
      ]);

    if (businessesError) throw businessesError;
    if (productsError) throw productsError;
    if (reservationsError) throw reservationsError;

    setBusinesses((businessesData ?? []).map(b => ({
      ...b,
      description: b.description ?? undefined,
      logo_url: b.logo_url ?? null,
      address: b.address ?? null,
      latitude: b.latitude ?? null,
      longitude: b.longitude ?? null,
    })));
    setProducts((productsData ?? []).map(p => ({
      ...p,
      description: p.description ?? undefined,
      image_url: p.image_url ?? null,
      quantity: p.quantity ?? 0,
    })));
    setReservations((reservationsData ?? []).map(r => ({
      id: r.id,
      customer_id: r.customer_id,
      customer_name: (r as any).profiles?.full_name ?? 'Customer',
      business_id: r.business_id,
      product_id: r.product_id,
      product_name: (r as any).products?.name ?? 'Product',
      quantity: r.quantity ?? 1,
      pickup_time: r.pickup_time,
      status: r.status as Reservation['status'],
      created_at: r.created_at,
    })));
  }, [user]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const addBusiness = useCallback(async (b: Omit<Business, 'id'>) => {
    const { data, error } = await supabase
      .from('businesses')
      .insert({
        name: b.name,
        category: b.category,
        owner_id: b.owner_id,
        description: b.description ?? null,
        logo_url: b.logo_url ?? null,
        address: b.address ?? null,
        latitude: b.latitude ?? null,
        longitude: b.longitude ?? null,
      })
      .select('id, name, category, owner_id, description, logo_url, address, latitude, longitude')
      .single();

    if (error) throw error;
    const mapped: Business = {
      ...data,
      description: data.description ?? undefined,
      logo_url: data.logo_url ?? null,
      address: data.address ?? null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
    };
    setBusinesses(prev => [mapped, ...prev]);
    return mapped;
  }, []);

  const updateBusiness = useCallback(async (id: string, b: Partial<Business>) => {
    const { error } = await supabase
      .from('businesses')
      .update({
        name: b.name,
        category: b.category,
        description: b.description === undefined ? undefined : (b.description ?? null),
        logo_url: b.logo_url === undefined ? undefined : (b.logo_url ?? null),
        address: b.address === undefined ? undefined : (b.address ?? null),
        latitude: b.latitude === undefined ? undefined : (b.latitude ?? null),
        longitude: b.longitude === undefined ? undefined : (b.longitude ?? null),
      })
      .eq('id', id);

    if (error) throw error;
    setBusinesses(prev => prev.map(biz => biz.id === id ? { ...biz, ...b } : biz));
  }, []);

  const addProduct = useCallback(async (p: Omit<Product, 'id'>) => {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: p.name,
        price: p.price,
        business_id: p.business_id,
        description: p.description ?? null,
        image_url: p.image_url ?? null,
        quantity: p.quantity ?? 0,
      })
      .select('id, name, price, business_id, description, image_url, quantity')
      .single();

    if (error) throw error;
    setProducts(prev => [{
      ...data,
      description: data.description ?? undefined,
      image_url: data.image_url ?? null,
      quantity: data.quantity ?? 0,
    }, ...prev]);
  }, []);

  const removeProduct = useCallback(async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  const addReservation = useCallback(async (r: Omit<Reservation, 'id' | 'created_at' | 'status'>) => {
    const { data, error } = await supabase
      .from('reservations')
      .insert({
        customer_id: r.customer_id,
        business_id: r.business_id,
        product_id: r.product_id,
        pickup_time: r.pickup_time,
        quantity: r.quantity ?? 1,
      })
      .select(`
        id,
        customer_id,
        business_id,
        product_id,
        quantity,
        pickup_time,
        status,
        created_at,
        profiles:customer_id ( full_name ),
        products:product_id ( name )
      `)
      .single();

    if (error) throw error;
    const mapped: Reservation = {
      id: data.id,
      customer_id: data.customer_id,
      customer_name: (data as any).profiles?.full_name ?? 'Customer',
      business_id: data.business_id,
      product_id: data.product_id,
      product_name: (data as any).products?.name ?? 'Product',
      quantity: data.quantity ?? 1,
      pickup_time: data.pickup_time,
      status: data.status as Reservation['status'],
      created_at: data.created_at,
    };
    setReservations(prev => [mapped, ...prev]);
  }, []);

  const updateReservationStatus = useCallback(async (id: string, status: 'approved' | 'rejected') => {
    let productId: string | undefined;
    let orderQty = 1;

    if (status === 'approved') {
      const { data: resRow, error: resErr } = await supabase
        .from('reservations')
        .select('product_id, quantity')
        .eq('id', id)
        .single();
      if (resErr || !resRow) throw resErr ?? new Error('Reservation not found');
      productId = resRow.product_id;
      orderQty = resRow.quantity ?? 1;
      const { data: prod, error: prodErr } = await supabase
        .from('products')
        .select('quantity')
        .eq('id', productId)
        .single();
      if (prodErr || !prod) throw prodErr ?? new Error('Product not found');
      if ((prod.quantity ?? 0) < orderQty) {
        throw new Error('Not enough stock to approve this reservation.');
      }
    }

    const { error } = await supabase.from('reservations').update({ status }).eq('id', id);
    if (error) throw error;

    if (status === 'approved' && productId) {
      const { data: prod } = await supabase
        .from('products')
        .select('quantity')
        .eq('id', productId)
        .single();
      const newStock = Math.max(0, (prod?.quantity ?? 0) - orderQty);
      const { error: stockErr } = await supabase
        .from('products')
        .update({ quantity: newStock })
        .eq('id', productId);
      if (stockErr) throw stockErr;
      setProducts(prev =>
        prev.map(p => (p.id === productId ? { ...p, quantity: newStock } : p)),
      );
    }

    setReservations(prev =>
      prev.map(r => (r.id === id ? { ...r, status } : r)),
    );
  }, []);

  const value = useMemo(() => ({
    businesses,
    products,
    reservations,
    addBusiness,
    updateBusiness,
    addProduct,
    removeProduct,
    addReservation,
    updateReservationStatus,
  }), [
    businesses,
    products,
    reservations,
    addBusiness,
    updateBusiness,
    addProduct,
    removeProduct,
    addReservation,
    updateReservationStatus,
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};
