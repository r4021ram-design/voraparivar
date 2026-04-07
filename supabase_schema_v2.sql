-- =========================================================================
-- Phase 5: Supabase Auth & Security Upgrade
-- =========================================================================

-- 1. Create a `profiles` table to store User Roles 
CREATE TABLE if not exists public.profiles (
  id uuid references auth.users not null primary key,
  role text not null default 'VIEW_ONLY',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are viewable by everyone who is logged in
CREATE POLICY "Public profiles are viewable by everyone."
  ON profiles FOR SELECT
  USING ( auth.uid() IS NOT NULL );

-- Users can insert their own profile (handled automatically by trigger usually)
CREATE POLICY "Users can insert their own profile."
  ON profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

-- Only admins can update profiles
CREATE POLICY "Admins can update roles."
  ON profiles FOR UPDATE
  USING ( 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
  );

-- 2. Trigger to automatically create a profile when an admin creates a user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, 'VIEW_ONLY');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists (for safe re-run)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =========================================================================
-- 3. Lock down the existing `people` table
-- =========================================================================

ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;

-- Drop the old open policies completely
DROP POLICY IF EXISTS "Allow public read access" ON public.people;
DROP POLICY IF EXISTS "Allow public insert access" ON public.people;
DROP POLICY IF EXISTS "Allow public update access" ON public.people;
DROP POLICY IF EXISTS "Allow public delete access" ON public.people;

-- New Policies for `people` table:

-- SELECT: Anyone logged in can view the tree
CREATE POLICY "Allow authenticated read access"
  ON public.people FOR SELECT
  USING ( auth.uid() IS NOT NULL );

-- INSERT: Only ADMIN or STANDARD can insert
CREATE POLICY "Allow authenticated insert access"
  ON public.people FOR INSERT
  WITH CHECK ( 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'ADMIN' OR profiles.role = 'STANDARD')
    )
  );

-- UPDATE: Only ADMIN or STANDARD can update
CREATE POLICY "Allow authenticated update access"
  ON public.people FOR UPDATE
  USING ( 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'ADMIN' OR profiles.role = 'STANDARD')
    )
  );

-- DELETE: Only ADMIN can delete
CREATE POLICY "Allow admin delete access"
  ON public.people FOR DELETE
  USING ( 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'ADMIN'
    )
  );
