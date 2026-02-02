# Production Deployment Guide - Force Fresh Build

## 🚨 **Current Issue:**
Production is showing old signup errors despite local fixes working correctly.

## 🔧 **Solution Steps:**

### **Step 1: Verify Latest Code is Pushed**
✅ **DONE** - Latest commit `60310fb` pushed with all RBAC fixes

### **Step 2: Clear Vercel Cache and Force Redeploy**

#### **Option A: Vercel Dashboard (Recommended)**
1. Go to https://vercel.com/dashboard
2. Find project: `university-assignment-system`
3. Go to **Deployments** tab
4. Click **"..."** menu on latest deployment
5. Select **"Redeploy"**
6. Check **"Use existing Build Cache"** = **OFF** (important!)
7. Click **"Redeploy"**

#### **Option B: Vercel CLI**
```bash
npm i -g vercel
vercel --prod --force
```

### **Step 3: Verify Environment Variables**
In Vercel Dashboard → Settings → Environment Variables:

**Required Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` = `https://jcbnprvpceywmkfdcyyy.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- `SUPABASE_SERVICE_ROLE_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**Environment**: All (Production, Preview, Development)

### **Step 4: Test Production Deployment**

#### **Check Deployment Status:**
Visit: `https://your-app-url.vercel.app/api/production-check`

**Expected Response:**
```json
{
  "version": "2.0.0-rbac-complete",
  "environment": "production",
  "hasSupabaseUrl": true,
  "hasSupabaseAnonKey": true,
  "hasSupabaseServiceKey": true,
  "features": [
    "RBAC System",
    "Admin Dashboard",
    "Role Management",
    "Protected Routes",
    "Student-only Registration",
    "Hardcoded Admin User"
  ]
}
```

#### **Test Key Features:**
1. **Student Registration**: Should work without role selection
2. **Admin Login**: `admin@university.edu` / `Admin123!@#`
3. **Admin Dashboard**: `/admin` should show user management
4. **Role Changes**: Admin should be able to change user roles

### **Step 5: Create Production Admin User**

#### **Method 1: API Route**
Visit: `https://your-app-url.vercel.app/set-admin`
- Click "Set as Admin" button

#### **Method 2: Supabase Dashboard**
1. Go to Supabase → Authentication → Users
2. Create user: `admin@university.edu` / `Admin123!@#`
3. Edit user metadata: `{"role": "admin", "full_name": "System Administrator"}`

## 🎯 **Expected Production Features:**

### **Authentication:**
- ✅ Student-only public registration (no role selection)
- ✅ Admin login with hardcoded credentials
- ✅ Proper role-based access control

### **Admin Dashboard:**
- ✅ User management at `/admin`
- ✅ Role change dropdowns (Student/Instructor only)
- ✅ System admin protection (cannot be modified)

### **Dashboard Pages:**
- ✅ `/courses` - Role-based course view
- ✅ `/assignments` - Assignment management
- ✅ `/submissions` - Student submission tracking
- ✅ `/grading` - Instructor grading interface
- ✅ `/admin/settings` - System configuration

## 🔍 **Troubleshooting:**

### **If Still Showing Old Code:**
1. **Hard refresh**: Ctrl+F5 or Cmd+Shift+R
2. **Clear browser cache**: Settings → Clear browsing data
3. **Try incognito/private mode**
4. **Check different browser**

### **If Environment Variables Missing:**
1. Verify all 3 variables are set in Vercel
2. Ensure they're enabled for "Production" environment
3. Redeploy after adding variables

### **If Admin Access Denied:**
1. Check `/api/production-check` shows correct environment
2. Use `/set-admin` to force set admin role
3. Verify login with exact credentials: `admin@university.edu`

## ✅ **Success Criteria:**

**Production deployment is successful when:**
- ✅ Student signup works without role selection
- ✅ Admin can login and access `/admin`
- ✅ Admin can change user roles
- ✅ All dashboard pages load correctly
- ✅ No old signup errors appear

**Current Status:** 🔄 **Deployment in progress - waiting for Vercel build**