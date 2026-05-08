    -- Phase 2: Connection Management Migration
-- Created: 2026-04-21
-- Note: Requires schools table to exist first

-- ============================================
-- EXTEND EXISTING TABLES
-- ============================================

-- Add role to child_profile table (ignore if already exists)
ALTER TABLE IF EXISTS child_profile 
ADD COLUMN IF NOT EXISTS assigned_teacher_id UUID REFERENCES auth.users(id);

-- Add school_id to connect to school (ignore if already exists)
ALTER TABLE IF EXISTS child_profile
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);

-- ============================================
-- TEACHER PROFILES
-- ============================================

CREATE TABLE IF NOT EXISTS teacher_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Professional Info
    qualification TEXT,
    school_name TEXT,
    class_grade TEXT,
    subject_specialization TEXT,
    years_of_experience INTEGER,
    bio TEXT,
    
    -- Verification
    verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
    verification_document_url TEXT,
    verified_at TIMESTAMPTZ,
    verified_by UUID,
    
    -- Contact (denormalized for search)
    phone_number TEXT,
    
    -- School (for multi-tenancy)
    school_id UUID REFERENCES schools(id),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(user_id)
);

-- ============================================
-- PARENT PROFILES
-- ============================================

CREATE TABLE IF NOT EXISTS parent_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Personal Info
    relationship_to_child TEXT CHECK (relationship_to_child IN ('mother', 'father', 'guardian')),
    occupation TEXT,
    phone_number TEXT,
    emergency_contact TEXT,
    
    -- School (for multi-tenancy)
    school_id UUID REFERENCES schools(id),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(user_id)
);

-- ============================================
-- CHILD-TEACHER ENROLLMENTS (The Connection)
-- ============================================

CREATE TABLE IF NOT EXISTS child_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationships
    child_id UUID NOT NULL REFERENCES child_profile(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Enrollment Info
    class_year TEXT NOT NULL, -- e.g., "2025-2026"
    enrolled_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    
    -- School (for multi-tenancy)
    school_id UUID REFERENCES schools(id),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Prevent duplicate enrollments
    UNIQUE(child_id, teacher_id, parent_id, class_year)
);

-- ============================================
-- CONNECTION REQUESTS
-- ============================================

CREATE TABLE IF NOT EXISTS connection_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Who is requesting
    from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    from_user_type TEXT NOT NULL CHECK (from_user_type IN ('teacher', 'parent')),
    
    -- Who is being requested
    to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_type TEXT NOT NULL CHECK (to_user_type IN ('teacher', 'parent')),
    
    -- Related child (optional - for parent finding teacher for specific child)
    child_id UUID REFERENCES child_profile(id) ON DELETE CASCADE,
    
    -- Request details
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    responded_at TIMESTAMPTZ,
    
    -- School (for multi-tenancy)
    school_id UUID REFERENCES schools(id)
);

-- Create partial unique index to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_connection_requests_pending 
ON connection_requests(from_user_id, to_user_id) 
WHERE status = 'pending';

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Teacher search indexes
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_school ON teacher_profiles(school_name);
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_grade ON teacher_profiles(class_grade);
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_verified ON teacher_profiles(verification_status) WHERE verification_status = 'verified';

-- Connection indexes
CREATE INDEX IF NOT EXISTS idx_connection_requests_to_user ON connection_requests(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_connection_requests_from_user ON connection_requests(from_user_id, status);
CREATE INDEX IF NOT EXISTS idx_child_enrollments_teacher ON child_enrollments(teacher_id, status);
CREATE INDEX IF NOT EXISTS idx_child_enrollments_parent ON child_enrollments(parent_id, status);
CREATE INDEX IF NOT EXISTS idx_child_enrollments_child ON child_enrollments(child_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;

-- Teacher Profiles RLS
CREATE POLICY "Teachers can view their own profile" 
ON teacher_profiles FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view verified teacher profiles" 
ON teacher_profiles FOR SELECT 
USING (verification_status = 'verified' AND is_active = true);

CREATE POLICY "Connected parents can view teacher profile" 
ON teacher_profiles FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM child_enrollments ce 
        WHERE ce.teacher_id = teacher_profiles.user_id 
        AND ce.parent_id = auth.uid()
        AND ce.status = 'active'
    )
);

-- Parent Profiles RLS
CREATE POLICY "Parents can view their own profile" 
ON parent_profiles FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Connected teachers can view parent profile" 
ON parent_profiles FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM child_enrollments ce 
        WHERE ce.parent_id = parent_profiles.user_id 
        AND ce.teacher_id = auth.uid()
        AND ce.status = 'active'
    )
);

-- Child Enrollments RLS
CREATE POLICY "Users can view their own enrollments" 
ON child_enrollments FOR SELECT 
USING (auth.uid() = teacher_id OR auth.uid() = parent_id);

CREATE POLICY "Teachers can create enrollments" 
ON child_enrollments FOR INSERT 
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their enrollments" 
ON child_enrollments FOR UPDATE 
USING (auth.uid() = teacher_id);

-- Connection Requests RLS
CREATE POLICY "Users can view requests they sent or received" 
ON connection_requests FOR SELECT 
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create connection requests" 
ON connection_requests FOR INSERT 
WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update their own requests" 
ON connection_requests FOR UPDATE 
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_teacher_profiles_updated_at 
    BEFORE UPDATE ON teacher_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parent_profiles_updated_at 
    BEFORE UPDATE ON parent_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_child_enrollments_updated_at 
    BEFORE UPDATE ON child_enrollments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to accept connection request and create enrollment
CREATE OR REPLACE FUNCTION accept_connection_request(request_id UUID)
RETURNS VOID AS $$
DECLARE
    v_request RECORD;
    v_child_id UUID;
    v_teacher_id UUID;
    v_parent_id UUID;
BEGIN
    -- Get the request details
    SELECT * INTO v_request FROM connection_requests WHERE id = request_id;
    
    IF v_request IS NULL THEN
        RAISE EXCEPTION 'Connection request not found';
    END IF;
    
    IF v_request.status != 'pending' THEN
        RAISE EXCEPTION 'Connection request is not pending';
    END IF;
    
    -- Determine teacher and parent
    IF v_request.from_user_type = 'teacher' THEN
        v_teacher_id := v_request.from_user_id;
        v_parent_id := v_request.to_user_id;
    ELSE
        v_teacher_id := v_request.to_user_id;
        v_parent_id := v_request.from_user_id;
    END IF;
    
    v_child_id := v_request.child_id;
    
    -- Update request status
    UPDATE connection_requests 
    SET status = 'accepted', responded_at = now()
    WHERE id = request_id;
    
    -- Create enrollment if child_id is provided
    IF v_child_id IS NOT NULL THEN
        INSERT INTO child_enrollments (child_id, teacher_id, parent_id, class_year)
        VALUES (v_child_id, v_teacher_id, v_parent_id, EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '-' || (EXTRACT(YEAR FROM CURRENT_DATE) + 1)::TEXT)
        ON CONFLICT (child_id, teacher_id, parent_id, class_year) DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE teacher_profiles IS 'Extended profile information for teachers';
COMMENT ON TABLE parent_profiles IS 'Extended profile information for parents';
COMMENT ON TABLE child_enrollments IS 'Links children to their teachers and parents for a school year';
COMMENT ON TABLE connection_requests IS 'Pending/accepted/rejected connection requests between teachers and parents';
