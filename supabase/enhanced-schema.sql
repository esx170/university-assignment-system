-- Enhanced University Assignment System Database Schema
-- This schema supports comprehensive department-based academic structure with multi-department instructor assignments

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS course_enrollments CASCADE;
DROP TABLE IF EXISTS instructor_department_assignments CASCADE;
DROP TABLE IF EXISTS instructor_course_assignments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- Departments table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT,
    head_of_department UUID, -- Will reference profiles(id) after profiles table is created
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'instructor', 'admin')),
    student_id VARCHAR(50) UNIQUE,
    primary_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    hire_date DATE, -- For instructors
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for department head after profiles table exists
ALTER TABLE departments ADD CONSTRAINT fk_head_of_department 
    FOREIGN KEY (head_of_department) REFERENCES profiles(id) ON DELETE SET NULL;

-- Instructor Department Assignments (Many-to-Many)
-- Allows instructors to be assigned to multiple departments
CREATE TABLE instructor_department_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES profiles(id), -- Admin who made the assignment
    is_primary BOOLEAN DEFAULT false, -- One department can be marked as primary
    UNIQUE(instructor_id, department_id),
    CHECK (
        -- Only instructors and admins can be assigned to departments
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = instructor_id 
            AND role IN ('instructor', 'admin')
        )
    )
);

-- Courses table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL,
    description TEXT,
    credits INTEGER NOT NULL DEFAULT 3,
    semester VARCHAR(20) NOT NULL,
    year INTEGER NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    primary_instructor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    max_enrollment INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(code, semester, year, department_id)
);

-- Instructor Course Assignments (Many-to-Many)
-- Allows multiple instructors per course and instructors to teach multiple courses
CREATE TABLE instructor_course_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES profiles(id), -- Admin who made the assignment
    is_primary BOOLEAN DEFAULT false, -- One instructor can be marked as primary
    UNIQUE(instructor_id, course_id),
    CHECK (
        -- Only instructors and admins can be assigned to courses
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = instructor_id 
            AND role IN ('instructor', 'admin')
        )
    )
);

-- Course enrollments (Students to Courses - Many-to-Many)
CREATE TABLE course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    enrolled_by UUID REFERENCES profiles(id), -- Admin/Instructor who enrolled the student
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
    final_grade VARCHAR(5), -- A, B, C, D, F, etc.
    UNIQUE(course_id, student_id),
    CHECK (
        -- Only students can be enrolled in courses
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = student_id 
            AND role = 'student'
        )
    )
);

-- Assignments table
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    max_points INTEGER DEFAULT 100,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
    allow_late_submission BOOLEAN DEFAULT false,
    late_penalty_percent INTEGER DEFAULT 0 CHECK (late_penalty_percent >= 0 AND late_penalty_percent <= 100),
    file_types_allowed TEXT[], -- Array of allowed file extensions
    max_file_size_mb INTEGER DEFAULT 10,
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (
        -- Only instructors and admins can create assignments
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = instructor_id 
            AND role IN ('instructor', 'admin')
        )
    )
);

-- Submissions table
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    file_size_bytes BIGINT,
    submission_text TEXT, -- For text-based submissions
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_late BOOLEAN DEFAULT false,
    grade INTEGER CHECK (grade >= 0),
    grade_percentage DECIMAL(5,2) CHECK (grade_percentage >= 0 AND grade_percentage <= 100),
    feedback TEXT,
    graded_at TIMESTAMP WITH TIME ZONE,
    graded_by UUID REFERENCES profiles(id),
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'returned')),
    UNIQUE(assignment_id, student_id),
    CHECK (
        -- Only students can submit assignments
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = student_id 
            AND role = 'student'
        )
    )
);

