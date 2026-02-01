/**
 * Admin Login Troubleshooting Script
 * Tests the admin login configuration and credentials
 */

import { createHash, randomBytes, pbkdf2Sync } from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

// Password utility functions
function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  try {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    
    const verifyHash = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

console.log('\n🔍 Admin Login Configuration Check\n');
console.log('='.repeat(50));

// Check environment variables
console.log('\n1. Environment Variables:');
console.log('   ADMIN_EMAIL:', process.env.ADMIN_EMAIL ? '✅ Set' : '❌ Missing');
console.log('   ADMIN_PASSWORD_HASH:', process.env.ADMIN_PASSWORD_HASH ? '✅ Set' : '❌ Missing');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');

if (process.env.ADMIN_EMAIL) {
  console.log('   Email value:', process.env.ADMIN_EMAIL);
}

// Test password verification
console.log('\n2. Password Hash Verification:');
if (process.env.ADMIN_PASSWORD_HASH) {
  const testPasswords = [
    'admin', 'Admin123', 'password', 'Password123', 
    'admin123', 'Admin@123', 'SpeakAboutAI2024', 'SpeakAboutAI2025',
    'speakaboutai', 'Speakaboutai123'
  ];
  
  console.log('   Testing common passwords...');
  let passwordFound = false;
  
  for (const testPass of testPasswords) {
    if (verifyPassword(testPass, process.env.ADMIN_PASSWORD_HASH)) {
      console.log(`   ✅ Password matches: "${testPass}"`);
      passwordFound = true;
      break;
    }
  }
  
  if (!passwordFound) {
    console.log('   ⚠️  None of the common passwords match');
    console.log('   The password is a custom one (not in common list)');
    
    // Try the reset key as password
    if (process.env.ADMIN_RESET_KEY) {
      if (verifyPassword(process.env.ADMIN_RESET_KEY, process.env.ADMIN_PASSWORD_HASH)) {
        console.log(`   ✅ Password matches the reset key: "${process.env.ADMIN_RESET_KEY}"`);
        passwordFound = true;
      }
    }
  }
}

// Generate new password hash if requested
if (process.argv[2]) {
  const newPassword = process.argv[2];
  const newHash = hashPassword(newPassword);
  console.log('\n3. New Password Hash Generation:');
  console.log('   Password:', newPassword);
  console.log('   Generated Hash:', newHash);
  console.log('\n   To use this password, update these in Vercel:');
  console.log(`   ADMIN_PASSWORD_HASH="${newHash}"`);
}

// Test API endpoint locally
console.log('\n4. Testing Login Endpoint Locally:');
try {
  const testResponse = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.ADMIN_EMAIL,
      password: 'test'
    })
  });
  const status = testResponse.status;
  console.log('   API endpoint status:', status === 401 ? '✅ Working (401 for wrong password)' : 
                                         status === 503 ? '❌ Missing environment variables' :
                                         status === 429 ? '⚠️ Rate limited' : 
                                         `Status ${status}`);
} catch (error) {
  console.log('   Could not test local endpoint (server may not be running)');
}

console.log('\n5. Vercel Environment Variables Setup:');
console.log('   Go to: https://vercel.com/your-team/speak-about-ai-website/settings/environment-variables');
console.log('   Ensure these are set for Production:');
console.log('   • ADMIN_EMAIL');
console.log('   • ADMIN_PASSWORD_HASH');
console.log('   • JWT_SECRET');

console.log('\n6. Common Issues and Solutions:');
console.log('   ❌ "Authentication service unavailable":');
console.log('      → ADMIN_EMAIL or ADMIN_PASSWORD_HASH missing in Vercel');
console.log('\n   ❌ "Authentication service configuration error":');
console.log('      → JWT_SECRET missing in Vercel');
console.log('\n   ❌ "Invalid credentials":');
console.log('      → Wrong email or password');
console.log('      → Check email case sensitivity');
console.log('\n   ❌ "Too many login attempts":');
console.log('      → Wait 15 minutes or clear browser cache');

console.log('\n7. Quick Fix - Set a New Password:');
console.log('   1. Run: node scripts/test-admin-login.mjs "YourNewPassword123"');
console.log('   2. Copy the generated hash');
console.log('   3. Go to Vercel dashboard → Settings → Environment Variables');
console.log('   4. Update ADMIN_PASSWORD_HASH with the new hash');
console.log('   5. Redeploy the application');

console.log('\n' + '='.repeat(50));
console.log('\n✅ Admin credentials for local testing:');
console.log('   Email:', process.env.ADMIN_EMAIL || 'Not set');
if (process.env.ADMIN_PASSWORD_HASH) {
  // Test with a known simple password
  const simplePassword = 'Admin123!';
  if (verifyPassword(simplePassword, process.env.ADMIN_PASSWORD_HASH)) {
    console.log('   Password: Admin123!');
  } else {
    console.log('   Password: (custom - run script with password argument to test)');
  }
}

process.exit(0);