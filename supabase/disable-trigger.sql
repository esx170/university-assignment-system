-- Disable the problematic trigger that's causing signup errors
-- This allows us to use Supabase Auth without automatic profile creation

-- Drop the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Optional: Drop the profiles table if you want to use metadata-only approach
-- DROP TABLE IF EXISTS public.profiles CASCADE;