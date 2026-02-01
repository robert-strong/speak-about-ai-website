const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// Generate hash for "admin123" (you should change this!)
const password = "admin123";
const hash = hashPassword(password);

console.log("\n============================================");
console.log("Admin Password Setup");
console.log("============================================");
console.log(`\nPassword: ${password}`);
console.log(`\nAdd this to your .env.local file:`);
console.log(`ADMIN_PASSWORD_HASH="${hash}"`);
console.log("\n============================================");
console.log("\nIMPORTANT: Remember to:");
console.log("1. Use the email: human@speakabout.ai");
console.log("2. Use the password: admin123");
console.log("3. Update .env.local with the new hash above");
console.log("4. Restart the Next.js server after updating");
console.log("============================================\n");