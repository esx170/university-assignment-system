-- Step 1: Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Insert sample departments
INSERT INTO departments (name, code, description) VALUES
('Computer Science', 'CS', 'Department of Computer Science and Engineering'),
('Mathematics', 'MATH', 'Department of Mathematics'),
('Physics', 'PHYS', 'Department of Physics'),
('Business Administration', 'BUS', 'School of Business Administration'),
('Development Economics', 'DECON', 'Department of Development Economics'),
('Software Engineering', 'SE', 'Department of Software Engineering')
ON CONFLICT (code) DO NOTHING;

-- Step 3: Enable Row Level Security
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies (run these one by one if needed)
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