export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: Database["public"]["Enums"]["user_role"]
          student_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: Database["public"]["Enums"]["user_role"] | null
          student_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          student_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          id: string
          name: string
          code: string
          description: string | null
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
          description?: string | null
          instructor_id: string
          semester: string
          year: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          description?: string | null
          instructor_id?: string
          semester?: string
          year?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
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
          id?: string
          student_id?: string
          course_id?: string
          enrolled_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      assignments: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string | null
          due_date: string
          max_points: number
          rubric_url: string | null
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
          description?: string | null
          due_date: string
          max_points?: number
          rubric_url?: string | null
          allow_late?: boolean
          late_penalty?: number
          file_types?: string[]
          max_file_size?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string | null
          due_date?: string
          max_points?: number
          rubric_url?: string | null
          allow_late?: boolean
          late_penalty?: number
          file_types?: string[]
          max_file_size?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          }
        ]
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
          grade: number | null
          feedback: string | null
          graded_at: string | null
          graded_by: string | null
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
          grade?: number | null
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
        }
        Update: {
          id?: string
          assignment_id?: string
          student_id?: string
          file_url?: string
          file_name?: string
          file_size?: number
          submitted_at?: string
          is_late?: boolean
          grade?: number | null
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_graded_by_fkey"
            columns: ["graded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      extension_requests: {
        Row: {
          id: string
          assignment_id: string
          student_id: string
          reason: string
          requested_date: string
          status: Database["public"]["Enums"]["submission_status"]
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          assignment_id: string
          student_id: string
          reason: string
          requested_date: string
          status?: Database["public"]["Enums"]["submission_status"]
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          assignment_id?: string
          student_id?: string
          reason?: string
          requested_date?: string
          status?: Database["public"]["Enums"]["submission_status"]
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "extension_requests_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extension_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extension_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: Database["public"]["Enums"]["notification_type"]
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: Database["public"]["Enums"]["notification_type"]
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: Database["public"]["Enums"]["notification_type"]
          read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      notification_type: "assignment" | "grade" | "extension" | "system"
      submission_status: "pending" | "approved" | "denied"
      user_role: "student" | "instructor" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type UserRole = Database["public"]["Enums"]["user_role"]

// Query result types for joined data
export type AssignmentWithCourse = Database['public']['Tables']['assignments']['Row'] & {
  courses: {
    name: string
    code: string
    instructor_id: string
  }
}

export type AssignmentWithSubmissions = Database['public']['Tables']['assignments']['Row'] & {
  courses: {
    name: string
    code: string
  }
  submissions: Array<{
    id: string
    grade: number | null
    submitted_at: string
    student_id: string
  }>
}