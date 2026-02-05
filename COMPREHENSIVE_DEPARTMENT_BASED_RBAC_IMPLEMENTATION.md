# Comprehensive Department-Based RBAC Implementation

## Overview
This implementation creates a complete department-based academic management system with strict Role-Based Access Control (RBAC) that follows real-world university structure. The system ensures users only see and manage data related to their assigned department(s) and course(s).

## Database Schema Enhancements

### New Tables Created
1. **instructor_department_assignments** - Many-to-many relationship for instructor-department assignments
2. **instructor_course_assignments** - Many-to-many relationship for instructor-course assignments  
3. **course_enrollments** - Enhanced student-course enrollments with status tracking
4. **notifications** - System notifications for assignments, grades, etc.

### Enhanced Tables
- **profiles** - Added primary_department_id, phone, address, hire_date, is_active
- **departments** - Added head_of_department reference
- **courses** - Added max_enrollment, is_active, primary_instructor_id
- **assignments** - Enhanced with file upload settings, late submission policies
- **submissions** - Added file metadata, grade percentage, status tracking

### Key Features
- **Multi-department instructor assignments** - Instructors can be assigned to multiple departments
- **Course-specific instructor assignments** - Granular control over which courses instructors teach
- **Enrollment capacity management** - Courses have maximum enrollment limits
- **Comprehensive audit trails** - Track who assigned what and when
- **Row Level Security (RLS)** - Database-level access control

## API Endpoints Created

### Admin APIs
- `POST /api/admin/users` - Create users with department/course assignments
- `GET /api/admin/users` - List all users with assignment details
- `POST /api/admin/assignments/departments` - Assign instructors to departments
- `DELETE /api/admin/assignments/departments` - Remove department assignments
- `POST /api/admin/assignments/courses` - Assign instructors to courses
- `DELETE /api/admin/assignments/courses` - Remove course assignments
- `POST /api/admin/enrollments` - Enroll students in courses
- `DELETE /api/admin/enrollments` - Remove student enrollments

### Instructor APIs
- `GET /api/instructor/departments` - Get assigned departments with courses and students

### Student APIs
- `GET /api/student/courses` - Get enrolled courses and department information

## Role-Based Access Control Implementation

### Admin (Full System Control)
**Permissions:**
- ✅ Manage all users (create, update, delete, change roles)
- ✅ Create and manage all departments
- ✅ Create and manage all courses
- ✅ Assign instructors to departments and courses
- ✅ Enroll students in courses
- ✅ View all assignments (read-only)
- ✅ Access all system settings and reports
- ✅ Global access to all departments, courses, and users

**Key Features:**
- Can create instructor accounts with specific department/course assignments
- Can reassign instructors between departments and courses
- Can manage student enrollments across all departments
- Has override access to all data regardless of department boundaries

### Instructor (Department & Course Limited)
**Permissions:**
- ✅ View assigned department(s) information
- ✅ View courses in assigned departments
- ✅ Create assignments ONLY for assigned courses
- ✅ View and grade submissions for their courses
- ✅ View students ONLY from assigned departments
- ✅ Track student progress in their courses
- ✅ Export grades and analytics for their courses

**Restrictions:**
- ❌ Cannot view other departments
- ❌ Cannot view other instructors' courses
- ❌ Cannot create assignments outside assigned courses
- ❌ Cannot access students from other departments
- ❌ Cannot create or manage courses (admin only)

**Navigation:**
- "My Departments" menu showing:
  - Assigned departments with primary department indicator
  - Courses under each department (with assignment status)
  - Students under each department
  - Course and student counts

### Student (View & Participate Only)
**Permissions:**
- ✅ View their primary department information
- ✅ View ONLY enrolled courses
- ✅ View active and completed courses separately
- ✅ View assignments for enrolled courses
- ✅ Submit assignments with file upload
- ✅ Track submission status and deadlines
- ✅ View grades and feedback
- ✅ Receive assignment notifications

**Restrictions:**
- ❌ Cannot create assignments
- ❌ Cannot manage courses
- ❌ Cannot access other departments
- ❌ Cannot view other students' information
- ❌ Cannot see courses they're not enrolled in

**Features:**
- Department overview with course progress
- Upcoming assignment deadlines
- Completion rate tracking
- Grade history and feedback

## User Interface Implementation

### Navigation Updates
- **Admin**: User Management, Departments, Courses, Assignments, Enrollments, Reports, Settings
- **Instructor**: My Departments, My Courses, Assignments, Grading, Students  
- **Student**: My Department, My Courses, Assignments, My Submissions

### New Pages Created

#### Instructor Pages
- `/instructor/departments` - Comprehensive department overview with:
  - Department list with primary department indicator
  - Course assignments and enrollment counts
  - Student lists per department
  - Quick actions for assignment creation

