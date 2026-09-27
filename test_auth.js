// Secure Authentication Test Suite
// Verifies password authentication and old credential rejection using bcrypt
require('dotenv').config();
const bcrypt = require('bcryptjs');

async function testAuthentication() {
  const testPassword = process.env.TEST_AUTH_PASSWORD;
  const oldPassword = process.env.TEST_OLD_PASSWORD;

  if (!testPassword) {
    throw new Error('TEST_AUTH_PASSWORD environment variable is missing.');
  }

  if (!oldPassword) {
    throw new Error('TEST_OLD_PASSWORD environment variable is missing.');
  }

  // Create hash from the secure test-only password
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(testPassword, saltRounds);

  // Use bcrypt.compare() only against the environment variable without logging either plaintext password or hash
  const authWorked = await bcrypt.compare(process.env.TEST_AUTH_PASSWORD, passwordHash);
  const oldMatched = await bcrypt.compare(process.env.TEST_OLD_PASSWORD, passwordHash);
  const oldRejected = !oldMatched;

  if (authWorked && oldRejected) {
    console.log('PASS');
    console.log('Authentication worked: YES');
    console.log('Old credential rejected: YES');
  } else {
    console.log('FAIL');
    console.log(`Authentication worked: ${authWorked ? 'YES' : 'NO'}`);
    console.log(`Old credential rejected: ${oldRejected ? 'YES' : 'NO'}`);
    process.exit(1);
  }
}

testAuthentication().catch((err) => {
  console.error('FAIL');
  process.exit(1);
});
