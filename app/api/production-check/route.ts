import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const deploymentInfo = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    vercelUrl: process.env.VERCEL_URL,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30),
    buildTime: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    version: '2.0.0-rbac-complete',
    features: [
      'RBAC System',
      'Admin Dashboard', 
      'Role Management',
      'Protected Routes',
      'Student-only Registration',
      'Hardcoded Admin User'
    ]
  }

  return NextResponse.json(deploymentInfo)
}