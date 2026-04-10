-- =========================================================================
-- Phase 7: Gemini AI Translation Feature Data Model
-- =========================================================================

-- Add translations column to the people table to store AI-generated translations
-- The translations column will use JSONB to efficiently store a nested object structure
-- Schema: {'HI': { name: string, bio: string, ... }, 'GU': { ... }}

ALTER TABLE public.people 
ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;

-- Example of existing translations:
-- {
--   "HI": {
--     "name": "महेश वोरा",
--     "bio": "एक सॉफ्टवेयर इंजीनियर",
--     "occupation": "इंजीनियर",
--     "relation": "बेटा",
--     "spouse": "रीटा वोरा",
--     "spouseOccupation": "डॉक्टर"
--   },
--   "GU": {
--     "name": "મહેશ વોરા",
...
--   }
-- }
