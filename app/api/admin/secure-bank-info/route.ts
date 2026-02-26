import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"
import {
  encryptBankInfo,
  decryptBankInfo,
  maskAccountNumber,
  maskRoutingNumber,
  BankInfo
} from "@/lib/bank-encryption"

const sql = neon(process.env.DATABASE_URL!)

// GET - Retrieve stored bank info (masked for display)
export async function GET(request: NextRequest) {
  try {
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const [bankInfo] = await sql`
      SELECT id, encrypted_data, iv, auth_tag, updated_at
      FROM secure_bank_info
      ORDER BY id DESC
      LIMIT 1
    `

    if (!bankInfo) {
      return NextResponse.json({
        exists: false,
        data: null
      })
    }

    // Decrypt to get actual values for masking
    const decrypted = decryptBankInfo(
      bankInfo.encrypted_data,
      bankInfo.iv,
      bankInfo.auth_tag
    )

    // Return masked values for display
    return NextResponse.json({
      exists: true,
      data: {
        bankName: decrypted.bankName,
        routingNumber: maskRoutingNumber(decrypted.routingNumber),
        accountNumber: maskAccountNumber(decrypted.accountNumber),
        accountType: decrypted.accountType || 'Checking',
        wireRoutingNumber: decrypted.wireRoutingNumber ? maskRoutingNumber(decrypted.wireRoutingNumber) : null,
        swiftCode: decrypted.swiftCode || null
      },
      updatedAt: bankInfo.updated_at
    })
  } catch (error) {
    console.error("Error fetching secure bank info:", error)
    return NextResponse.json(
      { error: "Failed to fetch bank info" },
      { status: 500 }
    )
  }
}

// POST - Store/update bank info (encrypted)
export async function POST(request: NextRequest) {
  try {
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const body = await request.json()
    const { bankName, routingNumber, accountNumber, accountType, wireRoutingNumber, swiftCode } = body

    // Validate required fields
    if (!bankName || !routingNumber || !accountNumber) {
      return NextResponse.json(
        { error: "Bank name, routing number, and account number are required" },
        { status: 400 }
      )
    }

    // Encrypt the bank info
    const bankInfo: BankInfo = {
      bankName,
      routingNumber,
      accountNumber,
      accountType: accountType || 'Checking',
      wireRoutingNumber: wireRoutingNumber || '',
      swiftCode: swiftCode || ''
    }

    const encrypted = encryptBankInfo(bankInfo)

    // Check if record exists
    const [existing] = await sql`
      SELECT id FROM secure_bank_info LIMIT 1
    `

    if (existing) {
      // Update existing record
      await sql`
        UPDATE secure_bank_info
        SET
          encrypted_data = ${encrypted.encryptedData},
          iv = ${encrypted.iv},
          auth_tag = ${encrypted.authTag},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existing.id}
      `
    } else {
      // Insert new record
      await sql`
        INSERT INTO secure_bank_info (encrypted_data, iv, auth_tag)
        VALUES (${encrypted.encryptedData}, ${encrypted.iv}, ${encrypted.authTag})
      `
    }

    // Log the action
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await sql`
      INSERT INTO bank_info_audit_log (action, ip_address, user_agent, details)
      VALUES (
        'bank_info_updated',
        ${ip},
        ${request.headers.get('user-agent') || 'Unknown'},
        ${JSON.stringify({ bankName, hasRouting: !!routingNumber, hasAccount: !!accountNumber })}
      )
    `

    return NextResponse.json({
      success: true,
      message: "Bank info saved securely"
    })
  } catch (error) {
    console.error("Error saving secure bank info:", error)
    return NextResponse.json(
      { error: "Failed to save bank info" },
      { status: 500 }
    )
  }
}