#### Student Pages
- `/student/department` - Department-focused view with:
  - Department information and description
  - Active vs completed course tabs
  - Progress tracking per course
  - Upcoming assignment deadlines
  - Course completion rates

## Example Scenarios (Based on Requirements)

### Scenario 1: Development Economics Department
- **Department**: Development Economics (3 instructors, 9 students)
- **Access Control**: Those 3 instructors can ONLY see those 9 students
- **Course Isolation**: Instructors only see courses in Development Economics
- **Student Filtering**: Students only see other students in their department (privacy)

### Scenario 2: Multi-Department Instructor (Mr. Kebebe)
- **Assignments**: Development Economics + Software Engineering departments
- **Course Access**: 
  - Can create "Macro" assignments for Development Economics students
  - Can create "Basic Economics" assignments for Software Engineering students
- **Student Lists**: Sees different student lists per department
- **Department Switching**: Clear department selection interface

### Scenario 3: Cross-Department Course Enrollment
- **Validation**: System warns when enrolling students in courses outside their primary department
- **Flexibility**: Admin can still enroll students across departments if needed
- **Tracking**: Maintains audit trail of cross-department enrollments

## Security Implementation

### Database Level (Row Level Security)
- **Departments**: Users can only see departments they're assigned to
- **Courses**: Filtered by department assignments and enrollments
- **Assignments**: Filtered by course access permissions
- **Students**: Instructors only see students in their departments

### API Level
- **Token-based authentication** for all endpoints
- **Role verification** before data access
- **Department boundary enforcement** in all queries
- **Assignment permission validation** before creation

### Frontend Level
- **Route protection** based on user roles
- **Component-level permission checks**
- **Dynamic navigation** based on role and assignments
- **Data filtering** in UI components

## Data Flow Examples

### Instructor Creating Assignment
1. Instructor logs in → Gets assigned departments/courses
2. Navigates to "My Departments" → Sees only assigned departments
3. Selects department → Sees only courses in that department
4. Clicks "Create Assignment" → Dropdown shows only assigned courses
5. Creates assignment → System validates course ownership
6. Assignment visible to → Only students enrolled in that course

### Student Viewing Courses
1. Student logs in → Gets primary department and enrollments
2. Navigates to "My Department" → Sees department overview
3. Views "Active Courses" → Sees only enrolled courses
4. Clicks course → Sees assignments for that course only
5. Submits assignment → Visible to course instructors only

### Admin Managing Users
1. Admin creates instructor → Assigns to specific departments
2. Admin assigns courses → Validates department membership first
3. Admin enrolls student → Can override department boundaries
4. Admin views reports → Has global access to all data

## Implementation Benefits

### 1. **Real-World University Structure**
- Mirrors actual academic department organization
- Supports complex instructor-department relationships
- Handles cross-departmental scenarios appropriately

### 2. **Strict Data Isolation**
- No accidental cross-department data access
- Clear boundaries between instructor responsibilities
- Student privacy protection within departments

### 3. **Scalable Architecture**
- Supports unlimited departments and courses
- Handles complex many-to-many relationships
- Efficient database queries with proper indexing

### 4. **Comprehensive Audit Trail**
- Tracks all assignments and enrollments
- Records who made changes and when
- Supports compliance and reporting requirements

### 5. **Flexible Permission Model**
- Admin can override restrictions when needed
- Supports emergency access scenarios
- Maintains security while allowing necessary flexibility

## Testing Scenarios

### Department Isolation Test
1. Create 2 departments with different instructors and students
2. Verify Instructor A cannot see Department B's students
3. Verify Instructor A cannot create assignments for Department B courses
4. Verify students only see their department's courses

### Multi-Department Instructor Test
1. Assign instructor to multiple departments
2. Verify they see all assigned departments in "My Departments"
3. Verify course creation is limited to assigned courses
4. Verify student lists are properly separated by department

### Student Enrollment Test
1. Enroll student in courses from their department
2. Verify they see all enrolled courses
3. Verify they cannot see non-enrolled courses
4. Test cross-department enrollment (admin only)

### Admin Override Test
1. Verify admin can see all departments and courses
2. Test admin ability to assign instructors across departments
3. Verify admin can enroll students in any course
4. Test admin access to all assignments and submissions

## Future Enhancements

### Phase 2 Features
- **Notification System**: Real-time notifications for assignments and grades
- **File Upload Management**: Secure file storage and retrieval
- **Advanced Reporting**: Department-wise analytics and reports
- **Grade Book Integration**: Comprehensive grading workflows
- **Calendar Integration**: Assignment deadlines and course schedules

### Phase 3 Features
- **Mobile Application**: Native mobile app with offline support
- **Integration APIs**: Connect with existing university systems
- **Advanced Analytics**: Machine learning for student performance prediction
- **Communication Tools**: Built-in messaging between instructors and students

This implementation provides a solid foundation for a real-world university assignment management system with proper department-based access control and role-based permissions.