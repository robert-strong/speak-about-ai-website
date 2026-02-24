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
  // Start with existing contract_data or empty object
  const existing = contract.contract_data && typeof contract.contract_data === 'object'
    ? { ...contract.contract_data }
    : {};

  // Build contract_data from columns + deal
  const data = { ...existing };

  // Basic info
  if (contract.client_company && !data.client_company) data.client_company = contract.client_company;
  if (contract.client_name && !data.client_contact_name) data.client_contact_name = contract.client_name;
  if (contract.client_email && !data.client_email) data.client_email = contract.client_email;
  if (!data.agreement_date && (contract.generated_at || contract.created_at)) {
    const d = contract.generated_at || contract.created_at;
    data.agreement_date = typeof d === 'string' ? d.split('T')[0] : new Date(d).toISOString().split('T')[0];
  }

  // Speaker info
  if (contract.speaker_name && !data.speaker_name) data.speaker_name = contract.speaker_name;
  if (contract.speaker_email && !data.speaker_email) data.speaker_email = contract.speaker_email;

  // Event info
  if (contract.event_title && !data.event_title) data.event_title = contract.event_title;
  if (contract.event_date && !data.event_date) {
    const d = contract.event_date;
    data.event_date = typeof d === 'string' ? d.split('T')[0] : new Date(d).toISOString().split('T')[0];
  }
  if (contract.event_location && !data.event_location) data.event_location = contract.event_location;
  if (contract.event_type && !data.event_type) data.event_type = contract.event_type;

  // Financial - always set deal_value from fee_amount or deal
  if (!data.deal_value) {
    if (contract.deal_value) {
      data.deal_value = contract.deal_value;
    } else if (contract.fee_amount) {
      data.deal_value = contract.fee_amount;
    }
  }
  if (contract.speaker_fee && !data.speaker_fee) data.speaker_fee = contract.speaker_fee;
  if (!data.speaker_fee && contract.fee_amount) data.speaker_fee = contract.fee_amount;
  if (contract.payment_terms && !data.payment_terms) data.payment_terms = contract.payment_terms;

  // Enrich from linked deal
  if (contract.deal_id) {
    // Deal value always from deal if available
    if (contract.deal_value) data.deal_value = contract.deal_value;
    if (!data.client_company && contract.deal_company) data.client_company = contract.deal_company;
    const phone = contract.deal_client_phone || contract.deal_phone;
    if (phone && !data.client_phone) data.client_phone = phone;
    if (contract.deal_attendee_count && !data.attendee_count) data.attendee_count = contract.deal_attendee_count;
    if (!data.speaker_name && contract.deal_speaker_requested) data.speaker_name = contract.deal_speaker_requested;
    if (!data.event_location && contract.deal_event_location) data.event_location = contract.deal_event_location;
    if (!data.event_type && contract.deal_event_type) data.event_type = contract.deal_event_type;
    if (contract.deal_travel_required && !data.travel_arrangements) data.travel_arrangements = 'required';
    if (contract.deal_travel_stipend && !data.travel_buyout_amount) data.travel_buyout_amount = contract.deal_travel_stipend;
  }

  const fieldCount = Object.keys(data).length;
  const existingCount = Object.keys(existing).length;
  if (fieldCount === existingCount && JSON.stringify(data) === JSON.stringify(existing)) {
    console.log(`Contract ${contract.id} - no changes needed (${fieldCount} fields)`);
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

  const newFields = Object.keys(data).filter(k => !existing[k]);
  console.log(`Contract ${contract.id} - updated to ${fieldCount} fields${newFields.length > 0 ? ` (added: ${newFields.join(', ')})` : ' (values updated)'}`);
  updated++;
}

console.log(`\n=== Done! Updated: ${updated}, Skipped: ${skipped}, Total: ${contracts.length} ===`);
