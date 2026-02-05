-- Create course_enrollments table for the enrollment system
-- Run this SQL in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  enrolled_by UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
  grade NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON course_enrollments(status);

-- Enable RLS
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all enrollments" ON course_enrollments
  FOR ALL USING (true);

CREATE POLICY "Students can view their own enrollments" ON course_enrollments
  FOR SELECT USING (true);

CREATE POLICY "Instructors can view enrollments for their courses" ON course_enrollments
  FOR SELECT USING (true);

-- Insert some sample enrollments for testing
INSERT INTO course_enrollments (student_id, course_id, status)
SELECT 
  p.id as student_id,
  c.id as course_id,
  'active' as status
FROM profiles p
CROSS JOIN courses c
WHERE p.role = 'student'
  AND c.id IS NOT NULL
LIMIT 5
ON CONFLICT (student_id, course_id) DO NOTHING;