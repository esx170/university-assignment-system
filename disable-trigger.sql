-- Disable the problematic trigger temporarily
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function too to prevent any issues
DROP FUNCTION IF EXISTS public.handle_new_user();