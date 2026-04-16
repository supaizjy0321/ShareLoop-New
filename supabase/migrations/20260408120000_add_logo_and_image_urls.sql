-- Add optional media fields for cozy UI
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS logo_url TEXT;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS image_url TEXT;

