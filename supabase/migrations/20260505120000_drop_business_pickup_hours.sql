-- Revert vendor "store pickup hours" columns added in 20260504233000_add_business_pickup_hours.sql
ALTER TABLE public.businesses
  DROP COLUMN IF EXISTS opening_time,
  DROP COLUMN IF EXISTS closing_time,
  DROP COLUMN IF EXISTS opening_days;
