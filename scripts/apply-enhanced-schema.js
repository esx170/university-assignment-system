const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = "https://jcbnprvpceywmkfdcyyy.supabase.co"
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjYm5wcnZwY2V5d21rZmRjeXl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NzE1NSwiZXhwIjoyMDg1NDQzMTU1fQ.TKrUWCf6dwgbiKXeAPIWn-VkE6XEQtP1qxj2kpt15Ck"

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyEnhancedSchema() {
  try {
    console.log('Reading enhanced schema file...')
    const schemaPath = path.join(__dirname, '..', 'supabase', 'enhanced-schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')

    console.log('Applying enhanced schema to database...')
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`Found ${statements.length} SQL statements to execute`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      
      // Skip comments and empty statements
      if (statement.trim().startsWith('--') || statement.trim() === ';') {
        continue
      }

      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`)
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          console.error(`Error in statement ${i + 1}:`, error)
          // Continue with other statements
        } else {
          console.log(`✓ Statement ${i + 1} executed successfully`)
        }
      } catch (err) {
        console.error(`Error executing statement ${i + 1}:`, err)
        // Continue with other statements
      }
    }

    console.log('Enhanced schema application completed!')
    
    // Verify some key tables exist
    console.log('Verifying enhanced tables...')
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'instructor_department_assignments',
        'instructor_course_assignments',
        'course_enrollments'
      ])

    if (tablesError) {
      console.error('Error verifying tables:', tablesError)
    } else {
      console.log('Enhanced tables found:', tables.map(t => t.table_name))
    }

  } catch (error) {
    console.error('Error applying enhanced schema:', error)
    process.exit(1)
  }
}

applyEnhancedSchema()