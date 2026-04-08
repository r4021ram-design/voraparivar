-- =========================================================================
-- Phase 6: Supabase Security Fixes (Search Path & Media Table RLS)
-- =========================================================================

-- 1. Fix "Function Search Path Mutable" for handle_new_user
-- Added "SET search_path = public" to prevent privilege escalation attacks
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, 'VIEW_ONLY');
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- 2. Lock down the `media` table (Fix "RLS Policy Always True")
-- =========================================================================

-- Enable RLS if not already enabled (it should be, but just in case)
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- Drop the old overly permissive policies from v1
DROP POLICY IF EXISTS "Allow public read access" ON public.media;
DROP POLICY IF EXISTS "Allow public insert access" ON public.media;
DROP POLICY IF EXISTS "Allow public update access" ON public.media;
DROP POLICY IF EXISTS "Allow public delete access" ON public.media;

-- New Policies for `media` table:

-- SELECT: Anyone logged in can view the media
CREATE POLICY "Allow authenticated read access"
  ON public.media FOR SELECT
  USING ( auth.uid() IS NOT NULL );

-- INSERT: Only ADMIN or STANDARD can insert media
CREATE POLICY "Allow authenticated insert access"
  ON public.media FOR INSERT
  WITH CHECK ( 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'ADMIN' OR profiles.role = 'STANDARD')
    )
  );

-- UPDATE: Only ADMIN or STANDARD can update media
CREATE POLICY "Allow authenticated update access"
  ON public.media FOR UPDATE
  USING ( 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'ADMIN' OR profiles.role = 'STANDARD')
    )
  );

-- DELETE: Only ADMIN can delete media
CREATE POLICY "Allow admin delete access"
  ON public.media FOR DELETE
  USING ( 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'ADMIN'
    )
  );

-- =========================================================================
-- 3. Lock down `storage.objects` (Optional, as storage has its own policies, but if using standard SQL:)
-- =========================================================================

-- Drop old public policies for storage if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;

-- SELECT: Logged in users can view storage
CREATE POLICY "Authenticated users can view media"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'family-media' AND auth.uid() IS NOT NULL );

-- INSERT: ADMIN or STANDARD can upload
CREATE POLICY "Authorized users can upload media"
  ON storage.objects FOR INSERT
  WITH CHECK ( 
    bucket_id = 'family-media' 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'ADMIN' OR profiles.role = 'STANDARD')
    )
  );

-- DELETE: Only ADMIN can delete files
CREATE POLICY "Admins can delete media files"
  ON storage.objects FOR DELETE
  USING ( 
    bucket_id = 'family-media' 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'ADMIN'
    )
  );
