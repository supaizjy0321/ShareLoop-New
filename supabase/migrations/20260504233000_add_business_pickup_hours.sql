ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS opening_time time without time zone,
  ADD COLUMN IF NOT EXISTS closing_time time without time zone,
  ADD COLUMN IF NOT EXISTS opening_days smallint[];

COMMENT ON COLUMN public.businesses.opening_time IS 'Opening time (local) for customer pickup on opening_days';
COMMENT ON COLUMN public.businesses.closing_time IS 'Closing time (local); must be after opening_time same day';
COMMENT ON COLUMN public.businesses.opening_days IS '0=Sunday .. 6=Saturday. NULL or empty with NULL times = no restriction';
