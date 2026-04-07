
-- Drop the FK so we can seed data without a real user
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_landlord_id_fkey;
