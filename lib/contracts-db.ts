import { neon } from "@neondatabase/serverless"
import { generateContractContent, generateContractHTML as generateHTMLFromTemplate, validateContractData, type ContractData } from "./contract-template"
import type { Deal } from "./deals-db"

// Lazy initialize Neon client to avoid build-time errors
let sql: any = null
let databaseAvailable = false
let initialized = false

function initializeDatabase() {
  if (initialized) return
  initialized = true
  
  try {
    if (process.env.DATABASE_URL) {
      console.log("Contracts DB: Initializing Neon client...")
      sql = neon(process.env.DATABASE_URL)
      databaseAvailable = true
      console.log("Contracts DB: Neon client initialized successfully")
    } else {
      console.warn("DATABASE_URL environment variable is not set - contracts database unavailable")
    }
  } catch (error) {
    console.error("Failed to initialize Neon client for contracts:", error)
  }
}

export interface Contract {
  id: number
  deal_id?: number
  contract_number: string
  title: string
  type: string
  status: "draft" | "sent" | "partially_signed" | "fully_executed" | "cancelled"
  
  // Contract content
  terms?: string
  description?: string
  special_requirements?: string
  
  // Financial terms
  fee_amount?: number
  payment_terms?: string
  currency?: string
  
  // Event details
  event_title?: string
  event_date?: string
  event_location?: string
  event_type?: string
  
  // Client information
  client_name?: string
  client_email?: string
  client_company?: string
  
  // Speaker information
  speaker_name?: string
  speaker_email?: string
  speaker_fee?: number
  
  // Contract lifecycle
  generated_at?: string
  sent_at?: string
  expires_at?: string
  signed_at?: string
  
  // Audit
  created_by?: string
  created_at?: string
  updated_at?: string
  
  // Additional data
  template_settings?: any
  contract_data?: any
}

export interface ContractSignature {
  id: number
  contract_id: number
  signer_type: "client" | "speaker" | "admin"
  signer_name: string
  signer_email: string
  signer_title?: string
  signature_data?: string
  signature_method: "digital_pad" | "electronic" | "wet_signature"
  signed_at: string
  ip_address?: string
  user_agent?: string
  verified: boolean
  verification_code?: string
}

export interface ContractVersion {
  id: number
  contract_id: number
  version_number: number
  terms: string
  changes_summary?: string
  created_at: string
  created_by?: string
}

// Generate a secure random token
function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Generate contract number
function generateContractNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `CTR-${date}-${random}`
}

