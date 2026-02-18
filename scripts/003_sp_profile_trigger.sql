-- ============================================
-- Soirees Pixels - Auto-create profile on signup
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_sp_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.sp_profiles (id, display_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'display_name', new.email),
    'organizer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created_sp ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created_sp
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_sp_user();
