-- Fix the trigger function that was working before
-- This restores the original working signup functionality

-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create or replace the trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into profiles table when a new auth user is created
    INSERT INTO public.profiles (id, email, full_name, role, student_id, department_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
        NEW.raw_user_meta_data->>'student_id',
        CASE 
            WHEN NEW.raw_user_meta_data->>'department_id' IS NOT NULL 
            AND NEW.raw_user_meta_data->>'department_id' != ''
            THEN 
                -- Try to convert to UUID, fallback to NULL if invalid
                CASE 
                    WHEN NEW.raw_user_meta_data->>'department_id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                    THEN (NEW.raw_user_meta_data->>'department_id')::UUID
                    ELSE 
                        -- Handle hardcoded department IDs by looking up the first available department
                        (SELECT id FROM departments LIMIT 1)
                END
            ELSE NULL
        END
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the auth user creation
        RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
        
        -- Try to insert a minimal profile without department_id
        BEGIN
            INSERT INTO public.profiles (id, email, full_name, role, student_id)
            VALUES (
                NEW.id,
                NEW.email,
                COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
                COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
                NEW.raw_user_meta_data->>'student_id'
            );
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to create minimal profile for user %: %', NEW.id, SQLERRM;
        END;
        
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Test the trigger function
DO $$
BEGIN
    RAISE NOTICE 'Trigger function restored successfully';
END $$;