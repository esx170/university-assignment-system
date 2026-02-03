import { NextResponse } from 'next/server'
import { getCurrentUser, getCurrentUserWithAuth, isAdmin } from '@/lib/auth'

export async function GET() {
  try {
    console.log('=== DEBUG AUTH API ===')
    
    // Test both functions
    const user1 = await getCurrentUser()
    const user2 = await getCurrentUserWithAuth()
    
    console.log('getCurrentUser result:', user1)
    console.log('getCurrentUserWithAuth result:', user2)
    
    const isAdminResult = isAdmin(user1)
    console.log('isAdmin result:', isAdminResult)
    
    return NextResponse.json({
      getCurrentUser: user1,
      getCurrentUserWithAuth: user2,
      isAdmin: isAdminResult,
      adminEmail: 'admin@university.edu',
      emailMatch: user1?.email === 'admin@university.edu'
    })
  } catch (error: any) {
    console.error('Debug auth error:', error)
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}