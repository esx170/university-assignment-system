import { NextRequest, NextResponse } from 'next/server'
import { ensureAdminExists } from '@/lib/auth'

// Initialize the hardcoded admin user
export async function POST(request: NextRequest) {
  try {
    await ensureAdminExists()
    
    return NextResponse.json({
      success: true,
      message: 'System administrator initialized',
      credentials: {
        email: 'admin@university.edu',
        password: 'Admin123!@#'
      }
    })
  } catch (error: any) {
    console.error('Init admin error:', error)
    return NextResponse.json({ 
      error: 'Failed to initialize admin',
      details: error.message
    }, { status: 500 })
  }
}