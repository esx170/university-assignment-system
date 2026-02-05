# Database Persistence Fix - Departments and Courses

## Issue
Newly created departments and courses were disappearing after 3-5 minutes because the system was using in-memory mock storage instead of the actual Supabase database. This caused data loss and inconsistency.

## Root Cause
The APIs were using `lib/mock-storage.ts` which stores data in memory variables that get reset when:
- The server restarts (development mode restarts frequently)
- Memory is cleared after inactivity
- The application is redeployed

## Solution
Replaced all mock storage operations with actual Supabase database operations to ensure permanent data persistence.

## Files Modified

### 1. `app/api/departments/route.ts` - Complete Rewrite
**Before**: Used `getAllDepartments()`, `addDepartment()`, `updateDepartment()`, `deleteDepartment()` from mock storage
**After**: Direct Supabase database operations using `supabaseClient.from('departments')`

**Key Changes**:
- GET: `supabaseClient.from('departments').select('*').order('name')`
- POST: `supabaseClient.from('departments').insert({...}).select().single()`
- PUT: `supabaseClient.from('departments').update({...}).eq('id', id).select().single()`
- DELETE: `supabaseClient.from('departments').delete().eq('id', id)`
- Added proper unique constraint error handling (23505 error codes)
- Added dependency checking before deletion (prevents deleting departments with courses)

### 2. `app/api/courses/route.ts` - Complete Rewrite
**Before**: Used `getAllCourses()`, `addCourse()` from mock storage
**After**: Direct Supabase database operations with proper joins

**Key Changes**:
- GET: Joins with `departments` and `profiles` tables for complete course info
- POST: Validates department and instructor existence before creation
- Added unique constraint handling for course codes per semester/year
- Proper foreign key validation

### 3. `app/api/assignments/route.ts` - Complete Rewrite
**Before**: Used mock storage assignment functions
**After**: Direct Supabase database operations

**Key Changes**:
- GET: Joins with `courses` and `submissions` tables
- POST: Validates course existence and instructor permissions
- Role-based filtering (admin sees all, instructor sees their own, students see enrolled courses)

### 4. `app/admin/departments/page.tsx` - Authentication Headers
**Added**: Authentication headers to `loadDepartments()` function since the API now requires them

### 5. `app/courses/create/page.tsx` - Authentication Headers
**Added**: Authentication headers to `loadDepartments()` function for department dropdown

## Database Schema Utilized
The fix now properly uses the existing Supabase database schema:

```sql
-- Departments table (with unique constraints)
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses table (with foreign keys and unique constraints)
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL,
    description TEXT,
    credits INTEGER NOT NULL DEFAULT 3,
    semester VARCHAR(20) NOT NULL,
    year INTEGER NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(code, semester, year)
);

-- Assignments table (with foreign keys)
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    max_points INTEGER DEFAULT 100,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Benefits of the Fix

### 1. **Permanent Data Persistence**
- Departments and courses are now stored in PostgreSQL database
- Data survives server restarts, deployments, and time delays
- No more data loss after 3-5 minutes

### 2. **Data Integrity**
- Proper foreign key constraints prevent orphaned records
- Unique constraints prevent duplicate department codes/names
- Referential integrity between departments, courses, and assignments

### 3. **Better Error Handling**
- Specific error messages for constraint violations
- Dependency checking (can't delete department with courses)
- Proper validation of foreign key references

### 4. **Scalability**
- Database operations are optimized with indexes
- Proper joins reduce API calls
- Row Level Security (RLS) policies for data access control

### 5. **Production Ready**
- No more development-only mock storage
- Consistent behavior between local and production environments
- Proper database transactions and ACID compliance

## Testing Verification

To verify the fix works:

1. **Create Department Test**:
   - Sign in as admin (`admin@university.edu`)
   - Go to Admin → Departments
   - Create a new department
   - Wait 10+ minutes and refresh - department should still be there

2. **Create Course Test**:
   - Sign in as admin
   - Go to All Courses → Create Course
   - Create a new course
   - Wait 10+ minutes and refresh - course should still be there

3. **Database Verification**:
   - Check Supabase dashboard → Table Editor
   - Verify records exist in `departments` and `courses` tables
   - Confirm proper foreign key relationships

## Migration Notes

- **No data migration needed**: Previous mock data was temporary anyway
- **Existing users**: Will see empty lists initially, can recreate departments/courses
- **Production deployment**: Will automatically use the database schema
- **Environment variables**: Already configured correctly in `.env.local`

## Next Steps

1. **Implement Course Enrollments**: Add student enrollment functionality
2. **Assignment Submissions**: Complete the assignment submission workflow  
3. **File Storage**: Implement proper file upload for assignments
4. **Audit Logging**: Add change tracking for administrative actions
5. **Backup Strategy**: Implement regular database backups

The system now has proper database persistence and will maintain data consistency across all environments.