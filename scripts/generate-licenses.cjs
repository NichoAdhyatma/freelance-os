/**
 * Freelancer OS - License Key Generator
 *
 * Generate license keys untuk dijual di Lynk.id
 *
 * Usage:
 *   npm run generate:licenses -- --type=pro --count=10
 *   node scripts/generate-licenses.js --type=agency --count=5
 *   node scripts/generate-licenses.js --list  # List all licenses
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
};

// License types
const LICENSE_TYPES = {
  FREE: { plan: 'free', features: ['3 projects', 'Basic dashboard', 'Client management'] },
  PRO: {
    plan: 'pro',
    features: ['Unlimited projects', 'Invoice management', 'Revenue analytics', 'Priority support'],
  },
  AGENCY: {
    plan: 'agency',
    features: [
      'Everything in Pro',
      'Team collaboration',
      'Client portal',
      'Custom branding',
      'API access',
    ],
  },
};

// Generate random characters
function generatePart(length = 4) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// Generate license key
function generateLicenseKey(type) {
  const part1 = generatePart(4);
  const part2 = generatePart(4);
  return `FOS-${type.toUpperCase()}-${part1}-${part2}`;
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    type: 'PRO',
    count: 1,
    action: 'generate',
    save: false,
  };

  for (const arg of args) {
    if (arg.startsWith('--type=')) {
      options.type = arg.split('=')[1].toUpperCase();
    } else if (arg.startsWith('--count=')) {
      options.count = parseInt(arg.split('=')[1]);
    } else if (arg === '--save') {
      options.save = true;
    } else if (arg === 'list') {
      options.action = 'list';
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  // Validate type
  if (!['FREE', 'PRO', 'AGENCY'].includes(options.type)) {
    log.error(`Invalid type: ${options.type}. Valid types: FREE, PRO, AGENCY`);
    process.exit(1);
  }

  return options;
}

// Print help
function printHelp() {
  console.log(`
${colors.cyan}
╔═══════════════════════════════════════════════════════════════╗
║         Freelancer OS - License Key Generator                ║
╚═══════════════════════════════════════════════════════════════╝
${colors.reset}

Usage:
  npm run generate:licenses -- [options]

Options:
  --type=<TYPE>    License type: FREE, PRO, or AGENCY (default: PRO)
  --count=<N>      Number of keys to generate (default: 1)
  --save           Save to licenses.json file
  --help, -h       Show this help message

Examples:
  npm run generate:licenses -- --type=pro --count=10
  npm run generate:licenses -- --type=agency --count=5 --save
  npm run generate:licenses -- list

License Types:
  FREE   - Free plan (limited features)
  PRO    - Professional plan (full features)
  AGENCY - Agency plan (team features)

  `);
}

// Initialize Firebase Admin
async function initFirebase() {
  // Check for service account
  const serviceAccountPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.join(__dirname, '..', 'service-account.json');

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // Try default initialization
    try {
      admin.initializeApp();
    } catch {
      log.warn('Firebase Admin not configured. Using mock mode.');
      return null;
    }
  }

  return admin.firestore();
}

// Generate and save licenses to Firestore
async function generateLicenses(type, count, saveToFile = false) {
  log.info(`Generating ${count} license key(s) of type ${type}...`);

  const db = await initFirebase();
  const licenses = [];

  for (let i = 0; i < count; i++) {
    const key = generateLicenseKey(type);
    const licenseData = {
      key,
      type: type.toLowerCase(),
      status: 'available',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    licenses.push(licenseData);

    // Print to console
    console.log(`
    ${colors.green}${key}${colors.reset}
    Type: ${type.toLowerCase()}
    Status: available
    `);

    // Save to Firestore if initialized
    if (db) {
      try {
        await db.collection('licenses').add(licenseData);
        log.success(`Saved to Firestore: ${key}`);
      } catch (error) {
        log.warn(`Could not save to Firestore: ${error.message}`);
      }
    }
  }

  // Save to file if requested
  if (saveToFile) {
    const filePath = path.join(__dirname, '..', 'licenses.json');
    fs.writeFileSync(filePath, JSON.stringify(licenses, null, 2));
    log.success(`Saved to ${filePath}`);
  }

  return licenses;
}

// List all licenses from Firestore
async function listLicenses() {
  log.info('Fetching licenses from Firestore...');

  const db = await initFirebase();
  if (!db) {
    log.error('Firebase not configured. Cannot list licenses.');
    return;
  }

  const snapshot = await db.collection('licenses').get();

  if (snapshot.empty) {
    log.warn('No licenses found in Firestore.');
    return;
  }

  console.log(`
${colors.cyan}
╔═══════════════════════════════════════════════════════════════╗
║                    License Keys                              ║
╚═══════════════════════════════════════════════════════════════╝
${colors.reset}
  `);

  const licenses = {
    available: [],
    activated: [],
    revoked: [],
  };

  snapshot.forEach((doc) => {
    const data = doc.data();
    const status = data.status || 'unknown';

    if (licenses[status]) {
      licenses[status].push({ id: doc.id, ...data });
    }

    const statusColor =
      status === 'available' ? colors.green : status === 'activated' ? colors.yellow : colors.red;

    console.log(`  ${statusColor}${data.key}${colors.reset} - ${data.type} (${status})`);
    console.log(`    ID: ${doc.id}`);
    if (data.activatedBy) {
      console.log(`    Activated by: ${data.activatedBy}`);
    }
    console.log('');
  });

  // Summary
  console.log(`${colors.cyan}Summary:${colors.reset}`);
  console.log(`  Available: ${licenses.available.length}`);
  console.log(`  Activated: ${licenses.activated.length}`);
  console.log(`  Revoked: ${licenses.revoked.length}`);
}

// Main function
async function main() {
  const options = parseArgs();

  switch (options.action) {
    case 'list':
      await listLicenses();
      break;
    case 'generate':
      await generateLicenses(options.type, options.count, options.save);
      break;
    default:
      log.error(`Unknown action: ${options.action}`);
      printHelp();
      process.exit(1);
  }
}

// Run
main().catch((error) => {
  log.error(`Error: ${error.message}`);
  process.exit(1);
});
