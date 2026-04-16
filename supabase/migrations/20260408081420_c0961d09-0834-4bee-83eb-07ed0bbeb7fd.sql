
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('vendor', 'customer')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create businesses table
CREATE TABLE public.businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reservations table
CREATE TABLE public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  pickup_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS Policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for businesses
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view businesses"
  ON public.businesses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Vendors can insert their own businesses"
  ON public.businesses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Vendors can update their own businesses"
  ON public.businesses FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id);

-- RLS Policies for products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view products"
  ON public.products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Vendors can manage their own products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_id = auth.uid())
  );

CREATE POLICY "Vendors can update their own products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_id = auth.uid())
  );

CREATE POLICY "Vendors can delete their own products"
  ON public.products FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_id = auth.uid())
  );

-- RLS Policies for reservations
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own reservations"
  ON public.reservations FOR SELECT
  TO authenticated
  USING (
    auth.uid() = customer_id
    OR EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_id = auth.uid())
  );

CREATE POLICY "Customers can create reservations"
  ON public.reservations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Vendors can update reservation status"
  ON public.reservations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_id = auth.uid())
  );

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$;

-- Trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
