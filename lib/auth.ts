import { supabase, supabaseAdmin } from './supabase'

export type Profile = {
  id: string
  email: string
  full_name: string
  role: 'student' | 'instructor' | 'admin'
  student_id: string | null
  created_at: Date
  updated_at: Date
}

// Hardcoded admin credentials - only this user can be admin
const ADMIN_EMAIL = 'admin@university.edu'
const ADMIN_PASSWORD = 'Admin123!@#'

export function isValidRole(role: unknown): role is 'student' | 'instructor' | 'admin' {
  return typeof role === 'string' && ['student', 'instructor', 'admin'].includes(role)
}

export async function getCurrentUser(): Promise<Profile | null> {
  try {
    // First, try to get user from our custom session (for users who signed up with working system)
    if (typeof window !== 'undefined') {
      const sessionData = localStorage.getItem('user_session')
      const userData = localStorage.getItem('user_data')
      
      if (sessionData && userData) {
        try {
          const session = JSON.parse(sessionData)
          const user = JSON.parse(userData)
          
          // Check if session is still valid (not expired)
          if (new Date(session.expires) > new Date()) {
            console.log('Using custom session for user:', user.email)
            return {
              id: user.id,
              email: user.email,
              full_name: user.full_name,
              role: user.role as 'student' | 'instructor' | 'admin',
              student_id: user.student_id || null,
              created_at: new Date(),
              updated_at: new Date()
            }
          } else {
            // Session expired, clear it
            console.log('Session expired, clearing localStorage')
            localStorage.removeItem('user_session')
            localStorage.removeItem('user_data')
          }
        } catch (parseError) {
          console.error('Error parsing session data:', parseError)
          // Clear corrupted data
          localStorage.removeItem('user_session')
          localStorage.removeItem('user_data')
        }
      }
    }

    // Fallback to Supabase auth (for existing users)
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) return null

      // Check if this is the hardcoded admin user
      const isHardcodedAdmin = user.email === ADMIN_EMAIL

      // Get user data from Supabase Auth metadata only
      return {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email || '',
        role: isHardcodedAdmin ? 'admin' : (user.user_metadata?.role as 'student' | 'instructor' | 'admin') || 'student',
        student_id: user.user_metadata?.student_id || null,
        created_at: new Date(user.created_at),
        updated_at: new Date()
      }
    } catch (supabaseError) {
      console.log('Supabase auth not available (expected for custom auth users)')
      return null
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Public signup - only for students (RESTORED ORIGINAL METHOD)
export async function signUp(email: string, password: string, userData: {
  full_name: string
  student_id: string
  department_id?: string
}): Promise<{ user: any; session: any; needsConfirmation?: boolean; message?: string }> {
  try {
    // Prevent admin email from being used in public signup
    if (email === ADMIN_EMAIL) {
      throw new Error('This email address is reserved for system administration')
    }

    // Use the original simple method that worked before
    console.log('Using original simple signup method...')
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userData.full_name,
          role: 'student', // Always student for public signup
          student_id: userData.student_id,
          department_id: userData.department_id
        }
      }
    })

    if (error) {
      console.error('Supabase auth error:', error)
      throw new Error(error.message)
    }

    if (!data.user) {
      throw new Error('Failed to create user account')
    }

    console.log('Student account created successfully:', data.user.id)
    
    // Check if email confirmation is required
    if (data.user && !data.session) {
      console.log('Email confirmation required')
      return { 
        user: data.user,
        session: data.session,
        needsConfirmation: true,
        message: 'Please check your email to confirm your account before signing in.'
      }
    }

    return {
      user: data.user,
      session: data.session
    }
  } catch (error: any) {
    console.error('Signup error:', error)
    throw error
  }
}

// Create the hardcoded admin user if it doesn't exist
export async function ensureAdminExists() {
  try {
    // Check if admin user exists
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
    if (error) {
      console.error('Error checking admin user:', error)
      return
    }

    const adminExists = users.some(user => user.email === ADMIN_EMAIL)
    
    if (!adminExists) {
      console.log('Creating hardcoded admin user...')
      const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        user_metadata: {
          full_name: 'System Administrator',
          role: 'admin',
          student_id: null
        },
        email_confirm: true
      })

      if (createError) {
        console.error('Error creating admin user:', createError)
      } else {
        console.log('Admin user created successfully:', data.user?.id)
      }
    }
  } catch (error) {
    console.error('Error ensuring admin exists:', error)
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('Supabase signin error:', error)
      throw new Error(error.message)
    }

    return data
  } catch (error: any) {
    console.error('Signin error:', error)
    throw error
  }
}

export async function signOut() {
  // Clear custom session data
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user_session')
    localStorage.removeItem('user_data')
    localStorage.removeItem('emergency_session')
    localStorage.removeItem('emergency_user')
    localStorage.removeItem('emergency_auth')
  }

  // Also try to sign out from Supabase (for fallback users)
  try {
    const { error } = await supabase.auth.signOut()
    if (error) console.log('Supabase signout error (expected for custom auth users):', error.message)
  } catch (error) {
    console.log('Supabase signout failed (expected for custom auth users)')
  }
}

export function hasRole(profile: Profile | null, allowedRoles: ('student' | 'instructor' | 'admin')[]): boolean {
  return profile ? allowedRoles.includes(profile.role) : false
}

// Check if user is admin (either hardcoded admin or has admin role)
export function isAdmin(user: Profile | null): boolean {
  if (!user) return false
  return user.email === ADMIN_EMAIL || user.role === 'admin'
}

// Check if user is the hardcoded admin
export function isHardcodedAdmin(email: string): boolean {
  return email === ADMIN_EMAIL
}

// Enhanced getCurrentUser with better error handling and logging
export async function getCurrentUserWithAuth(): Promise<Profile | null> {
  try {
    console.log('Getting current user with auth...')
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Auth error:', error)
      return null
    }
    
    if (!user) {
      console.log('No authenticated user found')
      return null
    }

    console.log('Authenticated user found:', user.email)

    // Check if this is the hardcoded admin user
    const isHardcodedAdminUser = user.email === ADMIN_EMAIL

    // Get user data from Supabase Auth metadata
    const profile: Profile = {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || user.email || '',
      role: isHardcodedAdminUser ? 'admin' : (user.user_metadata?.role as 'student' | 'instructor' | 'admin') || 'student',
      student_id: user.user_metadata?.student_id || null,
      created_at: new Date(user.created_at),
      updated_at: new Date()
    }

    console.log('User profile:', { email: profile.email, role: profile.role })
    return profile
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}