export async function createContractFromDeal(
  deal: Deal, 
  speakerInfo?: { name: string; email: string; fee?: number },
  additionalTerms?: string,
  createdBy?: string,
  clientSignerInfo?: { name: string; email: string }
): Promise<Contract | null> {
  initializeDatabase()
  if (!databaseAvailable || !sql) {
    console.warn("createContractFromDeal: Database not available")
    return null
  }

  try {
    // Prepare contract data with travel information
    const contractData: ContractData = {
      ...deal,
      contract_number: generateContractNumber(),
      speaker_name: speakerInfo?.name || deal.speaker_requested,
      speaker_email: speakerInfo?.email,
      speaker_fee: speakerInfo?.fee || deal.deal_value,
      payment_terms: "Payment due within 30 days of event completion",
      additional_terms: additionalTerms,
      // Include travel fields from deal
      travel_required: deal.travel_required,
      flight_required: deal.flight_required,
      hotel_required: deal.hotel_required,
      travel_stipend: deal.travel_stipend
    }

    // Validate contract data
    const validation = validateContractData(contractData)
    if (!validation.isValid) {
      console.error("Contract validation failed:", validation.errors)
      throw new Error(`Contract validation failed: ${validation.errors.join(', ')}`)
    }

    // Generate contract content
    const contractContent = generateContractContent(contractData)
    
    // Generate security tokens
    const accessToken = generateSecureToken(40)
    const clientSigningToken = generateSecureToken(40)
    const speakerSigningToken = generateSecureToken(40)
    
    // Set expiration date (90 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 90)

    console.log("Creating contract for deal:", deal.id)
    
    const clientSigner = clientSignerInfo || { name: deal.client_name, email: deal.client_email }
    
    const [contract] = await sql`
      INSERT INTO contracts (
        deal_id, contract_number, title, type, status, terms,
        fee_amount, payment_terms, event_title, event_date, event_location,
        event_type, client_name, client_email, client_company,
        speaker_name, speaker_email, speaker_fee, expires_at,
        created_by, sent_at, contract_data
      ) VALUES (
        ${deal.id}, ${contractData.contract_number}, 
        ${`Speaker Engagement Agreement - ${deal.event_title}`},
        'client_speaker', 'draft', ${contractContent},
        ${contractData.deal_value}, ${contractData.payment_terms},
        ${deal.event_title}, ${deal.event_date}, ${deal.event_location},
        ${deal.event_type},
        ${deal.client_name}, ${deal.client_email}, ${deal.company},
        ${contractData.speaker_name}, ${contractData.speaker_email}, 
        ${contractData.speaker_fee}, ${expiresAt.toISOString()},
        ${createdBy}, NOW(), ${JSON.stringify({
          clientSigner: clientSigner,
          attendeeCount: deal.attendee_count,
          tokens: {
            access: accessToken,
            clientSigning: clientSigningToken,
            speakerSigning: speakerSigningToken
          }
        })}::jsonb
      )
      RETURNING *
    `

    // Create initial version
    await sql`
      INSERT INTO contract_versions (contract_id, version_number, terms, changes_summary, created_by)
      VALUES (${contract.id}, 1, ${contractContent}, 'Initial contract creation', ${createdBy})
    `

    console.log("Successfully created contract with ID:", contract.id)
    return contract as Contract
  } catch (error) {
    console.error("Error creating contract:", error)
    return null
  }
}

export async function getAllContracts(): Promise<Contract[]> {
  initializeDatabase()
  if (!databaseAvailable || !sql) {
    console.warn("getAllContracts: Database not available")
    return []
  }
  
  try {
    console.log("Fetching all contracts from database...")
    const contracts = await sql`
      SELECT c.*, d.client_name as deal_client_name, d.event_title as deal_event_title
      FROM contracts c
      LEFT JOIN deals d ON c.deal_id = d.id
      ORDER BY c.generated_at DESC
    `
    console.log(`Successfully fetched ${contracts.length} contracts`)
    return contracts as Contract[]
  } catch (error) {
    console.error("Error fetching contracts:", error)
    return []
  }
}

export async function getContractById(id: number): Promise<Contract | null> {
  initializeDatabase()
  if (!databaseAvailable || !sql) {
    console.warn("getContractById: Database not available")
    return null
  }
  
  try {
    console.log("Fetching contract by ID:", id)
    const [contract] = await sql`
      SELECT c.*, d.client_name as deal_client_name, d.event_title as deal_event_title
      FROM contracts c
      LEFT JOIN deals d ON c.deal_id = d.id
      WHERE c.id = ${id}
    `
    return contract as Contract || null
  } catch (error) {
    console.error("Error fetching contract by ID:", error)
    return null
  }
}

export async function getContractByToken(token: string): Promise<Contract | null> {
  initializeDatabase()
  if (!databaseAvailable || !sql) {
    console.warn("getContractByToken: Database not available")
    return null
  }
  
  try {
    console.log("Fetching contract by token")
    const [contract] = await sql`
      SELECT * FROM contracts 
      WHERE access_token = ${token} 
         OR client_signing_token = ${token} 
         OR speaker_signing_token = ${token}
    `
    return contract as Contract || null
  } catch (error) {
    console.error("Error fetching contract by token:", error)
    return null
  }
}

