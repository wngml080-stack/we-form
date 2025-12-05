import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  console.log('🚀 Starting database migration...\n')

  try {
    // Read the SQL file
    const sqlPath = join(process.cwd(), 'weform-schema.sql')
    const sql = readFileSync(sqlPath, 'utf-8')

    console.log('📄 SQL file loaded successfully')
    console.log(`📏 SQL length: ${sql.length} characters\n`)

    // Execute the SQL
    console.log('⏳ Executing SQL migration...')
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      console.error('❌ Migration failed:', error)

      // Try alternative method: split and execute statements
      console.log('\n🔄 Trying alternative method: executing via postgres connection...\n')

      const { createPool } = await import('@neondatabase/serverless')
      const pool = createPool({
        connectionString: constructConnectionString()
      })

      const client = await pool.connect()
      try {
        await client.query(sql)
        console.log('✅ Migration completed successfully!')
      } catch (err) {
        console.error('❌ Alternative method also failed:', err)
        throw err
      } finally {
        client.release()
      }
    } else {
      console.log('✅ Migration completed successfully!')
      if (data) {
        console.log('📊 Result:', data)
      }
    }

    // Verify tables were created
    console.log('\n🔍 Verifying created tables...')
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'members',
        'member_memberships',
        'member_payments',
        'attendance_statuses',
        'attendances',
        'salary_settings',
        'sales_logs',
        'system_logs'
      ])

    if (tablesError) {
      console.warn('⚠️  Could not verify tables:', tablesError.message)
    } else {
      console.log('✅ Tables verified:')
      tables?.forEach((t: any) => console.log(`   - ${t.table_name}`))
    }

  } catch (error) {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  }
}

function constructConnectionString(): string {
  const url = new URL(supabaseUrl)
  const project = url.hostname.split('.')[0]
  return `postgresql://postgres.${project}:${supabaseServiceKey}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`
}

runMigration()
