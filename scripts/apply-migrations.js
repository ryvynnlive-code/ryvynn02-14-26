#!/usr/bin/env node
/**
 * Apply RYVYNN OMEGA Migrations to Supabase
 * Automatically applies database migrations using Supabase credentials
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes('placeholder')) {
  console.error('❌ Error: Missing or invalid Supabase credentials')
  console.error('Please update .env.local with your actual Supabase credentials:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigrations() {
  console.log('🚀 RYVYNN OMEGA - Applying Database Migrations')
  console.log('=' .repeat(50))
  console.log('')

  // Read the combined migration file
  const migrationPath = path.join(__dirname, '..', 'supabase_omega_complete.sql')

  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath)
    process.exit(1)
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

  console.log('📄 Migration file loaded:', migrationPath)
  console.log('📊 SQL size:', (migrationSQL.length / 1024).toFixed(2), 'KB')
  console.log('')

  try {
    console.log('⏳ Executing migration...')

    // Split into individual statements (rough split by CREATE/ALTER)
    const statements = migrationSQL
      .split(/;\s*\n/)
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ';')

    console.log(`📋 Found ${statements.length} SQL statements`)
    console.log('')

    let successCount = 0
    let skipCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i]

      // Skip comments and empty statements
      if (stmt.startsWith('--') || stmt.trim() === ';') {
        skipCount++
        continue
      }

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: stmt })

        if (error) {
          // Check if error is "already exists" (which is OK)
          if (error.message.includes('already exists')) {
            console.log(`⏭️  Statement ${i + 1}/${statements.length}: Already exists (skipping)`)
            skipCount++
          } else {
            console.error(`❌ Statement ${i + 1}/${statements.length} failed:`, error.message)
            errorCount++
          }
        } else {
          console.log(`✅ Statement ${i + 1}/${statements.length}: Success`)
          successCount++
        }
      } catch (err) {
        console.error(`❌ Statement ${i + 1} error:`, err.message)
        errorCount++
      }

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log('')
    console.log('=' .repeat(50))
    console.log('📊 Migration Summary:')
    console.log(`  ✅ Success: ${successCount}`)
    console.log(`  ⏭️  Skipped: ${skipCount}`)
    console.log(`  ❌ Errors: ${errorCount}`)
    console.log('')

    if (errorCount === 0) {
      console.log('🎉 All migrations applied successfully!')
      console.log('')
      console.log('Next steps:')
      console.log('  1. Configure Stripe products')
      console.log('  2. Deploy to Vercel')
      console.log('  3. Set up Stripe webhook')
    } else {
      console.log('⚠️  Some migrations failed. Check errors above.')
      console.log('Note: You may need to run the SQL manually in Supabase Dashboard')
    }

  } catch (error) {
    console.error('❌ Fatal error applying migrations:', error)
    console.error('')
    console.error('Alternative: Apply migrations manually via Supabase Dashboard')
    console.error('  1. Go to Supabase Dashboard → SQL Editor')
    console.error('  2. Copy contents of: supabase_omega_complete.sql')
    console.error('  3. Paste and run')
    process.exit(1)
  }
}

// Run migrations
applyMigrations().catch(console.error)
