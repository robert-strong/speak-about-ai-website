import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

console.log('=== Backfilling contract_data for all contracts ===\n');

// Get all contracts with their linked deals
const contracts = await sql`
  SELECT c.*,
    d.client_phone as deal_client_phone,
    d.phone as deal_phone,
    d.company as deal_company,
    d.attendee_count as deal_attendee_count,
    d.speaker_requested as deal_speaker_requested,
    d.event_location as deal_event_location,
    d.event_type as deal_event_type,
    d.travel_required as deal_travel_required,
    d.travel_stipend as deal_travel_stipend,
    d.deal_value as deal_value
  FROM contracts c
  LEFT JOIN deals d ON c.deal_id = d.id
  ORDER BY c.id
`;

console.log(`Found ${contracts.length} contracts to process\n`);

let updated = 0;
let skipped = 0;

for (const contract of contracts) {
  // Skip if contract_data already has meaningful form field data
  const existing = contract.contract_data;
  if (existing && typeof existing === 'object' && !existing.tokens && Object.keys(existing).length > 3) {
    console.log(`Contract ${contract.id} - already has contract_data with ${Object.keys(existing).length} keys, skipping`);
    skipped++;
    continue;
  }

  // Build contract_data from columns + deal
  const data = {};

  // Basic info
  if (contract.client_company) data.client_company = contract.client_company;
  if (contract.client_name) data.client_contact_name = contract.client_name;
  if (contract.client_email) data.client_email = contract.client_email;
  if (contract.generated_at || contract.created_at) {
    const d = contract.generated_at || contract.created_at;
    data.agreement_date = typeof d === 'string' ? d.split('T')[0] : new Date(d).toISOString().split('T')[0];
  }

  // Speaker info
  if (contract.speaker_name) data.speaker_name = contract.speaker_name;
  if (contract.speaker_email) data.speaker_email = contract.speaker_email;

  // Event info
  if (contract.event_title) data.event_title = contract.event_title;
  if (contract.event_date) {
    const d = contract.event_date;
    data.event_date = typeof d === 'string' ? d.split('T')[0] : new Date(d).toISOString().split('T')[0];
  }
  if (contract.event_location) data.event_location = contract.event_location;
  if (contract.event_type) data.event_type = contract.event_type;

  // Financial
  if (contract.speaker_fee || contract.fee_amount) {
    data.speaker_fee = contract.speaker_fee || contract.fee_amount;
  }
  if (contract.payment_terms) data.payment_terms = contract.payment_terms;

  // Enrich from linked deal
  if (contract.deal_id) {
    if (!data.client_company && contract.deal_company) data.client_company = contract.deal_company;
    const phone = contract.deal_client_phone || contract.deal_phone;
    if (phone) data.client_phone = phone;
    if (contract.deal_attendee_count) data.attendee_count = contract.deal_attendee_count;
    if (!data.speaker_name && contract.deal_speaker_requested) data.speaker_name = contract.deal_speaker_requested;
    if (!data.event_location && contract.deal_event_location) data.event_location = contract.deal_event_location;
    if (!data.event_type && contract.deal_event_type) data.event_type = contract.deal_event_type;
    if (contract.deal_travel_required) data.travel_arrangements = 'required';
    if (contract.deal_travel_stipend) data.travel_buyout_amount = contract.deal_travel_stipend;
  }

  const fieldCount = Object.keys(data).length;
  if (fieldCount === 0) {
    console.log(`Contract ${contract.id} - no data to backfill, skipping`);
    skipped++;
    continue;
  }

  // Update the contract
  await sql`
    UPDATE contracts
    SET contract_data = ${JSON.stringify(data)}::jsonb,
        updated_at = NOW()
    WHERE id = ${contract.id}
  `;

  console.log(`Contract ${contract.id} - backfilled ${fieldCount} fields (${Object.keys(data).join(', ')})`);
  updated++;
}

console.log(`\n=== Done! Updated: ${updated}, Skipped: ${skipped}, Total: ${contracts.length} ===`);
