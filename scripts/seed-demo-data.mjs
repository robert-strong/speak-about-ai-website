/**
 * Seed demo account and sample data
 * Run: node scripts/seed-demo-data.mjs
 *
 * Creates a demo team member and populates sample projects, deals, and invoices.
 */

import { createHash, randomBytes, pbkdf2Sync } from 'crypto'
import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

async function seed() {
  console.log('Starting demo data seed...\n')

  // 1. Run the migration first
  console.log('1. Running migration (add is_demo columns)...')
  try {
    await sql`ALTER TABLE team_members ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE`
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE`
    await sql`ALTER TABLE deals ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE`
    await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE`
    await sql`ALTER TABLE contracts ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE`
    await sql`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE`
    await sql`ALTER TABLE email_threads ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE`
    console.log('   Migration complete.\n')
  } catch (e) {
    console.log('   Migration columns may already exist:', e.message, '\n')
  }

  // 2. Create or update demo team member
  console.log('2. Creating demo user...')
  const demoPassword = 'DemoAccount2026!'
  const demoHash = hashPassword(demoPassword)

  // Get the Admin Team role (full permissions)
  const roles = await sql`SELECT id FROM roles WHERE name = 'Admin Team' LIMIT 1`
  const roleId = roles.length > 0 ? roles[0].id : 1

  const existing = await sql`SELECT id FROM team_members WHERE email = 'demo@speakabout.ai'`
  if (existing.length > 0) {
    await sql`
      UPDATE team_members SET
        password_hash = ${demoHash},
        is_demo = true,
        status = 'active',
        must_change_password = false,
        role_id = ${roleId}
      WHERE email = 'demo@speakabout.ai'
    `
    console.log('   Updated existing demo user.\n')
  } else {
    await sql`
      INSERT INTO team_members (name, email, password_hash, role_id, status, must_change_password, is_demo, created_by)
      VALUES ('Demo User', 'demo@speakabout.ai', ${demoHash}, ${roleId}, 'active', false, true, 'seed-script')
    `
    console.log('   Created demo user.\n')
  }

  // 3. Clean up old demo data
  console.log('3. Cleaning up old demo data...')
  await sql`DELETE FROM invoices WHERE is_demo = true`
  await sql`DELETE FROM contracts WHERE is_demo = true`
  await sql`DELETE FROM projects WHERE is_demo = true`
  await sql`DELETE FROM deals WHERE is_demo = true`
  await sql`DELETE FROM contacts WHERE is_demo = true`
  console.log('   Cleaned.\n')

  // 4. Seed demo deals
  console.log('4. Seeding demo deals...')
  const deals = [
    {
      client_name: 'Sarah Chen', client_email: 'sarah.chen@acmecorp.com', client_phone: '(415) 555-1234',
      company: 'Acme Corporation', event_title: 'AI Leadership Summit 2026', event_date: '2026-06-15',
      event_location: 'San Francisco, CA', event_type: 'keynote',
      speaker_requested: 'Dr. Maya Patel', attendee_count: 500, budget_range: '$15,000 - $25,000',
      deal_value: 20000, status: 'qualified', priority: 'high', source: 'website_form',
      notes: 'Client wants a keynote on AI transformation in enterprise. Very engaged, quick responses.',
      last_contact: '2026-04-10'
    },
    {
      client_name: 'James Rodriguez', client_email: 'jrodriguez@techvision.io', client_phone: '(212) 555-5678',
      company: 'TechVision Inc', event_title: 'Future of Work Conference', event_date: '2026-07-22',
      event_location: 'New York, NY', event_type: 'workshop',
      speaker_requested: 'Alex Thompson', attendee_count: 200, budget_range: '$10,000 - $15,000',
      deal_value: 12000, status: 'proposal', priority: 'medium', source: 'referral',
      notes: 'Referred by existing client. Wants a half-day workshop on agentic AI.',
      last_contact: '2026-04-08'
    },
    {
      client_name: 'Emily Watson', client_email: 'ewatson@globalhealth.org', client_phone: '(617) 555-9012',
      company: 'Global Health Partners', event_title: 'Healthcare Innovation Forum', event_date: '2026-08-10',
      event_location: 'Boston, MA', event_type: 'panel_discussion',
      speaker_requested: null, attendee_count: 800, budget_range: '$25,000 - $40,000',
      deal_value: 35000, status: 'negotiation', priority: 'urgent', source: 'inbound_email',
      notes: 'Large healthcare org. Needs 2 speakers for panel on AI in diagnostics. Budget approved.',
      last_contact: '2026-04-12'
    },
    {
      client_name: 'Michael Park', client_email: 'mpark@startupweek.co', client_phone: '(512) 555-3456',
      company: 'Austin Startup Week', event_title: 'Startup Week Keynote', event_date: '2026-05-20',
      event_location: 'Austin, TX', event_type: 'keynote',
      speaker_requested: 'Dr. Maya Patel', attendee_count: 1200, budget_range: '$5,000 - $10,000',
      deal_value: 8000, status: 'lost', priority: 'low', source: 'conference',
      notes: 'Budget too low for requested speaker. Offered alternatives, client went with local speaker.',
      last_contact: '2026-03-25'
    },
  ]

  const dealIds = []
  for (const d of deals) {
    const [deal] = await sql`
      INSERT INTO deals (
        client_name, client_email, client_phone, company,
        event_title, event_date, event_location, event_type,
        speaker_requested, attendee_count, budget_range, deal_value,
        status, priority, source, notes, last_contact, is_demo
      ) VALUES (
        ${d.client_name}, ${d.client_email}, ${d.client_phone}, ${d.company},
        ${d.event_title}, ${d.event_date}, ${d.event_location}, ${d.event_type},
        ${d.speaker_requested}, ${d.attendee_count}, ${d.budget_range}, ${d.deal_value},
        ${d.status}, ${d.priority}, ${d.source}, ${d.notes}, ${d.last_contact}, true
      ) RETURNING id
    `
    dealIds.push(deal.id)
    console.log(`   Deal: ${d.event_title} (ID: ${deal.id})`)
  }
  console.log('')

  // 5. Seed demo projects (from won deals)
  console.log('5. Seeding demo projects...')
  const projects = [
    {
      project_name: 'Acme Corp / AI Leadership Summit',
      client_name: 'Sarah Chen', client_email: 'sarah.chen@acmecorp.com', client_phone: '(415) 555-1234',
      company: 'Acme Corporation', project_type: 'keynote', status: '1to2_months',
      priority: 'high', event_name: 'AI Leadership Summit 2026', event_date: '2026-06-15',
      event_location: 'Moscone Center, San Francisco, CA', event_type: 'travel',
      attendee_count: 500, speaker_fee: 15000, commission_percentage: 25,
      commission_amount: 5000, budget: 20000,
      requested_speaker_name: 'Dr. Maya Patel',
      notes: 'Speaker confirmed. Need to send contract and coordinate travel from NYC.',
      deal_idx: 0
    },
    {
      project_name: 'TechVision / Future of Work Workshop',
      client_name: 'James Rodriguez', client_email: 'jrodriguez@techvision.io', client_phone: '(212) 555-5678',
      company: 'TechVision Inc', project_type: 'workshop', status: '2plus_months',
      priority: 'medium', event_name: 'Future of Work Conference', event_date: '2026-07-22',
      event_location: 'The Javits Center, New York, NY', event_type: 'local',
      attendee_count: 200, speaker_fee: 9000, commission_percentage: 25,
      commission_amount: 3000, budget: 12000,
      requested_speaker_name: 'Alex Thompson',
      notes: 'Waiting on client to confirm workshop format and duration.',
      deal_idx: 1
    },
    {
      project_name: 'Global Health / Innovation Forum Panel',
      client_name: 'Emily Watson', client_email: 'ewatson@globalhealth.org', client_phone: '(617) 555-9012',
      company: 'Global Health Partners', project_type: 'panel_discussion', status: 'invoicing',
      priority: 'urgent', event_name: 'Healthcare Innovation Forum', event_date: '2026-08-10',
      event_location: 'Boston Convention Center, Boston, MA', event_type: 'travel',
      attendee_count: 800, speaker_fee: 26250, commission_percentage: 25,
      commission_amount: 8750, budget: 35000,
      requested_speaker_name: 'Dr. Maya Patel & Alex Thompson',
      notes: 'Two speakers booked. Contracts signed. Deposit invoice sent.',
      deal_idx: 2
    },
    {
      project_name: 'Meridian Financial / Q3 Leadership Offsite',
      client_name: 'Lisa Chang', client_email: 'lchang@meridianfin.com', client_phone: '(303) 555-7890',
      company: 'Meridian Financial Group', project_type: 'keynote', status: 'final_week',
      priority: 'high', event_name: 'Q3 Leadership Offsite', event_date: '2026-05-02',
      event_location: 'The Broadmoor, Colorado Springs, CO', event_type: 'travel',
      attendee_count: 150, speaker_fee: 18000, commission_percentage: 20,
      commission_amount: 4500, budget: 22500,
      requested_speaker_name: 'Chris Duffey',
      notes: 'All logistics confirmed. Speaker flying in May 1st. Limo pickup arranged.',
      deal_idx: null
    },
    {
      project_name: 'Nexus Media / Annual Gala Keynote',
      client_name: 'David Kim', client_email: 'dkim@nexusmedia.com', client_phone: '(310) 555-2345',
      company: 'Nexus Media Group', project_type: 'keynote', status: 'completed',
      priority: 'medium', event_name: 'Nexus Annual Gala', event_date: '2026-03-15',
      event_location: 'The Beverly Hilton, Beverly Hills, CA', event_type: 'local',
      attendee_count: 600, speaker_fee: 12000, commission_percentage: 20,
      commission_amount: 3000, budget: 15000,
      requested_speaker_name: 'Alex Thompson',
      notes: 'Event completed successfully. Great feedback from client. Repeat booking likely.',
      deal_idx: null
    },
    {
      project_name: 'Summit Education / Teacher AI Training',
      client_name: 'Rebecca Torres', client_email: 'rtorres@summitedu.org', client_phone: '(480) 555-6789',
      company: 'Summit Education Foundation', project_type: 'workshop', status: '2plus_months',
      priority: 'low', event_name: 'Educators AI Workshop Series', event_date: '2026-09-05',
      event_location: 'Virtual', event_type: 'virtual',
      attendee_count: 300, speaker_fee: 5000, commission_percentage: 20,
      commission_amount: 1250, budget: 6250,
      requested_speaker_name: null,
      notes: 'Non-profit looking for discounted rates. Exploring speaker options.',
      deal_idx: null
    },
  ]

  const projectIds = []
  for (const p of projects) {
    const dealId = p.deal_idx !== null ? dealIds[p.deal_idx] : null
    const [project] = await sql`
      INSERT INTO projects (
        project_name, client_name, client_email, client_phone, company,
        project_type, status, priority, start_date, event_name, event_date,
        event_location, event_type, attendee_count, speaker_fee,
        commission_percentage, commission_amount, budget, spent,
        completion_percentage, requested_speaker_name, notes, deal_id, is_demo,
        stage_completion
      ) VALUES (
        ${p.project_name}, ${p.client_name}, ${p.client_email}, ${p.client_phone}, ${p.company},
        ${p.project_type}, ${p.status}, ${p.priority}, ${p.event_date}, ${p.event_name}, ${p.event_date},
        ${p.event_location}, ${p.event_type}, ${p.attendee_count}, ${p.speaker_fee},
        ${p.commission_percentage}, ${p.commission_amount}, ${p.budget}, 0,
        0, ${p.requested_speaker_name}, ${p.notes}, ${dealId}, true,
        ${JSON.stringify({})}
      ) RETURNING id
    `
    projectIds.push(project.id)
    console.log(`   Project: ${p.project_name} (ID: ${project.id}) [${p.status}]`)
  }
  console.log('')

  // 6. Seed demo invoices
  console.log('6. Seeding demo invoices...')
  const invoices = [
    {
      project_idx: 2, // Global Health
      invoice_number: 'DEMO-INV-001',
      invoice_type: 'deposit',
      client_name: 'Emily Watson', client_email: 'ewatson@globalhealth.org', client_company: 'Global Health Partners',
      amount: 17500, status: 'sent',
      description: 'Deposit - Healthcare Innovation Forum (50%)',
      due_date: '2026-05-10'
    },
    {
      project_idx: 2, // Global Health
      invoice_number: 'DEMO-INV-002',
      invoice_type: 'final',
      client_name: 'Emily Watson', client_email: 'ewatson@globalhealth.org', client_company: 'Global Health Partners',
      amount: 17500, status: 'draft',
      description: 'Final Payment - Healthcare Innovation Forum (50%)',
      due_date: '2026-08-10'
    },
    {
      project_idx: 3, // Meridian Financial
      invoice_number: 'DEMO-INV-003',
      invoice_type: 'deposit',
      client_name: 'Lisa Chang', client_email: 'lchang@meridianfin.com', client_company: 'Meridian Financial Group',
      amount: 11250, status: 'paid',
      description: 'Deposit - Q3 Leadership Offsite (50%)',
      due_date: '2026-04-15'
    },
    {
      project_idx: 3, // Meridian Financial
      invoice_number: 'DEMO-INV-004',
      invoice_type: 'final',
      client_name: 'Lisa Chang', client_email: 'lchang@meridianfin.com', client_company: 'Meridian Financial Group',
      amount: 11250, status: 'sent',
      description: 'Final Payment - Q3 Leadership Offsite (50%)',
      due_date: '2026-05-02'
    },
    {
      project_idx: 4, // Nexus Media (completed)
      invoice_number: 'DEMO-INV-005',
      invoice_type: 'standard',
      client_name: 'David Kim', client_email: 'dkim@nexusmedia.com', client_company: 'Nexus Media Group',
      amount: 15000, status: 'paid',
      description: 'Full Payment - Nexus Annual Gala Keynote',
      due_date: '2026-03-01'
    },
  ]

  for (const inv of invoices) {
    await sql`
      INSERT INTO invoices (
        project_id, invoice_number, invoice_type, client_name, client_email,
        client_company, amount, status, issue_date, due_date, description, is_demo
      ) VALUES (
        ${projectIds[inv.project_idx]}, ${inv.invoice_number}, ${inv.invoice_type},
        ${inv.client_name}, ${inv.client_email}, ${inv.client_company},
        ${inv.amount}, ${inv.status},
        ${new Date().toISOString().split('T')[0]}, ${inv.due_date},
        ${inv.description}, true
      )
    `
    console.log(`   Invoice: ${inv.invoice_number} - $${inv.amount.toLocaleString()} [${inv.status}]`)
  }
  console.log('')

  // 7. Seed demo contacts
  console.log('7. Seeding demo contacts...')
  const contacts = [
    { first_name: 'Sarah', last_name: 'Chen', email: 'sarah.chen@acmecorp.com', phone: '(415) 555-1234', company: 'Acme Corporation', job_title: 'VP of Events', type: 'external' },
    { first_name: 'James', last_name: 'Rodriguez', email: 'jrodriguez@techvision.io', phone: '(212) 555-5678', company: 'TechVision Inc', job_title: 'Head of L&D', type: 'external' },
    { first_name: 'Emily', last_name: 'Watson', email: 'ewatson@globalhealth.org', phone: '(617) 555-9012', company: 'Global Health Partners', job_title: 'Director of Programs', type: 'external' },
    { first_name: 'Lisa', last_name: 'Chang', email: 'lchang@meridianfin.com', phone: '(303) 555-7890', company: 'Meridian Financial Group', job_title: 'Chief of Staff', type: 'external' },
    { first_name: 'Dr. Maya', last_name: 'Patel', email: 'maya@mayapatel.com', phone: '(650) 555-4567', company: 'Self', job_title: 'AI Researcher & Keynote Speaker', type: 'internal' },
    { first_name: 'Alex', last_name: 'Thompson', email: 'alex@alexthompson.ai', phone: '(206) 555-8901', company: 'Self', job_title: 'Futurist & Workshop Facilitator', type: 'internal' },
  ]

  for (const c of contacts) {
    await sql`
      INSERT INTO contacts (first_name, last_name, email, phone, company, job_title, type, is_active, is_demo)
      VALUES (${c.first_name}, ${c.last_name}, ${c.email}, ${c.phone}, ${c.company}, ${c.job_title}, ${c.type}, true, true)
    `
    console.log(`   Contact: ${c.first_name} ${c.last_name} (${c.company})`)
  }

  console.log('\n=== Demo seed complete ===')
  console.log(`\nDemo login credentials:`)
  console.log(`  Email:    demo@speakabout.ai`)
  console.log(`  Password: ${demoPassword}`)
  console.log(`\nData seeded:`)
  console.log(`  ${deals.length} deals`)
  console.log(`  ${projects.length} projects`)
  console.log(`  ${invoices.length} invoices`)
  console.log(`  ${contacts.length} contacts`)
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
