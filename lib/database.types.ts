export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'student' | 'instructor' | 'admin'
          student_id?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role: 'student' | 'instructor' | 'admin'
          student_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'student' | 'instructor' | 'admin'
          student_id?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          name: string
          code: string
          description?: string
          instructor_id: string
          semester: string
          year: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          description?: string
          instructor_id: string
          semester: string
          year: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          code?: string
          description?: string
          instructor_id?: string
          semester?: string
          year?: number
          updated_at?: string
        }
      }
      enrollments: {
        Row: {
          id: string
          student_id: string
          course_id: string
          enrolled_at: string
        }
        Insert: {
          id?: string
          student_id: string
          course_id: string
          enrolled_at?: string
        }
        Update: {
          student_id?: string
          course_id?: string
        }
      }
      assignments: {
        Row: {
          id: string
          course_id: string
          title: string
          description?: string
          due_date: string
          max_points: number
          rubric_url?: string
          allow_late: boolean
          late_penalty: number
          file_types: string[]
          max_file_size: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          description?: string
          due_date: string
          max_points: number
          rubric_url?: string
          allow_late?: boolean
          late_penalty?: number
          file_types?: string[]
          max_file_size?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string
          due_date?: string
          max_points?: number
          rubric_url?: string
          allow_late?: boolean
          late_penalty?: number
          file_types?: string[]
          max_file_size?: number
          updated_at?: string
        }
      }
      submissions: {
        Row: {
          id: string
          assignment_id: string
          student_id: string
          file_url: string
          file_name: string
          file_size: number
          submitted_at: string
          is_late: boolean
          grade?: number
          feedback?: string
          graded_at?: string
          graded_by?: string
        }
        Insert: {
          id?: string
          assignment_id: string
          student_id: string
          file_url: string
          file_name: string
          file_size: number
          submitted_at?: string
          is_late?: boolean
          grade?: number
          feedback?: string
          graded_at?: string
          graded_by?: string
        }
        Update: {
          file_url?: string
          file_name?: string
          file_size?: number
          grade?: number
          feedback?: string
          graded_at?: string
          graded_by?: string
        }
      }
      extension_requests: {
        Row: {
          id: string
          assignment_id: string
          student_id: string
          reason: string
          requested_date: string
          status: 'pending' | 'approved' | 'denied'
          reviewed_by?: string
          reviewed_at?: string
          created_at: string
        }
        Insert: {
          id?: string
          assignment_id: string
          student_id: string
          reason: string
          requested_date: string
          status?: 'pending' | 'approved' | 'denied'
          reviewed_by?: string
          reviewed_at?: string
          created_at?: string
        }
        Update: {
          status?: 'pending' | 'approved' | 'denied'
          reviewed_by?: string
          reviewed_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'assignment' | 'grade' | 'extension' | 'system'
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'assignment' | 'grade' | 'extension' | 'system'
          read?: boolean
          created_at?: string
        }
        Update: {
          read?: boolean
        }
      }
    }
  }
}