# Assignment Creation & Course RBAC Fix

## Issues Fixed

### 1. "Invalid course ID" Error in Assignment Creation
**Problem**: When instructors tried to create assignments, they got "Invalid course ID" error because the assignments API was trying to use Supabase database tables while courses were stored in mock storage.

**Solution**: 
- Added assignment support to mock storage (`lib/mock-storage.ts`)
- Updated assignments API (`app/api/assignments/route.ts`) to use mock storage instead of Supabase
- Added proper course validation in mock storage assignment creation
- Updated both assignment creation page and assignments list page to use authentication headers

### 2. Course Creation Restricted to Admin Only
**Problem**: Both admins and instructors could create courses, but user wanted only admins to have this permission.

**Solution**:
- Updated courses page (`app/courses/page.tsx`): Changed `canCreateCourse` from `admin || instructor` to `admin` only
- Updated courses API (`app/api/courses/route.ts`): Restricted POST endpoint to admin only
- Instructors can still manage assignments for existing courses, but cannot create new courses

## Files Modified

### 1. `lib/mock-storage.ts`
- Added `Assignment` type definition
- Added `mockAssignments` storage array
- Added assignment CRUD functions:
  - `getAllAssignments()`
  - `getAssignmentsByInstructor(instructorId)`
  - `getAssignmentsByCourse(courseId)`
  - `addAssignment(assignmentData)`
  - `getAssignmentById(id)`
  - `updateAssignment(id, updates)`
  - `deleteAssignment(id)`

### 2. `app/api/assignments/route.ts`
- Completely rewritten to use token-based authentication (consistent with courses API)
- Updated to use mock storage instead of Supabase database
- Added proper role-based filtering:
  - Admin: sees all assignments
  - Instructor: sees only their assignments
  - Student: sees empty list (to be implemented with enrollment logic)
- Added proper error handling for invalid course IDs

### 3. `app/assignments/create/page.tsx`
- Added authentication headers for course fetching
- Added authentication headers for assignment creation
- Improved error handling and user feedback

### 4. `app/assignments/page.tsx`
- Added authentication headers for assignment fetching
- Updated to work with new assignments API structure

### 5. `app/courses/page.tsx`
- Restricted course creation to admin only
- Updated UI text and permissions accordingly

### 6. `app/api/courses/route.ts`
- Restricted POST endpoint to admin only
- Updated error messages to reflect admin-only course creation

## Current RBAC Summary

### Admin (`admin@university.edu`)
- ✅ Create/manage departments
- ✅ Create/manage courses
- ✅ Create/manage assignments
- ✅ Manage all users and roles
- ✅ Access all system features

### Instructor
- ❌ Cannot create courses (admin only)
- ✅ Can create assignments for existing courses
- ✅ Can view/manage their assignments
- ✅ Can access grading features
- ✅ Can view enrolled students

### Student
- ❌ Cannot create courses
- ❌ Cannot create assignments
- ✅ Can view assigned courses
- ✅ Can submit assignments
- ✅ Can view their submissions and grades

## Testing Instructions

1. **Test Assignment Creation (Instructor)**:
   - Sign in as instructor (`tadelebizu@gmail.com`)
   - Navigate to "Create Assignment"
   - Verify course dropdown is populated
   - Create a test assignment
   - Verify success message and assignment appears in list

2. **Test Course Creation Restriction**:
   - Sign in as instructor
   - Navigate to courses page
   - Verify "Create Course" button is NOT visible
   - Sign in as admin (`admin@university.edu`)
   - Verify "Create Course" button IS visible

3. **Test API Endpoints**:
   - Try POST to `/api/courses` as instructor → should get 403 Forbidden
   - Try POST to `/api/courses` as admin → should work
   - Try POST to `/api/assignments` as instructor → should work
   - Try POST to `/api/assignments` as student → should get 403 Forbidden

## Next Steps

- Implement proper student enrollment system
- Add assignment submission functionality
- Implement grading workflow
- Add email notifications for assignments