-- Fix: inside EXISTS (... FROM businesses), unqualified `name` resolved to
-- businesses.name (store title), not the storage object path — uploads always failed RLS.

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
