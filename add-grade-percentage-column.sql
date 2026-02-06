-- Add grade_percentage column to submissions table
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS grade_percentage NUMERIC;

-- Add graded_by column to track who graded the submission
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS graded_by UUID REFERENCES profiles(id);

-- Add status column if it doesn't exist
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'submitted';

-- Update existing submissions to have status
UPDATE submissions 
SET status = CASE 
  WHEN grade IS NOT NULL THEN 'graded'
  ELSE 'submitted'
END
WHERE status IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_graded_by ON submissions(graded_by);
