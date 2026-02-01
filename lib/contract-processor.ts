import mammoth from 'mammoth'

export interface ContractData {
  // Parties
  agent_name: string
  speaker_name: string
  client_company: string
  
  // Event Details
  event_reference: string
  event_name: string
  event_date: string
  event_time_start: string
  event_time_end: string
  event_location: string
  
  // Financial
  speaker_fee: string
  travel_stipend?: string
  accommodation_details?: string
  
  // Deliverables
  keynote_duration: string
  keynote_topic: string
  qa_duration?: string
  
  // Schedule
  arrival_time: string
  tech_check_time?: string
  keynote_time: string
  departure_time: string
  
  // Additional
  virtual_meetings?: string
  additional_requirements?: string
  
  // Signatures
  agent_signer_name: string
  agent_signer_title: string
  speaker_signer_name: string
  client_signer_name: string
  client_signer_title: string
  
  // Dates
  agreement_date: string
  payment_due_date?: string
  cancellation_deadline?: string
  
  [key: string]: string | undefined
}

/**
 * Process a Word document template and replace placeholders with actual values
 */
export async function processWordTemplate(
  fileBuffer: ArrayBuffer,
  data: Partial<ContractData>
): Promise<string> {
  try {
    // Convert Word document to HTML
    const result = await mammoth.convertToHtml({ arrayBuffer: fileBuffer })
    let html = result.value
    
    // Replace all placeholders in the format {{field_name}}
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const placeholder = new RegExp(`{{${key}}}`, 'g')
        html = html.replace(placeholder, String(value))
      }
    })
    
    // Handle any remaining placeholders (fields not provided)
    html = html.replace(/{{[^}]+}}/g, '[FIELD NOT PROVIDED]')
    
    return html
  } catch (error) {
    console.error('Error processing Word template:', error)
    throw new Error('Failed to process Word template')
  }
}

/**
 * Generate a contract from a template with dynamic data
 */
export function generateContractFromTemplate(
  templateContent: string,
  data: Partial<ContractData>
): string {
  let content = templateContent
  
  // Replace placeholders
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const placeholder = new RegExp(`{{${key}}}`, 'g')
      content = content.replace(placeholder, String(value))
    }
  })
  
  // Format currency values
  if (data.speaker_fee) {
    content = content.replace(
      /\$?{{speaker_fee}}/g,
      formatCurrency(data.speaker_fee)
    )
  }
  if (data.travel_stipend) {
    content = content.replace(
      /\$?{{travel_stipend}}/g,
      formatCurrency(data.travel_stipend)
    )
  }
  
  // Format dates
  if (data.event_date) {
    const formattedDate = formatDate(data.event_date)
    content = content.replace(/{{event_date}}/g, formattedDate)
  }
  if (data.agreement_date) {
    const formattedDate = formatDate(data.agreement_date)
    content = content.replace(/{{agreement_date}}/g, formattedDate)
  }
  
  return content
}

/**
 * Format currency values
 */
function formatCurrency(value: string | number): string {
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(numValue)
}

/**
 * Format dates
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

/**
 * Generate contract HTML with proper styling
 */
export function generateContractHTML(content: string, title?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Contract'}</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
      .page-break { page-break-before: always; }
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Times New Roman', serif;
      line-height: 1.6;
      color: #000;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 1in;
      background: white;
    }
    
    h1, h2, h3 {
      color: #000;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }
    
    h1 {
      font-size: 24px;
      text-align: center;
      margin-bottom: 1em;
    }
    
    h2 {
      font-size: 18px;
      border-bottom: 1px solid #ccc;
      padding-bottom: 0.3em;
    }
    
    h3 {
      font-size: 16px;
      margin-top: 1em;
    }
    
    p {
      margin-bottom: 0.8em;
      text-align: justify;
    }
    
    ul, ol {
      margin-bottom: 1em;
      padding-left: 2em;
    }
    
    li {
      margin-bottom: 0.5em;
    }
    
    .contract-parties {
      background: #f9f9f9;
      padding: 1em;
      border-left: 3px solid #333;
      margin: 1.5em 0;
    }
    
    .signature-section {
      margin-top: 3em;
      page-break-inside: avoid;
    }
    
    .signature-block {
      margin-top: 3em;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
    
    .signature-line {
      width: 45%;
    }
    
    .signature-line hr {
      border: none;
      border-bottom: 1px solid #000;
      margin-top: 3em;
      margin-bottom: 0.5em;
    }
    
    .signature-line p {
      margin: 0;
      font-size: 14px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
    }
    
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    
    th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    
    .highlight {
      background-color: #ffeb3b;
      padding: 2px 4px;
    }
    
    .field-missing {
      background-color: #ffcdd2;
      color: #c62828;
      padding: 2px 4px;
      font-weight: bold;
    }
    
    @page {
      margin: 1in;
    }
  </style>
</head>
<body>
  ${content}
  
  <div class="no-print" style="text-align: center; margin-top: 50px;">
    <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; background: #2196F3; color: white; border: none; border-radius: 4px;">
      Print Contract
    </button>
    <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; margin-left: 10px; background: #757575; color: white; border: none; border-radius: 4px;">
      Close
    </button>
  </div>
</body>
</html>
  `
}

/**
 * Validate that all required fields are present
 */
export function validateContractData(
  data: Partial<ContractData>,
  requiredFields: string[]
): { valid: boolean; missingFields: string[] } {
  const missingFields: string[] = []
  
  requiredFields.forEach(field => {
    if (!data[field] || data[field] === '') {
      missingFields.push(field)
    }
  })
  
  return {
    valid: missingFields.length === 0,
    missingFields
  }
}