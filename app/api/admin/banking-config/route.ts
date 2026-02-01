import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"
import crypto from 'crypto'

const sql = neon(process.env.DATABASE_URL!)

// Encryption key from environment variable (should be 32 bytes)
const ENCRYPTION_KEY = process.env.BANKING_ENCRYPTION_KEY || 'default-key-replace-in-production'

// Simple encryption for sensitive data
function encrypt(text: string): string {
  try {
    const algorithm = 'aes-256-cbc'
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(algorithm, key, iv)
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    return iv.toString('hex') + ':' + encrypted
  } catch (error) {
    console.error('Encryption error:', error)
    return text // Fallback to unencrypted in case of error
  }
}

function decrypt(encryptedText: string): string {
  try {
    const algorithm = 'aes-256-cbc'
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
    const parts = encryptedText.split(':')
    
    if (parts.length !== 2) return encryptedText
    
    const iv = Buffer.from(parts[0], 'hex')
    const encrypted = parts[1]
    const decipher = crypto.createDecipheriv(algorithm, key, iv)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    return encryptedText // Return as-is if decryption fails
  }
}

// GET banking configuration
export async function GET(request: NextRequest) {
  try {
    const authError = requireAdminAuth(request)
    if (authError) return authError

    // First try environment variables (highest priority) - using your actual env var names
    const envConfig = {
      entity_name: process.env.ENTITY_NAME || '',
      entity_address: process.env.ENTITY_ADDRESS || '',
      bank_name: process.env.BANK_NAME || '',
      bank_address: process.env.BANK_ADDRESS || '',
      account_number: process.env.ACCOUNT_NUMBER || '',
      routing_number: process.env.ROUTING_NUMBER || '',
      swift_code: process.env.SWIFT_CODE || '',
      currency_type: process.env.CURRENCY_TYPE || 'USD',
      wire_instructions: process.env.BANK_WIRE_INSTRUCTIONS || `Please use SWIFT code ${process.env.SWIFT_CODE || ''} for international transfers`,
      ach_instructions: process.env.BANK_ACH_INSTRUCTIONS || 'For ACH transfers, use the routing and account numbers provided above',
      payment_terms_deposit: process.env.INVOICE_DEPOSIT_TERMS || 'Net 30 days from issue date',
      payment_terms_final: process.env.INVOICE_FINAL_TERMS || 'Due on event date',
      source: 'environment'
    }

    // If env variables are configured, return them
    if (envConfig.bank_name || envConfig.entity_name) {
      return NextResponse.json({
        config: envConfig,
        masked: {
          account_number: envConfig.account_number ? `****${envConfig.account_number.slice(-4)}` : '',
          routing_number: envConfig.routing_number ? `****${envConfig.routing_number.slice(-4)}` : ''
        }
      })
    }

    // Otherwise, get from database
    const configs = await sql`
      SELECT 
        config_key,
        config_value,
        is_sensitive,
        display_value
      FROM banking_config
    `

    const configMap: any = {
      source: 'database'
    }
    const maskedMap: any = {}

    for (const config of configs) {
      if (config.is_sensitive) {
        // Decrypt sensitive values
        configMap[config.config_key] = decrypt(config.config_value || '')
        maskedMap[config.config_key] = config.display_value || '****'
      } else {
        configMap[config.config_key] = config.config_value
      }
    }

    return NextResponse.json({
      config: configMap,
      masked: maskedMap
    })

  } catch (error) {
    console.error("Error fetching banking config:", error)
    return NextResponse.json(
      { error: "Failed to fetch banking configuration" },
      { status: 500 }
    )
  }
}

// UPDATE banking configuration
export async function PUT(request: NextRequest) {
  try {
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const body = await request.json()
    const { config } = body

    // Get user info for audit
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'Unknown'

    // Update each config item
    for (const [key, value] of Object.entries(config)) {
      const isSensitive = ['account_number', 'routing_number'].includes(key)
      
      // Get old value for audit
      const [oldConfig] = await sql`
        SELECT config_value FROM banking_config WHERE config_key = ${key}
      `

      let storedValue = value as string
      let displayValue = null

      if (isSensitive && value) {
        // Encrypt sensitive values
        storedValue = encrypt(value as string)
        // Create masked display value
        displayValue = `****${(value as string).slice(-4)}`
      }

      // Update or insert config
      await sql`
        INSERT INTO banking_config (config_key, config_value, is_sensitive, display_value)
        VALUES (${key}, ${storedValue}, ${isSensitive}, ${displayValue})
        ON CONFLICT (config_key) 
        DO UPDATE SET 
          config_value = ${storedValue},
          display_value = ${displayValue},
          updated_at = NOW(),
          updated_by = 'admin'
      `

      // Log to audit table (don't log actual sensitive values)
      await sql`
        INSERT INTO banking_config_audit (
          config_key,
          old_value,
          new_value,
          changed_by,
          ip_address,
          user_agent
        ) VALUES (
          ${key},
          ${isSensitive ? '****' : oldConfig?.config_value || ''},
          ${isSensitive ? '****' : value as string},
          'admin',
          ${ip},
          ${userAgent}
        )
      `
    }

    return NextResponse.json({
      success: true,
      message: "Banking configuration updated successfully"
    })

  } catch (error) {
    console.error("Error updating banking config:", error)
    return NextResponse.json(
      { error: "Failed to update banking configuration" },
      { status: 500 }
    )
  }
}