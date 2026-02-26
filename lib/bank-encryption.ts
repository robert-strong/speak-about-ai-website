import crypto from 'crypto'

// Get encryption key from environment variable (32 bytes for AES-256)
const getEncryptionKey = (): Buffer => {
  const key = process.env.BANK_ENCRYPTION_KEY || process.env.BANKING_ENCRYPTION_KEY
  if (!key) {
    // Generate a deterministic key from a secret if not set
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'default-secret-change-me'
    return crypto.scryptSync(secret, 'bank-info-salt', 32)
  }
  // If key is provided, ensure it's 32 bytes
  return crypto.scryptSync(key, 'bank-info-salt', 32)
}

export interface BankInfo {
  bankName: string
  routingNumber: string
  accountNumber: string
  accountType?: string
  wireRoutingNumber?: string
  swiftCode?: string
}

export interface EncryptedData {
  encryptedData: string
  iv: string
  authTag: string
}

/**
 * Encrypt bank info using AES-256-GCM
 */
export function encryptBankInfo(bankInfo: BankInfo): EncryptedData {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(16)

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)

  const jsonData = JSON.stringify(bankInfo)
  let encrypted = cipher.update(jsonData, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  }
}

/**
 * Decrypt bank info using AES-256-GCM
 */
export function decryptBankInfo(encryptedData: string, iv: string, authTag: string): BankInfo {
  const key = getEncryptionKey()

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(iv, 'hex')
  )

  decipher.setAuthTag(Buffer.from(authTag, 'hex'))

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return JSON.parse(decrypted)
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Generate a 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Hash OTP for storage
 */
export function hashOTP(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex')
}

/**
 * Verify OTP against hash
 */
export function verifyOTP(otp: string, hash: string): boolean {
  return hashOTP(otp) === hash
}

/**
 * Mask sensitive data for display
 */
export function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) return '****'
  return '****' + accountNumber.slice(-4)
}

export function maskRoutingNumber(routingNumber: string): string {
  if (routingNumber.length <= 4) return '****'
  return '****' + routingNumber.slice(-4)
}
