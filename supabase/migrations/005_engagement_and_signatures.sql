-- Phase 3 & 4: Engagement & Verification Infrastructure

-- 1. Diary Acknowledgments (Signatures)
CREATE TABLE IF NOT EXISTS public.diary_acknowledgments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID REFERENCES public.diary_entries(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    signed_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(entry_id, parent_id)
);

-- 2. Micro-Messaging System
CREATE TABLE IF NOT EXISTS public.diary_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID REFERENCES public.child_profile(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Notifications / Status Badges
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'new_entry', 'new_message', 'signature'
    related_id UUID, -- entry_id or message_id
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Indices for performance
CREATE INDEX IF NOT EXISTS idx_messages_child ON public.diary_messages(child_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.diary_messages(receiver_id, is_read);
CREATE INDEX IF NOT EXISTS idx_acks_entry ON public.diary_acknowledgments(entry_id);
