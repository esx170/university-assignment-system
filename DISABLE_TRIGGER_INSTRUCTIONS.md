# Fix Authentication - Disable Supabase Trigger

## The Problem
You're getting "Database error saving new user" because there's a Supabase database trigger trying to create a profile record when users sign up, but it's failing due to schema conflicts.

## The Solution
We need to disable the problematic trigger in your Supabase database.

## Steps to Fix:

### 1. Go to Supabase Dashboard
- Open https://supabase.com/dashboard
- Select your project: `jcbnprvpceywmkfdcyyy`

### 2. Open SQL Editor
- Click on "SQL Editor" in the left sidebar
- Click "New Query"

### 3. Run This SQL Command
Copy and paste this SQL code and click "Run":

```sql
-- Disable the problematic trigger that's causing signup errors
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
```

### 4. Test Authentication
After running the SQL command:
- Go back to your app
- Try signing up with a new account
- It should work without the "Database error" message

## What This Does
- Removes the automatic profile creation trigger
- Your app will now store user data in Supabase Auth metadata only
- This is simpler and avoids database schema conflicts

## Alternative: Use Supabase Auth Settings
You can also disable email confirmation in Supabase:
1. Go to Authentication → Settings
2. Under "User Signups", toggle off "Enable email confirmations"
3. This allows immediate login after signup

Your authentication should now work properly!