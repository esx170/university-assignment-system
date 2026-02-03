# Department-Based University Management System

## 🏗️ **System Architecture Overview**

This implementation creates a comprehensive department-based academic management system with proper Role-Based Access Control (RBAC).

## 📊 **Database Schema**

### **Core Tables:**
1. **departments** - Academic departments (CS, Math, Physics, etc.)
2. **profiles** - User profiles linked to Supabase Auth
3. **courses** - Courses belonging to departments
4. **course_enrollments** - Student-course relationships
5. **assignments** - Course assignments
6. **submissions** - Student assignment submissions

### **Key Relationships:**
- **Department → Courses** (One-to-Many)
- **Department → Users** (One-to-Many) 
- **Course → Assignments** (One-to-Many)
- **Course → Enrollments** (Many-to-Many with Students)
- **Assignment → Submissions** (One-to-Many)

## 👥 **Role-Based Access Control (RBAC)**

### **Admin Permissions:**
- ✅ Create/manage all departments
- ✅ Create/manage all courses across departments
- ✅ Assign instructors to departments/courses
- ✅ Manage all users (students/instructors)
- ✅ Change user roles (except creating new admins)
- ✅ Access all system settings and reports
- ✅ View all data across departments

### **Instructor Permissions:**
- ✅ View courses in their assigned department
- ✅ Create courses in their department only
- ✅ Create assignments for their courses
- ✅ Grade students in their courses
- ✅ View students from their department only
- ❌ Cannot access other departments' data
- ❌ Cannot manage users or system settings

### **Student Permissions:**
- ✅ View courses in their department only
- ✅ Enroll in department courses
- ✅ View assignments for enrolled courses
- ✅ Submit assignments
- ✅ View their own submissions and grades
- ❌ Cannot create assignments or courses
- ❌ Cannot access other departments' data
- ❌ Cannot manage users

## 🔐 **Authentication & Authorization**

### **Student Registration:**
- Public signup with department selection required
- Department dropdown populated from database
- Role automatically set to 'student'
- Cannot register with admin email

### **Instructor Creation:**
- Only admins can create instructor accounts
- Must be assigned to a specific department
- Cannot be created through public signup

### **Admin Access:**
- Single hardcoded admin: `admin@university.edu`
- Cannot create additional admin accounts
- Full system access across all departments

## 🏢 **Department-Based Logic**

### **Data Filtering:**
- **Students**: See only courses/assignments in their department
- **Instructors**: See only their department's courses and students
- **Admins**: See all data across departments

### **Course Management:**
- Courses belong to specific departments
- Instructors can only create courses in their department
- Students can only enroll in their department's courses

### **Assignment Workflow:**
- Instructors create assignments for their courses
- Only students enrolled in the course can submit
- Only the course instructor can grade submissions

## 🛠️ **API Endpoints**

### **Departments:**
- `GET /api/departments` - List all departments (public)
- `POST /api/departments` - Create department (admin only)

### **Courses:**
- `GET /api/courses` - List courses (filtered by department/role)
- `POST /api/courses` - Create course (admin/instructor)

### **Users:**
- `GET /api/admin/users` - List users (admin only)
- `POST /api/admin/users` - Create user (admin only)
- `PUT /api/admin/users/[id]/role` - Update role (admin only)

### **Settings:**
- `GET /api/admin/settings` - Get settings (admin only)
- `PUT /api/admin/settings` - Update settings (admin only)

## 🎯 **Key Features Implemented**

### **1. Course Creation & Management:**
- ✅ Proper course creation with department assignment
- ✅ Courses appear in list after creation
- ✅ Department-based filtering
- ✅ Instructor assignment

### **2. User Management:**
- ✅ Create instructor accounts with department assignment
- ✅ Role updates (Student ↔ Instructor)
- ✅ Department-based user filtering
- ✅ Proper RBAC enforcement

### **3. Department Structure:**
- ✅ Department creation (admin only)
- ✅ Department selection during student signup
- ✅ Department-based data isolation
- ✅ Sample departments pre-loaded

### **4. Assignment Permissions:**
- ✅ Students cannot access assignment creation
- ✅ Only instructors can create assignments
- ✅ Department-based assignment filtering
- ✅ Proper submission workflow

## 🔄 **Workflow Examples**

### **Student Workflow:**
1. Register with department selection
2. View courses in their department
3. Enroll in courses
4. View assignments for enrolled courses
5. Submit assignments
6. View grades and feedback

### **Instructor Workflow:**
1. Admin creates instructor account with department
2. Instructor logs in
3. Views courses in their department
4. Creates new courses in their department
5. Creates assignments for their courses
6. Grades student submissions

### **Admin Workflow:**
1. Creates departments
2. Creates instructor accounts
3. Assigns instructors to departments
4. Manages all courses and users
5. Configures system settings
6. Views reports across all departments

## 🚀 **Next Steps for Production**

### **Database Setup:**
1. Run the SQL schema in Supabase
2. Verify sample departments are created
3. Set up proper RLS policies

### **Environment Configuration:**
1. Ensure all Supabase environment variables are set
2. Configure proper authentication settings
3. Set up file storage for assignments

### **Testing:**
1. Test department-based filtering
2. Verify RBAC permissions
3. Test course creation and enrollment
4. Validate assignment submission workflow

## 📋 **System Benefits**

- **Realistic Academic Structure**: Mirrors real university organization
- **Proper Data Isolation**: Departments cannot access each other's data
- **Scalable Architecture**: Easy to add new departments and courses
- **Clear Permissions**: Well-defined roles and responsibilities
- **Security**: Proper authentication and authorization
- **User Experience**: Intuitive workflows for each role type

This implementation provides a solid foundation for a real university management system with proper academic structure and security controls.