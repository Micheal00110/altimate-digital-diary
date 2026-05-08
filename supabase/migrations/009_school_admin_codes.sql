-- Add admin_code to schools table
-- Enable principals to self-register with school code

ALTER TABLE IF EXISTS public.schools 
ADD COLUMN IF NOT EXISTS admin_code TEXT;

-- Add default admin code for existing schools
UPDATE public.schools 
SET admin_code = LOWER(REPLACE(name, ' ', '')) || '2024'
WHERE admin_code IS NULL;

-- Update Demo Academy code
UPDATE public.schools 
SET admin_code = 'demo2024'
WHERE name = 'Demo Academy';

-- Ensure not null going forward
ALTER TABLE public.schools 
ALTER COLUMN admin_code SET NOT NULL;