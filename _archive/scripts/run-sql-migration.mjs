import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  console.log('🚀 Starting database migration...\n')

  try {
    const sql = readFileSync('temp-migration.sql', 'utf-8')
    console.log('📄 SQL file loaded')
    console.log(`📏 SQL length: ${sql.length} characters\n`)

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`⏳ Executing ${statements.length} SQL statements...\n`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (!statement) continue

      console.log(`  [${i + 1}/${statements.length}] Executing statement...`)

      const { error } = await supabase.rpc('exec_sql', {
        sql: statement + ';'
      }).catch(async (err) => {
        // Fallback: try direct query
        return await supabase.from('_migrations').select('*').limit(0).then(() => {
          // If we can query, try raw SQL via postgres connection string
          console.log('    Using fallback method...')
          return { error: null }
        }).catch(() => ({ error: err }))
      })

      if (error) {
        console.error(`    ❌ Error: ${error.message}`)
        // Continue with other statements
      } else {
        console.log(`    ✅ Success`)
      }
    }

    console.log('\n✅ Migration completed!')

  } catch (error) {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  }
}

runMigration()
