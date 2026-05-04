ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1
    CHECK (quantity >= 1);

COMMENT ON COLUMN public.reservations.quantity IS 'Number of product units reserved';
