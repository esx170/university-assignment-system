import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    hasSupabaseUrl: !!supabaseUrl,
    supabaseUrlLength: supabaseUrl?.length || 0,
    supabaseUrlPrefix: supabaseUrl?.substring(0, 30) || 'missing',
    hasAnonKey: !!supabaseAnonKey,
    anonKeyLength: supabaseAnonKey?.length || 0,
    hasServiceKey: !!supabaseServiceKey,
    serviceKeyLength: supabaseServiceKey?.length || 0,
    serviceKeyPrefix: supabaseServiceKey?.substring(0, 50) || 'missing',
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
  })
}