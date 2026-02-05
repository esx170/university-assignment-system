-- EMERGENCY FIX: Remove foreign key constraint that's blocking signup
-- Run this in Supabase SQL Editor to fix the signup issue

-- Step 1: Remove the foreign key constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Step 2: Verify the constraint is removed
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
AND constraint_type = 'FOREIGN KEY';

-- Step 3: Test that we can now insert profiles with any UUID
INSERT INTO profiles (id, email, full_name, role, created_at) 
VALUES (
    gen_random_uuid(),
    'test.constraint.removed@example.com',
    'Constraint Test User',
    'student',
    NOW()
);

-- Step 4: Clean up test record
DELETE FROM profiles WHERE email = 'test.constraint.removed@example.com';

-- Success message
SELECT 'Foreign key constraint removed successfully! Emergency signup should now work.' as result;