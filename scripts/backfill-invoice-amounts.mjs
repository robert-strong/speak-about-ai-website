import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

console.log('=== Backfilling invoice amounts to use deal value ===\n');

// Get all invoices with their project and deal data
const invoices = await sql`
  SELECT i.*,
    p.speaker_fee as project_speaker_fee,
    p.budget as project_budget,
    d.deal_value
  FROM invoices i
  LEFT JOIN projects p ON i.project_id = p.id
  LEFT JOIN deals d ON p.deal_id = d.id
  ORDER BY i.id
`;

console.log(`Found ${invoices.length} invoices to check\n`);

let updated = 0;
let skipped = 0;

for (const invoice of invoices) {
  const dealValue = parseFloat(invoice.deal_value || invoice.project_budget || '0');
  const currentAmount = parseFloat(invoice.amount);

  if (!dealValue) {
    console.log(`Invoice ${invoice.id} ${invoice.invoice_number} - no deal value available, skipping`);
    skipped++;
    continue;
  }

  // Calculate what the amount should be based on invoice type
  let expectedAmount;
  if (invoice.invoice_type === 'deposit' || invoice.invoice_type === 'final') {
    expectedAmount = dealValue / 2;
  } else if (invoice.invoice_type === 'standard') {
    expectedAmount = dealValue;
  } else {
    console.log(`Invoice ${invoice.id} ${invoice.invoice_number} - unknown type: ${invoice.invoice_type}, skipping`);
    skipped++;
    continue;
  }

  // Check if already correct
  if (Math.abs(currentAmount - expectedAmount) < 0.01) {
    console.log(`Invoice ${invoice.id} ${invoice.invoice_number} - already correct: $${currentAmount}`);
    skipped++;
    continue;
  }

  // Update the amount
  await sql`
    UPDATE invoices
    SET amount = ${expectedAmount},
        updated_at = NOW()
    WHERE id = ${invoice.id}
  `;

  console.log(`Invoice ${invoice.id} ${invoice.invoice_number} (${invoice.invoice_type}) - updated: $${currentAmount} → $${expectedAmount} (deal_value: $${dealValue})`);
  updated++;
}

console.log(`\n=== Done! Updated: ${updated}, Skipped: ${skipped}, Total: ${invoices.length} ===`);
