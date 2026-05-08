-- Multi-Tenancy & Investor Infrastructure
-- This migration creates the core "School" entity and links users/students to it.

-- 1. Create Schools Table
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    contact_email TEXT,
    subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'overdue', 'expired')),
    created_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true
);

-- 2. Add school_id to users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL;

-- 3. Add school_id to child_profile
ALTER TABLE public.child_profile 
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL;

-- 4. Add school_id to child_enrollments
ALTER TABLE public.child_enrollments 
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL;

-- 5. Insert a Default School (for existing data migration)
INSERT INTO public.schools (name, contact_email, subscription_status)
VALUES ('Demo Academy', 'admin@demo.com', 'active')
ON CONFLICT DO NOTHING;

-- 6. Link all existing records to the default school (so they don't disappear)
DO $$
DECLARE
    v_default_school_id UUID;
BEGIN
    SELECT id INTO v_default_school_id FROM public.schools WHERE name = 'Demo Academy' LIMIT 1;
    
    UPDATE public.users SET school_id = v_default_school_id WHERE school_id IS NULL;
    UPDATE public.child_profile SET school_id = v_default_school_id WHERE school_id IS NULL;
    UPDATE public.child_enrollments SET school_id = v_default_school_id WHERE school_id IS NULL;
END $$;