export async function updateContractStatus(
  id: number, 
  status: Contract['status'],
  updatedBy?: string
): Promise<Contract | null> {
  initializeDatabase()
  if (!databaseAvailable || !sql) {
    console.warn("updateContractStatus: Database not available")
    return null
  }
  
  try {
    console.log("Updating contract status:", id, "to", status)
    
    // Set completion timestamp if fully executed
    const completedAt = status === 'fully_executed' ? new Date().toISOString() : null
    const sentAt = status === 'sent' ? new Date().toISOString() : null
    
    const [contract] = await sql`
      UPDATE contracts SET
        status = ${status},
        completed_at = COALESCE(${completedAt}, completed_at),
        sent_at = COALESCE(${sentAt}, sent_at),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `
    
    console.log("Successfully updated contract status")
    return contract as Contract
  } catch (error) {
    console.error("Error updating contract status:", error)
    return null
  }
}

export async function addContractSignature(
  contractId: number,
  signerType: ContractSignature['signer_type'],
  signerName: string,
  signerEmail: string,
  signatureData?: string,
  signerTitle?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<ContractSignature | null> {
  initializeDatabase()
  if (!databaseAvailable || !sql) {
    console.warn("addContractSignature: Database not available")
    return null
  }
  
  try {
    console.log("Adding signature for contract:", contractId, "signer type:", signerType)
    
    const [signature] = await sql`
      INSERT INTO contract_signatures (
        contract_id, signer_type, signer_name, signer_email, signer_title,
        signature_data, signature_method, ip_address, user_agent, verified
      ) VALUES (
        ${contractId}, ${signerType}, ${signerName}, ${signerEmail}, ${signerTitle},
        ${signatureData}, 'digital_pad', ${ipAddress}, ${userAgent}, true
      )
      ON CONFLICT (contract_id, signer_type) 
      DO UPDATE SET
        signer_name = EXCLUDED.signer_name,
        signer_email = EXCLUDED.signer_email,
        signature_data = EXCLUDED.signature_data,
        signed_at = CURRENT_TIMESTAMP,
        ip_address = EXCLUDED.ip_address,
        user_agent = EXCLUDED.user_agent
      RETURNING *
    `
    
    // Check if contract is now fully signed
    const signatures = await sql`
      SELECT signer_type FROM contract_signatures WHERE contract_id = ${contractId}
    `
    
    const hasClientSignature = signatures.some((s: any) => s.signer_type === 'client')
    const hasSpeakerSignature = signatures.some((s: any) => s.signer_type === 'speaker')
    
    if (hasClientSignature && hasSpeakerSignature) {
      await updateContractStatus(contractId, 'fully_executed')
    } else {
      await updateContractStatus(contractId, 'partially_signed')
    }
    
    console.log("Successfully added contract signature")
    return signature as ContractSignature
  } catch (error) {
    console.error("Error adding contract signature:", error)
    return null
  }
}

export async function getContractSignatures(contractId: number): Promise<ContractSignature[]> {
  initializeDatabase()
  if (!databaseAvailable || !sql) {
    console.warn("getContractSignatures: Database not available")
    return []
  }
  
  try {
    console.log("Fetching signatures for contract:", contractId)
    const signatures = await sql`
      SELECT * FROM contract_signatures 
      WHERE contract_id = ${contractId}
      ORDER BY signed_at DESC
    `
    return signatures as ContractSignature[]
  } catch (error) {
    console.error("Error fetching contract signatures:", error)
    return []
  }
}

export async function generateContractHTML(contractId: number): Promise<string | null> {
  try {
    const contract = await getContractById(contractId)
    if (!contract) return null
    
    // Parse contract_data if it exists for additional information
    let contractMetadata: any = {}
    if (contract.contract_data) {
      try {
        contractMetadata = typeof contract.contract_data === 'string' 
          ? JSON.parse(contract.contract_data)
          : contract.contract_data
      } catch (e) {
        console.warn("Failed to parse contract_data:", e)
      }
    }
    
    // Create contract data object for HTML generation
    const contractData: ContractData = {
      id: contract.deal_id || contract.id,
      contract_number: contract.contract_number,
      client_name: contract.client_name || '',
      client_email: contract.client_email || '',
      client_phone: '', // We'll need to get this from the deal if needed
      company: contract.client_company || '',
      event_title: contract.event_title || '',
      event_date: contract.event_date || new Date().toISOString(),
      event_location: contract.event_location || '',
      event_type: contract.event_type || '',
      speaker_requested: contract.speaker_name || '',
      attendee_count: contractMetadata.attendeeCount || 0,
      budget_range: '',
      deal_value: contract.fee_amount || 0,
      status: 'won', // Since we're generating a contract
      priority: 'medium',
      source: '',
      notes: '',
      created_at: contract.generated_at || contract.created_at || new Date().toISOString(),
      last_contact: '',
      updated_at: contract.updated_at || new Date().toISOString(),
      speaker_name: contract.speaker_name || '',
      speaker_email: contract.speaker_email || '',
      speaker_fee: contract.speaker_fee || contract.fee_amount || 0,
      payment_terms: contract.payment_terms || 'Payment due within 30 days of event completion',
      travel_stipend: 0 // Default value as contracts table might not have this field
    }
    
    return generateHTMLFromTemplate(contractData)
  } catch (error) {
    console.error("Error generating contract HTML:", error)
    return null
  }
}

export async function updateContract(id: number, data: any): Promise<Contract | null> {
  initializeDatabase()
  if (!databaseAvailable || !sql) {
    console.warn("updateContract: Database not available")
    return null
  }
  
  try {
    console.log("Updating contract ID:", id)
    
    // Build update fields dynamically
    const updates: string[] = []
    const values: any = { id }
    
    if (data.title) {
      updates.push('title = ${title}')
      values.title = data.title
    }
    
    if (data.type) {
      updates.push('type = ${type}')
      values.type = data.type
    }
    
    if (data.contract_data) {
      updates.push('contract_data = ${contract_data}::jsonb')
      values.contract_data = JSON.stringify(data.contract_data)
    }
    
    if (data.status) {
      updates.push('status = ${status}')
      values.status = data.status
    }
    
    if (data.updated_by) {
      updates.push('created_by = ${updated_by}')
      values.updated_by = data.updated_by
    }
    
    // Update fee_amount if speaker_fee is provided in contract_data
    if (data.contract_data && data.contract_data.speaker_fee) {
      updates.push('fee_amount = ${fee_amount}')
      values.fee_amount = parseFloat(data.contract_data.speaker_fee) || 0
      updates.push('speaker_fee = ${speaker_fee}')
      values.speaker_fee = parseFloat(data.contract_data.speaker_fee) || 0
    }
    
    // Update event details if provided
    if (data.contract_data) {
      if (data.contract_data.event_title) {
        updates.push('event_title = ${event_title}')
        values.event_title = data.contract_data.event_title
      }
      if (data.contract_data.event_date) {
        updates.push('event_date = ${event_date}')
        values.event_date = data.contract_data.event_date
      }
      if (data.contract_data.event_location) {
        updates.push('event_location = ${event_location}')
        values.event_location = data.contract_data.event_location
      }
    }
    
    // Always update the timestamp
    updates.push('updated_at = NOW()')
    
    if (updates.length === 1) {
      // Only timestamp update, no other changes
      return await getContractById(id)
    }
    
    // Execute the update
    const result = await sql`
      UPDATE contracts 
      SET ${sql.unsafe(updates.join(', '))}
      WHERE id = ${id}
      RETURNING *
    `
    
    console.log("Successfully updated contract ID:", id)
    return result.length > 0 ? result[0] : null
  } catch (error) {
    console.error("Error updating contract:", error)
    return null
  }
}

export async function deleteContract(id: number): Promise<boolean> {
  initializeDatabase()
  if (!databaseAvailable || !sql) {
    console.warn("deleteContract: Database not available")
    return false
  }
  
  try {
    console.log("Deleting contract ID:", id)
    await sql`DELETE FROM contracts WHERE id = ${id}`
    console.log("Successfully deleted contract ID:", id)
    return true
  } catch (error) {
    console.error("Error deleting contract:", error)
    return false
  }
}

// Get contract by ID and token for signing
export async function getContractByIdAndToken(id: number, token: string): Promise<Contract | null> {
  initializeDatabase()
  if (!databaseAvailable || !sql) {
    console.warn("getContractByIdAndToken: Database not available")
    return null
  }
  
  try {
    const contracts = await sql`
      SELECT * FROM contracts 
      WHERE id = ${id} 
      AND (speaker_signing_token = ${token} OR client_signing_token = ${token})
    `
    
    return contracts.length > 0 ? contracts[0] : null
  } catch (error) {
    console.error("Error getting contract by ID and token:", error)
    return null
  }
}

// Sign contract
export async function signContract(data: {
  contractId: number
  signerType: "client" | "speaker"
  signerName: string
  signerEmail: string
  signerTitle?: string
  ipAddress?: string
  userAgent?: string
}): Promise<{ id: number; contractFullyExecuted: boolean } | null> {
  initializeDatabase()
  if (!databaseAvailable || !sql) {
    console.warn("signContract: Database not available")
    return null
  }
  
  try {
    // Create signature record
    const signature = await sql`
      INSERT INTO contract_signatures (
        contract_id,
        signer_type,
        signer_name,
        signer_email,
        signer_title,
        signature_method,
        signed_at,
        ip_address,
        user_agent,
        verified
      ) VALUES (
        ${data.contractId},
        ${data.signerType},
        ${data.signerName},
        ${data.signerEmail},
        ${data.signerTitle || null},
        'electronic',
        NOW(),
        ${data.ipAddress || null},
        ${data.userAgent || null},
        true
      )
      RETURNING id
    `
    
    // Update contract status and signed dates
    const updateField = data.signerType === "client" ? "client_signed_at" : "speaker_signed_at"
    const ipField = data.signerType === "client" ? "client_ip_address" : "speaker_ip_address"
    
    await sql`
      UPDATE contracts 
      SET 
        ${sql(updateField)} = NOW(),
        ${sql(ipField)} = ${data.ipAddress || null},
        updated_at = NOW()
      WHERE id = ${data.contractId}
    `
    
    // Check if contract is now fully executed
    const contract = await sql`
      SELECT speaker_signed_at, client_signed_at 
      FROM contracts 
      WHERE id = ${data.contractId}
    `
    
    const isFullyExecuted = !!(contract[0]?.speaker_signed_at && contract[0]?.client_signed_at)
    
    if (isFullyExecuted) {
      await sql`
        UPDATE contracts 
        SET 
          status = 'fully_executed',
          completed_at = NOW(),
          updated_at = NOW()
        WHERE id = ${data.contractId}
      `
    } else {
      const newStatus = data.signerType === "client" ? "client_signed" : "speaker_signed"
      await sql`
        UPDATE contracts 
        SET 
          status = ${newStatus},
          updated_at = NOW()
        WHERE id = ${data.contractId}
      `
    }
    
    return {
      id: signature[0].id,
      contractFullyExecuted: isFullyExecuted
    }
  } catch (error) {
    console.error("Error signing contract:", error)
    return null
  }
}


// Test connection function
export async function testContractsConnection(): Promise<boolean> {
  initializeDatabase()
  if (!databaseAvailable || !sql) {
    return false
  }
  
  try {
    await sql`SELECT 1`
    return true
  } catch (error) {
    console.error("Contracts database connection test failed:", error)
    return false
  }
}