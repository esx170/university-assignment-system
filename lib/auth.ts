import { supabase } from './supabase'
import { Database } from './database.types'

export type UserRole = 'student' | 'instructor' | 'admin'
export type Profile = Database['public']['Tables']['profiles']['Row']

export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return profile
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function signUp(email: string, password: string, userData: {
  full_name: string
  role: UserRole
  student_id?: string
}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData
    }
  })

  if (error) throw error
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export function hasRole(profile: Profile | null, allowedRoles: UserRole[]): boolean {
  return profile ? allowedRoles.includes(profile.role) : false
}