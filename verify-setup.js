#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless')

async function verifySetup() {
  console.log('🔍 Verifying Contract Management System Setup...\n')
  
  try {
    // Load environment
    require('dotenv').config({ path: '.env.local' })
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not found in environment')
    }
    
    const sql = neon(process.env.DATABASE_URL)
    
    // Check database connection
    console.log('📡 Testing database connection...')
    await sql`SELECT 1`
    console.log('✅ Database connection successful\n')
    
    // Check contract tables
    console.log('📋 Checking contract tables...')
    const contractTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('contracts', 'contract_signatures', 'contract_versions')
      ORDER BY table_name
    `
    
    contractTables.forEach(table => {
      console.log(`✅ ${table.table_name} table exists`)
    })
    
    if (contractTables.length !== 3) {
      throw new Error(`Expected 3 contract tables, found ${contractTables.length}`)
    }
    console.log('')
    
    // Check for won deals
    console.log('🎯 Checking for won deals...')
    const wonDeals = await sql`
      SELECT id, client_name, event_title, deal_value, status 
      FROM deals 
      WHERE status = 'won' 
      LIMIT 5
    `
    
    if (wonDeals.length === 0) {
      console.log('⚠️  No won deals found - creating test deal...')
      
      // Create a test won deal
      const [testDeal] = await sql`
        INSERT INTO deals (
          client_name, client_email, client_phone, company,
          event_title, event_date, event_location, event_type,
          attendee_count, budget_range, deal_value,
          status, priority, source, notes, last_contact
        ) VALUES (
          'Test Client', 'client@example.com', '555-0123', 'Test Company',
          'AI Innovation Summit 2025', '2025-09-15', 'San Francisco, CA', 'Conference',
          500, '$20,000 - $30,000', 25000,
          'won', 'high', 'website', 'Test deal for contract system', '2025-08-04'
        )
        RETURNING *
      `
      
      console.log(`✅ Created test deal: ${testDeal.event_title} ($${testDeal.deal_value})`)
    } else {
      console.log(`✅ Found ${wonDeals.length} won deals:`)
      wonDeals.forEach(deal => {
        console.log(`   • ${deal.client_name} - ${deal.event_title} ($${deal.deal_value})`)
      })
    }
    console.log('')
    
    // Check admin credentials
    console.log('👤 Checking admin credentials...')
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH) {
      console.log(`✅ Admin email: ${process.env.ADMIN_EMAIL}`)
      console.log('✅ Admin password hash configured')
    } else {
      console.log('⚠️  Admin credentials not found in environment')
    }
    console.log('')
    
    // Summary
    console.log('🎉 SETUP VERIFICATION COMPLETE!')
    console.log('=' .repeat(50))
    console.log('')
    console.log('🚀 Your contract management system is ready!')
    console.log('')
    console.log('📍 Access Points:')
    console.log('   • Development Server: http://localhost:3000')
    console.log('   • Admin Login: http://localhost:3000/admin')
    console.log('   • CRM Dashboard: http://localhost:3000/admin/dashboard')  
    console.log('   • Contract Management: http://localhost:3000/admin/contracts')
    console.log('')
    console.log('🔑 Login Credentials:')
    console.log(`   • Email: ${process.env.ADMIN_EMAIL || 'human@speakabout.ai'}`)
    console.log('   • Password: [Your configured password]')
    console.log('')
    console.log('📋 Testing Steps:')
    console.log('   1. Login to the admin panel')
    console.log('   2. Go to Contract Management')
    console.log('   3. Create a contract from a won deal')
    console.log('   4. Test the signing workflow')
    console.log('')
    console.log('💡 Pro Tips:')
    console.log('   • Signing links work without email configuration')
    console.log('   • Use different browser tabs/incognito for testing signatures')
    console.log('   • Check the browser console for any errors')
    
  } catch (error) {
    console.error('❌ Setup verification failed:')
    console.error(error.message)
    console.log('')
    console.log('🔧 Troubleshooting:')
    console.log('   1. Ensure npm run dev is running')
    console.log('   2. Check .env.local contains DATABASE_URL')
    console.log('   3. Verify database connectivity')
    process.exit(1)
  }
}

verifySetup()