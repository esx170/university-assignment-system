import { z } from 'zod'

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(['student', 'instructor', 'admin']),
  student_id: z.string().optional()
})

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

export const courseSchema = z.object({
  name: z.string().min(1, 'Course name is required'),
  code: z.string().min(1, 'Course code is required'),
  description: z.string().optional(),
  semester: z.string().min(1, 'Semester is required'),
  year: z.number().min(2020).max(2030)
})

export const assignmentSchema = z.object({
  course_id: z.string().uuid('Invalid course ID'),
  title: z.string().min(1, 'Assignment title is required'),
  description: z.string().optional(),
  due_date: z.string().min(1, 'Due date is required'),
  max_points: z.number().min(1, 'Max points must be at least 1'),
  allow_late: z.boolean().default(false),
  late_penalty: z.number().min(0).max(100).default(0),
  file_types: z.array(z.string()).default(['pdf', 'doc', 'docx', 'zip']),
  max_file_size: z.number().min(1).default(10) // MB
})

export const submissionSchema = z.object({
  assignment_id: z.string().uuid(),
  file: z.any().refine((file) => file instanceof File, 'File is required')
})

export const gradeSchema = z.object({
  grade: z.number().min(0),
  feedback: z.string().optional()
})

export const extensionRequestSchema = z.object({
  assignment_id: z.string().uuid(),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  requested_date: z.string().min(1, 'Requested date is required')
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type CourseInput = z.infer<typeof courseSchema>
export type AssignmentInput = z.infer<typeof assignmentSchema>
export type SubmissionInput = z.infer<typeof submissionSchema>
export type GradeInput = z.infer<typeof gradeSchema>
export type ExtensionRequestInput = z.infer<typeof extensionRequestSchema>