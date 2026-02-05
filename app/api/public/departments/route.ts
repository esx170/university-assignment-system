import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET - List all departments (public endpoint)
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Server configuration error'
      }, { status: 500 })
    }

    // Use service role key for public department access (bypassing RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get all departments (with debug logging) - bypassing any RLS policies
    console.log('Public departments API: Fetching departments with service role...')
    
    // First, let's check the total count
    const { count, error: countError } = await supabaseAdmin
      .from('departments')
      .select('*', { count: 'exact', head: true })
    
    console.log('Public departments API: Total count in database:', count)
    
    const { data: departments, error } = await supabaseAdmin
      .from('departments')
      .select('id, name, code, description')
      .order('name')

    console.log('Public departments API: Query result:', { 
      count: departments?.length || 0, 
      error: error?.message || 'none',
      departments: departments?.map(d => ({ code: d.code, name: d.name })) || []
    })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch departments',
        details: error.message
      }, { status: 500 })
    }

    console.log('Public departments API: Returning departments:', departments?.map(d => d.code) || [])
    return NextResponse.json(departments || [])
  } catch (error: any) {
    console.error('Public departments API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}