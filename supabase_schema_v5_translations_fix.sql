-- =========================================================================
-- Phase 8: Translation Column - Diagnostic & Fix Script
-- Run this ENTIRE script in the Supabase SQL Editor
-- =========================================================================

-- =========================================================================
-- STEP 1: Ensure the translations column exists
-- =========================================================================
-- This is idempotent (safe to run multiple times)
ALTER TABLE public.people 
ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;

-- Add a comment for documentation
COMMENT ON COLUMN public.people.translations IS 
'Stores AI-generated translations in format: {"EN": {"name": "...", ...}, "HI": {"name": "...", ...}, "GU": {"name": "...", ...}}';


-- =========================================================================
-- STEP 2: Diagnostic - Check which rows have translations vs empty
-- =========================================================================
-- This SELECT will show you the state of translations in your DB.
-- Look at the results to understand the current state.
SELECT 
    id,
    name, 
    generation,
    CASE 
        WHEN translations IS NULL THEN 'NULL'
        WHEN translations = '{}'::jsonb THEN 'EMPTY {}'
        WHEN translations->>'HI' IS NULL THEN 'NO HI KEY'
        WHEN (translations->'HI'->>'name') IS NULL THEN 'HI exists but no name'
        ELSE translations->'HI'->>'name'
    END AS hindi_name_status,
    CASE 
        WHEN translations IS NULL THEN 'NULL'
        WHEN translations = '{}'::jsonb THEN 'EMPTY {}'
        WHEN translations->>'GU' IS NULL THEN 'NO GU KEY'
        WHEN (translations->'GU'->>'name') IS NULL THEN 'GU exists but no name'
        ELSE translations->'GU'->>'name'
    END AS gujarati_name_status,
    pg_column_size(translations) AS translations_bytes
FROM public.people
ORDER BY generation, name;


-- =========================================================================
-- STEP 3: Fix NULL translations to empty JSONB (prevents upsert issues)
-- =========================================================================
UPDATE public.people 
SET translations = '{}'::jsonb 
WHERE translations IS NULL;


-- =========================================================================
-- STEP 4: Verify the column type is JSONB (not TEXT or JSON)
-- =========================================================================
-- If this returns 'jsonb', everything is correct.
-- If it returns 'text' or 'json', there's a type mismatch.
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'people' 
  AND column_name = 'translations';


-- =========================================================================
-- STEP 5: Check RLS policies are not blocking UPDATE
-- =========================================================================
-- This shows all policies on the people table.
-- Verify that UPDATE policies exist and are permissive enough.
SELECT 
    policyname, 
    cmd AS operation, 
    permissive,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies 
WHERE tablename = 'people';


-- =========================================================================
-- STEP 6: Test - Manually set a translation and read it back  
-- =========================================================================
-- This will update the FIRST person (root) with a test translation.
-- If this works, the column is functional.
-- IMPORTANT: Replace the name below with an actual name from your tree.

-- First, find who has empty translations:
SELECT id, name FROM public.people 
WHERE translations IS NULL OR translations = '{}'::jsonb
LIMIT 10;

-- Uncomment and run this to test a manual write:
-- UPDATE public.people 
-- SET translations = jsonb_build_object(
--     'EN', jsonb_build_object('name', name, 'relation', COALESCE(relation, '')),
--     'HI', jsonb_build_object('name', 'टेस्ट नाम', 'relation', 'टेस्ट'),
--     'GU', jsonb_build_object('name', 'ટેસ્ટ નામ', 'relation', 'ટેસ્ટ')
-- )
-- WHERE name = 'YOUR_PERSON_NAME_HERE'
-- RETURNING id, name, translations;


-- =========================================================================
-- STEP 7: Count summary
-- =========================================================================
SELECT 
    COUNT(*) AS total_people,
    COUNT(*) FILTER (WHERE translations IS NOT NULL AND translations != '{}'::jsonb) AS with_translations,
    COUNT(*) FILTER (WHERE translations IS NULL OR translations = '{}'::jsonb) AS without_translations,
    COUNT(*) FILTER (WHERE translations->'HI'->>'name' IS NOT NULL) AS with_hindi_name,
    COUNT(*) FILTER (WHERE translations->'GU'->>'name' IS NOT NULL) AS with_gujarati_name
FROM public.people;
