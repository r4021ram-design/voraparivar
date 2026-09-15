-- =========================================================================
-- COMPLETE SUPABASE FIX & SETUP SCRIPT FOR VORAPARIVAR
-- Run this in Supabase Dashboard -> SQL Editor
-- =========================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Ensure people table has all required columns
CREATE TABLE IF NOT EXISTS public.people (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES public.people(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('MALE', 'FEMALE')),
    relation TEXT,
    generation INT,
    bio TEXT,
    occupation TEXT,
    dob DATE,
    dod DATE,
    anniversary_date DATE,
    phone TEXT,
    location_name TEXT,
    location_lat FLOAT8,
    location_lng FLOAT8,
    spouse_name TEXT,
    spouse_dob DATE,
    spouse_dod DATE,
    spouse_occupation TEXT,
    spouse_phone TEXT,
    photo_url TEXT,
    spouse_photo_url TEXT,
    sort_order INT,
    translations JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Convert ID columns to TEXT so node IDs ("root", "child-1", UUIDs) are accepted
ALTER TABLE public.media DROP CONSTRAINT IF EXISTS media_person_id_fkey;
ALTER TABLE public.people DROP CONSTRAINT IF EXISTS people_parent_id_fkey;

ALTER TABLE public.people ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE public.people ALTER COLUMN parent_id TYPE TEXT USING parent_id::TEXT;
ALTER TABLE public.media ALTER COLUMN person_id TYPE TEXT USING person_id::TEXT;

ALTER TABLE public.people 
ADD CONSTRAINT people_parent_id_fkey 
FOREIGN KEY (parent_id) REFERENCES public.people(id) ON DELETE CASCADE;

ALTER TABLE public.media 
ADD CONSTRAINT media_person_id_fkey 
FOREIGN KEY (person_id) REFERENCES public.people(id) ON DELETE CASCADE;

-- In case table already existed, ensure missing columns are added
ALTER TABLE public.people 
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS spouse_photo_url TEXT,
ADD COLUMN IF NOT EXISTS sort_order INT,
ADD COLUMN IF NOT EXISTS anniversary_date DATE,
ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;


-- 3. Ensure media table exists
CREATE TABLE IF NOT EXISTS public.media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID REFERENCES public.people(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    type TEXT CHECK (type IN ('PROFILE', 'SPOUSE_PROFILE', 'GALLERY')),
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- 5. Fix RLS Policies on people (Allow Full App Access)
DROP POLICY IF EXISTS "Allow public read access" ON public.people;
DROP POLICY IF EXISTS "Allow public insert access" ON public.people;
DROP POLICY IF EXISTS "Allow public update access" ON public.people;
DROP POLICY IF EXISTS "Allow public delete access" ON public.people;

CREATE POLICY "Allow public read access" ON public.people FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.people FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.people FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access" ON public.people FOR DELETE USING (true);

-- 6. Fix RLS Policies on media
DROP POLICY IF EXISTS "Allow public read access" ON public.media;
DROP POLICY IF EXISTS "Allow public insert access" ON public.media;
DROP POLICY IF EXISTS "Allow public update access" ON public.media;
DROP POLICY IF EXISTS "Allow public delete access" ON public.media;

CREATE POLICY "Allow public read access" ON public.media FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.media FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.media FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access" ON public.media FOR DELETE USING (true);

-- 7. Ensure Storage Bucket family-media exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('family-media', 'family-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 8. Storage RLS Policies for Photo Uploads
DROP POLICY IF EXISTS "Public Media Read" ON storage.objects;
DROP POLICY IF EXISTS "Public Media Insert" ON storage.objects;
DROP POLICY IF EXISTS "Public Media Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Media Delete" ON storage.objects;

CREATE POLICY "Public Media Read" ON storage.objects FOR SELECT USING (bucket_id = 'family-media');
CREATE POLICY "Public Media Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'family-media');
CREATE POLICY "Public Media Update" ON storage.objects FOR UPDATE USING (bucket_id = 'family-media');
CREATE POLICY "Public Media Delete" ON storage.objects FOR DELETE USING (bucket_id = 'family-media');
