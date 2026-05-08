-- Profile Creation Tables Fix
-- Run this in Supabase SQL Editor to enable user registration

-- 1. Users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('teacher', 'parent', 'admin')),
    name TEXT NOT NULL,
    phone_number TEXT,
    school_id TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Teacher profiles
CREATE TABLE IF NOT EXISTS public.teacher_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    qualification TEXT,
    school_name TEXT NOT NULL,
    class_grade TEXT NOT NULL,
    subject_specialization TEXT,
    years_of_experience INTEGER DEFAULT 0,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Parent profiles
CREATE TABLE IF NOT EXISTS public.parent_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    relationship_to_child TEXT NOT NULL CHECK (relationship_to_child IN ('mother', 'father', 'guardian')),
    occupation TEXT,
    phone_number TEXT NOT NULL,
    emergency_contact TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_profiles ENABLE ROW LEVEL SECURITY;

-- Users policies
DROP POLICY IF EXISTS "users_insert" ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;
DROP POLICY IF EXISTS "users_select" ON public.users;
CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (auth.uid() = id OR auth.role() = 'authenticated');
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_select" ON public.users FOR SELECT USING (true);

-- Teacher profiles policies
DROP POLICY IF EXISTS "teacher_profiles_insert" ON public.teacher_profiles;
DROP POLICY IF EXISTS "teacher_profiles_update" ON public.teacher_profiles;
DROP POLICY IF EXISTS "teacher_profiles_select" ON public.teacher_profiles;
CREATE POLICY "teacher_profiles_insert" ON public.teacher_profiles FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'authenticated');
CREATE POLICY "teacher_profiles_update" ON public.teacher_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "teacher_profiles_select" ON public.teacher_profiles FOR SELECT USING (true);

-- Parent profiles policies
DROP POLICY IF EXISTS "parent_profiles_insert" ON public.parent_profiles;
DROP POLICY IF EXISTS "parent_profiles_update" ON public.parent_profiles;
DROP POLICY IF EXISTS "parent_profiles_select" ON public.parent_profiles;
CREATE POLICY "parent_profiles_insert" ON public.parent_profiles FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'authenticated');
CREATE POLICY "parent_profiles_update" ON public.parent_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "parent_profiles_select" ON public.parent_profiles FOR SELECT USING (true);