import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const repairLog = {
    timestamp: new Date().toISOString(),
    steps: [],
    success: false,
    errors: []
  }

  try {
    const { action } = await request.json()
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      repairLog.errors.push('Missing Supabase configuration')
      return NextResponse.json(repairLog, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    switch (action) {
      case 'fix-departments':
        await fixDepartments(supabaseAdmin, repairLog)
        break
      
      case 'fix-profiles':
        await fixProfiles(supabaseAdmin, repairLog)
        break
      
      case 'test-write':
        await testWriteOperations(supabaseAdmin, repairLog)
        break
      
      case 'fix-permissions':
        await fixPermissions(supabaseAdmin, repairLog)
        break
      
      case 'full-repair':
        await fixDepartments(supabaseAdmin, repairLog)
        await fixProfiles(supabaseAdmin, repairLog)
        await testWriteOperations(supabaseAdmin, repairLog)
        break
      
      default:
        repairLog.errors.push('Unknown repair action')
        return NextResponse.json(repairLog, { status: 400 })
    }

    repairLog.success = repairLog.errors.length === 0
    return NextResponse.json(repairLog)

  } catch (error: any) {
    repairLog.errors.push(`System error: ${error.message}`)
    return NextResponse.json(repairLog, { status: 500 })
  }
}

async function fixDepartments(supabase: any, log: any) {
  log.steps.push('Starting department repair...')
  
  try {
    // Check if departments exist
    const { data: existingDepts, error: checkError } = await supabase
      .from('departments')
      .select('*')
    
    if (checkError) {
      log.errors.push(`Department check failed: ${checkError.message}`)
      return
    }

    log.steps.push(`Found ${existingDepts?.length || 0} existing departments`)

    // If no departments, create them
    if (!existingDepts || existingDepts.length === 0) {
      const defaultDepartments = [
        { name: 'Computer Science', code: 'CS', description: 'Department of Computer Science and Engineering' },
        { name: 'Mathematics', code: 'MATH', description: 'Department of Mathematics' },
        { name: 'Physics', code: 'PHYS', description: 'Department of Physics' },
        { name: 'Business Administration', code: 'BUS', description: 'School of Business Administration' },
        { name: 'Development Economics', code: 'DECON', description: 'Department of Development Economics' },
        { name: 'Software Engineering', code: 'SE', description: 'Department of Software Engineering' }
      ]

      const { data: createdDepts, error: createError } = await supabase
        .from('departments')
        .insert(defaultDepartments)
        .select()

      if (createError) {
        log.errors.push(`Failed to create departments: ${createError.message}`)
      } else {
        log.steps.push(`Created ${createdDepts?.length || 0} departments`)
      }
    }

    // Test department write
    const testDept = {
      name: `Test Department ${Date.now()}`,
      code: `TEST${Date.now()}`,
      description: 'Test department for repair verification'
    }

    const { data: testResult, error: testError } = await supabase
      .from('departments')
      .insert(testDept)
      .select()

    if (testError) {
      log.errors.push(`Department write test failed: ${testError.message}`)
    } else {
      log.steps.push('Department write test successful')
      
      // Clean up test department
      if (testResult && testResult.length > 0) {
        await supabase
          .from('departments')
          .delete()
          .eq('id', testResult[0].id)
        
        log.steps.push('Test department cleaned up')
      }
    }

  } catch (error: any) {
    log.errors.push(`Department repair error: ${error.message}`)
  }
}

async function fixProfiles(supabase: any, log: any) {
  log.steps.push('Starting profile repair...')
  
  try {
    // Get auth users
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      log.errors.push(`Auth users check failed: ${authError.message}`)
      return
    }

    const authUsers = authData?.users || []
    log.steps.push(`Found ${authUsers.length} auth users`)

    // Get existing profiles
    const { data: existingProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')

    if (profileError) {
      log.errors.push(`Profile check failed: ${profileError.message}`)
      return
    }

    const existingIds = new Set(existingProfiles?.map(p => p.id) || [])
    log.steps.push(`Found ${existingProfiles?.length || 0} existing profiles`)

    // Create missing profiles
    const missingUsers = authUsers.filter(user => !existingIds.has(user.id))
    log.steps.push(`Found ${missingUsers.length} users without profiles`)

    if (missingUsers.length > 0) {
      // Get default department
      const { data: defaultDept } = await supabase
        .from('departments')
        .select('id')
        .limit(1)
        .single()

      const profilesToCreate = missingUsers.map(user => ({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email || 'Unknown User',
        role: user.user_metadata?.role || 'student',
        student_id: user.user_metadata?.student_id || null,
        department_id: defaultDept?.id || null,
        created_at: user.created_at,
        updated_at: new Date().toISOString()
      }))

      const { data: createdProfiles, error: createError } = await supabase
        .from('profiles')
        .insert(profilesToCreate)
        .select()

      if (createError) {
        log.errors.push(`Failed to create profiles: ${createError.message}`)
      } else {
        log.steps.push(`Created ${createdProfiles?.length || 0} profiles`)
      }
    }

  } catch (error: any) {
    log.errors.push(`Profile repair error: ${error.message}`)
  }
}

async function testWriteOperations(supabase: any, log: any) {
  log.steps.push('Testing write operations...')
  
  const tables = ['departments', 'profiles', 'courses', 'assignments']
  
  for (const table of tables) {
    try {
      // Test basic select
      const { data: selectData, error: selectError } = await supabase
        .from(table)
        .select('*')
        .limit(1)

      if (selectError) {
        log.errors.push(`${table} select failed: ${selectError.message}`)
        continue
      }

      log.steps.push(`${table} select: OK`)

      // Test write (only for departments to avoid complex constraints)
      if (table === 'departments') {
        const testData = {
          name: `Write Test ${Date.now()}`,
          code: `WT${Date.now()}`,
          description: 'Write test'
        }

        const { data: writeData, error: writeError } = await supabase
          .from(table)
          .insert(testData)
          .select()

        if (writeError) {
          log.errors.push(`${table} write failed: ${writeError.message}`)
        } else {
          log.steps.push(`${table} write: OK`)
          
          // Clean up
          if (writeData && writeData.length > 0) {
            await supabase
              .from(table)
              .delete()
              .eq('id', writeData[0].id)
          }
        }
      }

    } catch (error: any) {
      log.errors.push(`${table} test error: ${error.message}`)
    }
  }
}

async function fixPermissions(supabase: any, log: any) {
  log.steps.push('Checking permissions...')
  
  try {
    // Test admin operations
    const { data: adminTest, error: adminError } = await supabase.auth.admin.listUsers()
    
    if (adminError) {
      log.errors.push(`Admin permissions failed: ${adminError.message}`)
    } else {
      log.steps.push('Admin permissions: OK')
    }

    // Test RLS bypass with service role
    const { data: rlsTest, error: rlsError } = await supabase
      .from('departments')
      .select('*')
      .limit(1)

    if (rlsError) {
      log.errors.push(`RLS bypass failed: ${rlsError.message}`)
    } else {
      log.steps.push('RLS bypass: OK')
    }

  } catch (error: any) {
    log.errors.push(`Permission check error: ${error.message}`)
  }
}