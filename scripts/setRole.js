const admin = require('firebase-admin');
const path = require('path');

if (process.argv.length < 4) {
  console.error('Usage: node scripts/setRole.js <UID> <role>');
  console.error('Example: node scripts/setRole.js 0a1b2c3d admin');
  process.exit(1);
}

const uid = process.argv[2];
const role = process.argv[3];

// Load service account key - place your service account JSON at scripts/serviceAccountKey.json
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} catch (err) {
  console.error('Could not load service account key at', serviceAccountPath);
  console.error('Create a service account JSON in scripts/serviceAccountKey.json from Firebase Console.');
  process.exit(1);
}

const validRoles = ['admin', 'vendedor'];
if (!validRoles.includes(role)) {
  console.error('Role must be one of:', validRoles.join(', '));
  process.exit(1);
}

(async () => {
  try {
    const claims = {};
    claims[role] = true;
    // Clear other role claims if desired (optional). Here we set only the provided role.
    await admin.auth().setCustomUserClaims(uid, claims);
    console.log(`Custom claim set: ${role}=true for uid=${uid}`);
    process.exit(0);
  } catch (err) {
    console.error('Error setting custom claim:', err);
    process.exit(1);
  }
})();
