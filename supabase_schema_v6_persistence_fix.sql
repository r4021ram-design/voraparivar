-- =========================================================================
-- Phase 8: Persistence Gap Fix — Add missing columns
-- =========================================================================
-- Fields that the app model supports but the DB schema was missing:
--   photo_url, spouse_photo_url, sort_order
-- The anniversary_date column already exists from the base schema.

ALTER TABLE public.people
ADD COLUMN IF NOT EXISTS photo_url text,
ADD COLUMN IF NOT EXISTS spouse_photo_url text,
ADD COLUMN IF NOT EXISTS sort_order int;
