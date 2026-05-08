-- 1. Add Visual Identity to Students
ALTER TABLE child_profile ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 2. AUTOMATIC PROFILE CREATION TRIGGER
-- This ensures that every time a user signs up via Auth, 
-- a matching row is created in the 'users' table automatically.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, user_type, school_id)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    COALESCE(new.raw_user_meta_data->>'user_type', 'parent'),
    COALESCE((new.raw_user_meta_data->>'school_id')::uuid, NULL)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created in Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
