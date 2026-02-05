-- Enhanced trigger function that handles errors gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    dept_uuid UUID;
BEGIN
    -- Handle department_id conversion
    dept_uuid := NULL;
    
    IF NEW.raw_user_meta_data->>'department_id' IS NOT NULL THEN
        -- Try to convert department_id to UUID
        BEGIN
            -- If it's already a UUID, use it directly
            dept_uuid := (NEW.raw_user_meta_data->>'department_id')::UUID;
        EXCEPTION WHEN invalid_text_representation THEN
            -- If it's a number like "1", "2", etc., map to actual department
            CASE NEW.raw_user_meta_data->>'department_id'
                WHEN '1' THEN 
                    SELECT id INTO dept_uuid FROM departments WHERE code = 'CS' LIMIT 1;
                WHEN '2' THEN 
                    SELECT id INTO dept_uuid FROM departments WHERE code = 'MATH' LIMIT 1;
                WHEN '3' THEN 
                    SELECT id INTO dept_uuid FROM departments WHERE code = 'PHYS' LIMIT 1;
                WHEN '4' THEN 
                    SELECT id INTO dept_uuid FROM departments WHERE code = 'BUS' LIMIT 1;
                WHEN '5' THEN 
                    SELECT id INTO dept_uuid FROM departments WHERE code = 'DECON' LIMIT 1;
                WHEN '6' THEN 
                    SELECT id INTO dept_uuid FROM departments WHERE code = 'SE' LIMIT 1;
                ELSE
                    -- Default to first department if no match
                    SELECT id INTO dept_uuid FROM departments ORDER BY name LIMIT 1;
            END CASE;
        END;
    END IF;

    -- Insert profile with error handling
    BEGIN
        INSERT INTO public.profiles (id, email, full_name, role, student_id, department_id)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
            COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
            NEW.raw_user_meta_data->>'student_id',
            dept_uuid
        );
    EXCEPTION WHEN OTHERS THEN
        -- If department_id column doesn't exist, try without it
        INSERT INTO public.profiles (id, email, full_name, role, student_id)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
            COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
            NEW.raw_user_meta_data->>'student_id'
        );
    END;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();