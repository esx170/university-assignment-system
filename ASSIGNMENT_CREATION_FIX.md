# Assignment Creation Course Dropdown Fix

## Issue
When instructors tried to create assignments, the course dropdown was empty because the assignment creation page wasn't sending authentication headers when fetching courses from `/api/courses`.

## Root Cause
The `/api/courses` API requires authentication via Bearer token in the Authorization header, but the assignment creation page (`app/assignments/create/page.tsx`) was making the API call without any authentication headers.

## Solution Applied
Updated `app/assignments/create/page.tsx` to:

1. **Import Supabase client**: Added `import { supabase } from '@/lib/supabase'`

2. **Get user session token**: Modified the `loadData()` function to get the user's session token:
   ```typescript
   const { data: { session } } = await supabase.auth.getSession()
   ```

3. **Include authentication headers**: Updated the courses API call to include the Bearer token:
   ```typescript
   const response = await fetch('/api/courses', {
     headers: {
       'Authorization': `Bearer ${session.access_token}`,
       'Content-Type': 'application/json'
     }
   })
   ```

4. **Enhanced assignment creation**: Also updated the assignment creation API call to include authentication headers for consistency.

## Files Modified
- `app/assignments/create/page.tsx` - Added authentication headers for both course fetching and assignment creation

## Testing Instructions
1. Start the development server: `npm run dev`
2. Sign in as an instructor (e.g., `tadelebizu@gmail.com`)
3. Navigate to "Create Assignment" from the assignments page
4. Verify that the "Course" dropdown now shows available courses
5. Create a test assignment to ensure the full flow works

## Expected Behavior
- Instructors should now see their courses in the dropdown when creating assignments
- The course list should be filtered based on the instructor's role and department
- Assignment creation should work end-to-end

## Technical Details
The fix ensures that:
- Authentication tokens are properly passed to the courses API
- Only courses that the instructor has access to are shown
- The API authentication flow is consistent across the application