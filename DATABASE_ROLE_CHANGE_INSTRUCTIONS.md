# How to Change User Role Directly in Supabase Database

## Step-by-Step Instructions:

### 1. Go to Supabase Dashboard
- Open https://supabase.com/dashboard
- Select your project: `jcbnprvpceywmkfdcyyy`

### 2. Navigate to Authentication
- Click **"Authentication"** in the left sidebar
- Click **"Users"** tab

### 3. Find Your User
- Look for the user you want to make admin
- If no users exist, create a student account first via your app's signup

### 4. Edit User Metadata
- Click on the user's email/row
- Scroll down to **"Raw User Meta Data"** section
- Click **"Edit"** button

### 5. Update the Role
Replace the existing JSON with this:

```json
{
  "role": "admin",
  "full_name": "Admin User",
  "student_id": null
}
```

### 6. Save Changes
- Click **"Update user"**
- The user now has admin role

### 7. Test Login
- Go to your app's signin page
- Login with that user's email and password
- You should now have admin access at `/admin`

## Alternative: Create New Admin User in Supabase

If you want to create a completely new admin user:

### 1. In Supabase Dashboard
- Go to Authentication → Users
- Click **"Add user"**

### 2. Fill in Details:
- **Email**: `admin@university.edu`
- **Password**: `Admin123!@#`
- **Auto Confirm User**: ✅ (check this box)

### 3. After Creating User:
- Click on the newly created user
- Edit "Raw User Meta Data" with:
```json
{
  "role": "admin",
  "full_name": "System Administrator",
  "student_id": null
}
```

### 4. Save and Test
- User can now login with admin@university.edu / Admin123!@#
- Will have full admin access

## Quick Test:
1. Login with the admin credentials
2. Go to `/admin` in your app
3. You should see the admin dashboard with user management