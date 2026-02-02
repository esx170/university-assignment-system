import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    return NextResponse.json({
      environment: {
        hasSupabaseUrl: !!supabaseUrl,
        supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'missing',
        hasServiceKey: !!supabaseServiceKey,
        serviceKeyLength: supabaseServiceKey ? supabaseServiceKey.length : 0,
        nodeEnv: process.env.NODE_ENV
      }
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Debug error',
      details: error.message
    }, { status: 500 })
  }
}