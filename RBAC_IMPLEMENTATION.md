# Role-Based Access Control (RBAC) Implementation

## Overview
This system implements a secure role-based access control system with the following key features:

## Role Hierarchy
1. **Student** (Default for public registration)
2. **Instructor** (Admin-created only)
3. **Admin** (Admin-created only)

## Public Registration Rules
- ✅ **Students ONLY** can register through the public signup page
- ✅ **Student ID is required** for all student registrations
- ✅ **Role is automatically set to "Student"** (no selection allowed)
- ❌ **Instructors and Admins CANNOT** register publicly

## Admin-Only Operations
- ✅ Create Instructor and Admin accounts
- ✅ Change user roles (Student ↔ Instructor ↔ Admin)
- ✅ View all users in the system
- ❌ Cannot modify their own role
- ❌ Non-admins cannot access admin functions

## Security Features

### 1. **API Route Protection**
```typescript
// All admin routes check for admin role
const user = await getCurrentUser()
if (!user || user.role !== 'admin') {
  return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
}
```

### 2. **Self-Role Modification Prevention**
```typescript
// Users cannot change their own roles
if (userId === adminUser.id) {
  throw new Error('Cannot modify your own role')
}
```

### 3. **Role Validation**
```typescript
// Strict role validation using Zod schemas
const UserRole = z.enum(['student', 'instructor', 'admin'])
```

## Implementation Details

### Files Modified/Created:
1. **`lib/validations.ts`** - Updated schemas for role management
2. **`lib/auth.ts`** - Added admin functions for user management
3. **`app/auth/signup/page.tsx`** - Restricted to student registration only
4. **`app/api/admin/users/route.ts`** - Admin user management API
5. **`app/api/admin/users/[id]/role/route.ts`** - Role update API
6. **`app/admin/page.tsx`** - Admin dashboard for user management
7. **`components/Navigation.tsx`** - Added admin navigation

### Database Storage:
- User data stored in **Supabase Auth user_metadata**
- No separate database tables needed
- Roles: `student`, `instructor`, `admin`

## Usage Instructions

### For Students:
1. Go to `/auth/signup`
2. Fill in: Name, Student ID, Email, Password
3. Account created with "Student" role automatically

### For Admins:
1. Access `/admin` dashboard
2. View all users and their roles
3. Change user roles using dropdown menus
4. Create new Instructor/Admin accounts (future feature)

### Role Changes:
- **Database**: Update `user_metadata.role` in Supabase Auth
- **Admin Dashboard**: Use the role dropdown in `/admin`

## Security Considerations
- ✅ All admin operations require authentication
- ✅ Role checks on both client and server side
- ✅ Prevents privilege escalation
- ✅ Audit trail in Supabase Auth logs
- ✅ No direct database access needed for role management

## Testing the System
1. Create a student account via public signup
2. Manually set one user to "admin" role in Supabase dashboard
3. Login as admin and access `/admin`
4. Test role changes and user management features