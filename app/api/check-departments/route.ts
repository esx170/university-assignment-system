import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Missing Supabase configuration',
        details: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey
        }
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if departments table exists and get its structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_name', 'departments')
      .eq('table_schema', 'public');

    if (tableError) {
      return NextResponse.json({
        error: 'Error checking table existence',
        details: tableError
      }, { status: 500 });
    }

    // Get column information for departments table
    const { data: columnInfo, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'departments')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    // Try to get sample data from departments table
    const { data: sampleData, error: dataError } = await supabase
      .from('departments')
      .select('*')
      .limit(10);

    // Get count of departments
    const { count, error: countError } = await supabase
      .from('departments')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      tableExists: tableInfo && tableInfo.length > 0,
      tableInfo,
      columnInfo: columnError ? null : columnInfo,
      sampleData: dataError ? null : sampleData,
      departmentCount: countError ? null : count,
      errors: {
        tableError,
        columnError,
        dataError,
        countError
      }
    });

  } catch (error) {
    console.error('Database check error:', error);
    return NextResponse.json({
      error: 'Unexpected error occurred',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}