-- Notifications table (for assignment notifications, grade notifications, etc.)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'assignment_posted', 'grade_released', 'course_update', etc.
    related_id UUID, -- Can reference assignment_id, course_id, etc.
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comprehensive indexes for performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_primary_department ON profiles(primary_department_id);
CREATE INDEX idx_profiles_active ON profiles(is_active);
CREATE INDEX idx_instructor_dept_assignments_instructor ON instructor_department_assignments(instructor_id);
CREATE INDEX idx_instructor_dept_assignments_department ON instructor_department_assignments(department_id);
CREATE INDEX idx_instructor_course_assignments_instructor ON instructor_course_assignments(instructor_id);
CREATE INDEX idx_instructor_course_assignments_course ON instructor_course_assignments(course_id);
CREATE INDEX idx_courses_department ON courses(department_id);
CREATE INDEX idx_courses_primary_instructor ON courses(primary_instructor_id);
CREATE INDEX idx_courses_active ON courses(is_active);
CREATE INDEX idx_course_enrollments_course ON course_enrollments(course_id);
CREATE INDEX idx_course_enrollments_student ON course_enrollments(student_id);
CREATE INDEX idx_course_enrollments_status ON course_enrollments(status);
CREATE INDEX idx_assignments_course ON assignments(course_id);
CREATE INDEX idx_assignments_instructor ON assignments(instructor_id);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_submissions_student ON submissions(student_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- Row Level Security (RLS) policies
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_department_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for departments
CREATE POLICY "Departments are viewable by authenticated users" ON departments 
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can manage departments" ON departments 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles 
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Instructors can view students in their departments" ON profiles 
    FOR SELECT USING (
        role = 'student' AND
        primary_department_id IN (
            SELECT department_id 
            FROM instructor_department_assignments 
            WHERE instructor_id = auth.uid()
        )
    );

-- RLS Policies for courses
CREATE POLICY "Users can view courses in their departments" ON courses 
    FOR SELECT USING (
        -- Admins can see all courses
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
        OR
        -- Instructors can see courses in their assigned departments
        (
            department_id IN (
                SELECT department_id 
                FROM instructor_department_assignments 
                WHERE instructor_id = auth.uid()
            )
        )
        OR
        -- Students can see courses they're enrolled in or in their department
        (
            id IN (
                SELECT course_id 
                FROM course_enrollments 
                WHERE student_id = auth.uid()
            )
            OR
            department_id IN (
                SELECT primary_department_id 
                FROM profiles 
                WHERE id = auth.uid()
            )
        )
    );

-- RLS Policies for assignments
CREATE POLICY "Users can view assignments for their courses" ON assignments 
    FOR SELECT USING (
        -- Admins can see all assignments
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
        OR
        -- Instructors can see assignments for courses they teach
        course_id IN (
            SELECT course_id 
            FROM instructor_course_assignments 
            WHERE instructor_id = auth.uid()
        )
        OR
        -- Students can see assignments for courses they're enrolled in
        course_id IN (
            SELECT course_id 
            FROM course_enrollments 
            WHERE student_id = auth.uid() 
            AND status = 'active'
        )
    );

-- Insert sample departments
INSERT INTO departments (name, code, description) VALUES
('Computer Science', 'CS', 'Department of Computer Science and Engineering'),
('Mathematics', 'MATH', 'Department of Mathematics'),
('Physics', 'PHYS', 'Department of Physics'),
('Business Administration', 'BUS', 'School of Business Administration'),
('Development Economics', 'DECON', 'Department of Development Economics'),
('Software Engineering', 'SE', 'Department of Software Engineering');

-- Functions to sync with Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, student_id, primary_department_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
        NEW.raw_user_meta_data->>'student_id',
        (NEW.raw_user_meta_data->>'department_id')::UUID
    );
    RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function to check if user can access department data
CREATE OR REPLACE FUNCTION public.user_can_access_department(dept_id UUID)
RETURNS BOOLEAN AS $
BEGIN
    -- Admin can access all departments
    IF EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Instructor can access assigned departments
    IF EXISTS (
        SELECT 1 FROM instructor_department_assignments 
        WHERE instructor_id = auth.uid() AND department_id = dept_id
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Student can access their primary department
    IF EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND primary_department_id = dept_id
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's accessible departments
CREATE OR REPLACE FUNCTION public.get_user_departments()
RETURNS TABLE(department_id UUID) AS $
BEGIN
    -- Admin can access all departments
    IF EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RETURN QUERY SELECT d.id FROM departments d;
    END IF;
    
    -- Instructor can access assigned departments
    IF EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'instructor'
    ) THEN
        RETURN QUERY 
        SELECT ida.department_id 
        FROM instructor_department_assignments ida 
        WHERE ida.instructor_id = auth.uid();
    END IF;
    
    -- Student can access their primary department
    RETURN QUERY 
    SELECT p.primary_department_id 
    FROM profiles p 
    WHERE p.id = auth.uid() AND p.primary_department_id IS NOT NULL;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;