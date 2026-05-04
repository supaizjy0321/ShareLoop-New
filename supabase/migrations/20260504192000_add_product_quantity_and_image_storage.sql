-- 1. Quantity column on products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS quantity INT NOT NULL DEFAULT 0;

-- 2. Public storage bucket for product images (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Anyone can read product images
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Public read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- 4. Vendors can upload images, but only inside a folder named after a business they own (path = '<business_id>/<filename>')
DROP POLICY IF EXISTS "Vendors can upload product images" ON storage.objects;
CREATE POLICY "Vendors can upload product images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id::text = split_part(storage.objects.name, '/', 1)
        AND b.owner_id = auth.uid()
    )
  );

-- 5. Vendors can delete their own product images
DROP POLICY IF EXISTS "Vendors can delete product images" ON storage.objects;
CREATE POLICY "Vendors can delete product images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id::text = split_part(storage.objects.name, '/', 1)
        AND b.owner_id = auth.uid()
    )
  );
