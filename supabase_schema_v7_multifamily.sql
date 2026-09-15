-- =========================================================================
-- SUPABASE SCHEMA V7: MULTI-FAMILY SUPPORT & USER MANAGEMENT RPC
-- Run this in Supabase Dashboard -> SQL Editor
-- =========================================================================

-- 1. Create families table
CREATE TABLE IF NOT EXISTS public.families (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on families
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on families" ON public.families;
DROP POLICY IF EXISTS "Allow authenticated insert on families" ON public.families;
DROP POLICY IF EXISTS "Allow authenticated update on families" ON public.families;
DROP POLICY IF EXISTS "Allow authenticated delete on families" ON public.families;

CREATE POLICY "Allow public read on families" ON public.families FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert on families" ON public.families FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update on families" ON public.families FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete on families" ON public.families FOR DELETE USING (true);

-- 2. Insert default Vora Parivar family if it doesn't exist
INSERT INTO public.families (id, name, slug)
VALUES ('vora-parivar', 'Vora Parivar', 'vora')
ON CONFLICT (id) DO NOTHING;

-- 3. Add family_id to people table
ALTER TABLE public.people 
ADD COLUMN IF NOT EXISTS family_id TEXT REFERENCES public.families(id) ON DELETE CASCADE;

-- Backfill existing people rows without family_id to 'vora-parivar'
UPDATE public.people 
SET family_id = 'vora-parivar' 
WHERE family_id IS NULL;

-- 4. Add family_id & email to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS family_id TEXT REFERENCES public.families(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS email TEXT;

-- 5. Drop existing create_family_user if exists
DROP FUNCTION IF EXISTS public.create_family_user(TEXT, TEXT, TEXT, TEXT);

-- 6. RPC Function: create_family_user
-- Allows Admin to create user credentials directly without getting logged out
CREATE OR REPLACE FUNCTION public.create_family_user(
    new_email TEXT,
    new_password TEXT,
    user_role TEXT,
    target_family_id TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  new_uid uuid;
  caller_role text;
BEGIN
  -- Verify caller is authenticated and has ADMIN role
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role IS NULL OR caller_role != 'ADMIN' THEN
    RAISE EXCEPTION 'Access Denied: Only Admins can create new family users';
  END IF;

  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = lower(trim(new_email))) THEN
    RAISE EXCEPTION 'User with email % already exists', new_email;
  END IF;

  new_uid := gen_random_uuid();

  -- Insert user directly into auth.users with encrypted password
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_uid,
    'authenticated',
    'authenticated',
    lower(trim(new_email)),
    crypt(new_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('family_id', target_family_id, 'role', user_role),
    now(),
    now()
  );

  -- Upsert into public.profiles
  INSERT INTO public.profiles (id, role, family_id, email, created_at)
  VALUES (new_uid, user_role, target_family_id, lower(trim(new_email)), now())
  ON CONFLICT (id) DO UPDATE
  SET role = user_role, family_id = target_family_id, email = lower(trim(new_email));

  RETURN jsonb_build_object('success', true, 'user_id', new_uid);
END;
$$;

-- 7. RPC Function: reset_family_user_password
CREATE OR REPLACE FUNCTION public.reset_family_user_password(
    target_user_id uuid,
    new_password TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role IS NULL OR caller_role != 'ADMIN' THEN
    RAISE EXCEPTION 'Access Denied: Only Admins can reset user passwords';
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = target_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 8. RPC Function: delete_family_user
CREATE OR REPLACE FUNCTION public.delete_family_user(
    target_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role IS NULL OR caller_role != 'ADMIN' THEN
    RAISE EXCEPTION 'Access Denied: Only Admins can delete users';
  END IF;

  DELETE FROM auth.users WHERE id = target_user_id;
  DELETE FROM public.profiles WHERE id = target_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 9. Grant EXECUTE permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.create_family_user(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_family_user_password(uuid, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_family_user(uuid) TO authenticated;
