-- Parent-Teacher Connection Database Schema
-- Run this in Supabase SQL Editor

-- 1. Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('teacher', 'parent', 'admin')),
    name TEXT NOT NULL,
    phone_number TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Teacher Profile table
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

-- 3. Parent Profile table
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

-- 4. Child Enrollment (relationship mapper)
CREATE TABLE IF NOT EXISTS public.child_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES public.child_profile(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.teacher_profiles(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES public.parent_profiles(id) ON DELETE CASCADE,
    enrolled_date DATE DEFAULT CURRENT_DATE,
    class_year TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Connection Requests
CREATE TABLE IF NOT EXISTS public.connection_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    child_id UUID REFERENCES public.child_profile(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ
);

-- 6. Message Threads
CREATE TABLE IF NOT EXISTS public.message_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES public.child_profile(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.teacher_profiles(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES public.parent_profiles(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    is_archived BOOLEAN DEFAULT false
);

-- 7. Update messages table for threading
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES public.message_threads(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS read_by JSONB DEFAULT '{}'::jsonb;

-- 8. Entry Approvals (track parent signatures)
CREATE TABLE IF NOT EXISTS public.entry_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES public.diary_entries(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES public.parent_profiles(id) ON DELETE CASCADE,
    signature_image_url TEXT,
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Update diary_entries for status tracking
ALTER TABLE public.diary_entries
ADD COLUMN IF NOT EXISTS entry_status TEXT DEFAULT 'published' CHECK (entry_status IN ('draft', 'published', 'signed_by_parent', 'archived'));

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for teacher_profiles
CREATE POLICY "Teachers can view connected profiles" ON public.teacher_profiles
    FOR SELECT USING (true);

-- RLS Policies for parent_profiles
CREATE POLICY "Parents can view connected profiles" ON public.parent_profiles
    FOR SELECT USING (true);

-- RLS Policies for connection_requests
CREATE POLICY "Users can view own requests" ON public.connection_requests
    FOR SELECT USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

-- RLS Policies for child_enrollments
CREATE POLICY "View connected enrollments" ON public.child_enrollments
    FOR SELECT USING (true);

-- RLS Policies for message_threads
CREATE POLICY "View own threads" ON public.message_threads
    FOR SELECT USING (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER teacher_profiles_updated_at BEFORE UPDATE ON public.teacher_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER parent_profiles_updated_at BEFORE UPDATE ON public.parent_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();