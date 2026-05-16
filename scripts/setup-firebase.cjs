/**
 * Freelancer OS - Developer Setup Script
 *
 * Script ini dijalankan SEKALI oleh developer untuk setup Firebase project
 * yang akan digunakan oleh semua user (Shared Firebase approach).
 *
 * Usage:
 *   npm run setup:firebase
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  step: (msg) => console.log(`\n${colors.blue}▶${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bold}${colors.cyan}${msg}${colors.reset}`),
};

// Questions
const question = (query) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(`${colors.yellow}?${colors.reset} ${query}: `, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

// Check if command exists
function commandExists(cmd) {
  try {
    execSync(cmd, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// Open URL in browser
function openUrl(url) {
  const platform = process.platform;
  const cmd = platform === 'win32' ? 'start' : platform === 'darwin' ? 'open' : 'xdg-open';
  try {
    execSync(`${cmd} "${url}"`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Banner
const banner = () => {
  console.log(`
${colors.cyan}
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     🔥 Freelancer OS - Firebase Setup Script                 ║
║                                                               ║
║     Setup Firebase project untuk Shared Firebase approach     ║
║     (1 Firebase project untuk semua user)                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
${colors.reset}
  `);
};

async function main() {
  banner();

  // Check Node.js version
  const nodeVersion = process.version.slice(1, 3);
  if (parseInt(nodeVersion) < 18) {
    log.error('Node.js version 18+ required. Current: ' + process.version);
    process.exit(1);
  }

  log.info('Firebase Setup Script untuk Developer\n');

  // Step 1: Check prerequisites
  log.step('Step 1: Cek Prerequisites');

  const hasFirebaseCLI = commandExists('firebase --version');
  if (!hasFirebaseCLI) {
    log.warn('Firebase CLI belum terinstall');
    const install = await question('Install Firebase CLI? (y/n)');
    if (install.toLowerCase() === 'y') {
      log.info('Installing Firebase CLI...');
      execSync('npm install -g firebase-tools', { stdio: 'inherit' });
      log.success('Firebase CLI installed!');
    } else {
      log.error('Firebase CLI required. Install manual: npm install -g firebase-tools');
      process.exit(1);
    }
  } else {
    const version = execSync('firebase --version', { encoding: 'utf8' }).trim();
    log.success(`Firebase CLI detected: ${version}`);
  }

  // Step 2: Login
  log.step('Step 2: Firebase Login');
  log.info('Melakukan login ke Firebase...');
  try {
    execSync('firebase login', { stdio: 'inherit' });
    log.success('Logged in to Firebase!');
  } catch {
    log.error('Login cancelled atau gagal');
    process.exit(1);
  }

  // Step 3: Create or Select Project
  log.step('Step 3: Setup Firebase Project');

  console.log(`
  ${colors.yellow}
  ╔════════════════════════════════════════════════════════════════╗
  ║  MANUAL STEP: Buat Firebase Project di Console               ║
  ╚════════════════════════════════════════════════════════════════╝
  ${colors.reset}

  Karena Firebase CLI tidak bisa buat project baru,
  kamu perlu buat project melalui Firebase Console:
  `);

  // Offer to open Firebase Console
  const openConsole = await question('Buka Firebase Console sekarang? (y/n)');
  if (openConsole.toLowerCase() === 'y') {
    openUrl('https://console.firebase.google.com/');
    log.info('Firebase Console should be opening in your browser...');
  }

  console.log(`
  Steps di Firebase Console:
  1. Klik "Add project"
  2. Nama project: freelancer-os (atau sesuai selera)
  3. Matikan Google Analytics (optional) → Create
  4. Tunggu sampai selesai → Continue

  ${colors.green}Sudah selesai? Tekan Enter untuk lanjut${colors.reset}
  `);

  await question(''); // Wait for Enter

  // Step 4: Get Project ID
  log.step('Step 4: Masukkan Project ID');

  let projectId;
  const defaultId = 'freelancer-os';

  console.log(`
  Masukkan Project ID dari Firebase Console:

  Lokasi: Firebase Console > Project Settings > General
  Project ID ada di bagian "Project ID"
  `);

  projectId = await question(`Project ID (default: ${defaultId})`);
  if (!projectId) projectId = defaultId;

  log.info(`Using project: ${projectId}`);

  // Step 5: Select Project
  log.step('Step 5: Connect to Firebase Project');

  try {
    // First check if project exists
    log.info('Checking project access...');
    execSync(`firebase projects:list`, { stdio: 'pipe' });

    // Try to use the project
    try {
      execSync(`firebase use ${projectId}`, { stdio: 'inherit' });
      log.success(`Connected to project: ${projectId}`);
    } catch {
      log.warn(`Could not auto-connect. You may need to select manually.`);
      console.log(`
      Buka Firebase Console dan pastikan project "${projectId}" terlihat.
      `);
    }
  } catch {
    log.warn('Could not list Firebase projects');
  }

  // Step 6: Enable Services
  log.step('Step 6: Enable Firebase Services');

  console.log(`
  ${colors.yellow}
  ╔════════════════════════════════════════════════════════════════╗
  ║  MANUAL STEP: Enable Firebase Services                        ║
  ╚════════════════════════════════════════════════════════════════╝
  ${colors.reset}

  Buka: https://console.firebase.google.com/project/${projectId}
  `);

  const openServices = await question('Buka Firebase Console untuk enable services? (y/n)');
  if (openServices.toLowerCase() === 'y') {
    openUrl(`https://console.firebase.google.com/project/${projectId}`);
    log.info('Firebase Console should be opening...');
  }

  console.log(`
  Enable services berikut:

  1. ${colors.green}Authentication${colors.reset}
     - Klik "Authentication" → "Get started"
     - Tab "Sign-in method"
     - Klik "Email/Password" → Enable → Save

  2. ${colors.green}Firestore Database${colors.reset}
     - Klik "Firestore Database" → "Create database"
     - Location: asia-southeast1 (Jakarta)
     - Start in "test mode" → Enable
     - ⚠ Nanti kita update rules-nya

  3. ${colors.green}Storage${colors.reset}
     - Klik "Storage" → "Get started"
     - Start in "test mode" → Enable

  3b. ${colors.yellow}Storage (Optional - Berbayar)${colors.reset}
     - Skip untuk sekarang
     - Billing: Storage + egress fees
     - Ditambahkan nanti jika perlu upload files

  ${colors.green}Sudah selesai semua? Tekan Enter untuk lanjut${colors.reset}
  `);

  await question('');

  // Step 7: Register Web App
  log.step('Step 7: Register Web App');

  console.log(`
  ${colors.yellow}
  ╔════════════════════════════════════════════════════════════════╗
  ║  MANUAL STEP: Register Web App                                ║
  ╚════════════════════════════════════════════════════════════════╝
  ${colors.reset}

  Buka: https://console.firebase.google.com/project/${projectId}/settings/general
  `);

  const openSettings = await question('Buka Settings untuk register web app? (y/n)');
  if (openSettings.toLowerCase() === 'y') {
    openUrl(`https://console.firebase.google.com/project/${projectId}/settings/general`);
  }

  console.log(`
  Steps:
  1. Scroll ke "Your apps"
  2. Klik icon Web (</>)
  3. App nickname: Freelancer OS Web
  4. Check "Firebase Hosting" (optional)
  5. Register app

  ${colors.green}Sudah register? Tekan Enter untuk lanjut${colors.reset}
  `);

  await question('');

  // Step 8: Get Config Values
  log.step('Step 8: Masukkan Firebase Config Values');

  console.log(`
  Setelah register web app, akan muncul config values.
  Copy semua nilai dan paste di sini.

  Lokasi config:
  Firebase Console > Project Settings > General > Your apps > Web app
  `);

  const apiKey = await question('Firebase API Key (contoh: AIzaSy...)');
  const authDomain = await question('Auth Domain (contoh: xxx.firebaseapp.com)');
  const storageBucket = await question('Storage Bucket (contoh: xxx.appspot.com)');
  const messagingSenderId = await question('Messaging Sender ID (contoh: 123456789)');
  const appId = await question('App ID (contoh: 1:xxx:web:xxx)');

  if (!apiKey || !authDomain || !projectId || !appId) {
    log.error('Minimal perlu: apiKey, authDomain, projectId, appId');
    log.info('Coba lagi dengan: npm run setup:firebase');
    process.exit(1);
  }

  // Step 9: Create .env.local
  log.step('Step 9: Create .env.local');

  const envContent = `# Freelancer OS - Firebase Configuration
# Generated by setup-firebase.js on ${new Date().toISOString()}
# Project: ${projectId}

NEXT_PUBLIC_FIREBASE_API_KEY=${apiKey}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${authDomain}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${projectId}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${storageBucket || `${projectId}.appspot.com`}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${messagingSenderId || ''}
NEXT_PUBLIC_FIREBASE_APP_ID=${appId}
`;

  const envPath = path.join(__dirname, '..', '.env.local');
  fs.writeFileSync(envPath, envContent);
  log.success(`.env.local created at: ${envPath}`);

  // Step 10: Deploy Firestore Rules
  log.step('Step 10: Deploy Firestore Rules');

  const rulesFile = path.join(__dirname, '..', 'firestore.rules');
  if (fs.existsSync(rulesFile)) {
    log.info('Deploying Firestore security rules...');
    try {
      execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });
      log.success('Firestore rules deployed!');
    } catch {
      log.warn('Could not deploy rules. Deploy manual: firebase deploy --only firestore:rules');
    }
  } else {
    log.warn('firestore.rules not found. Create it manually.');
  }

  // Step 11: Create sample licenses
  log.step('Step 11: Sample License Keys');

  console.log(`
  ${colors.green}
  Sample License Keys untuk Testing:
  ${colors.reset}

  Tambahkan ke Firestore (Firebase Console > Firestore > licenses):

  Document 1:
  - key: FOS-PRO-DEMO-TEST
  - type: pro
  - status: available

  Document 2:
  - key: FOS-AGENCY-DEMO-TEST
  - type: agency
  - status: available
  `);

  const addToFirestore = await question('Buka Firestore Console untuk add licenses? (y/n)');
  if (addToFirestore.toLowerCase() === 'y') {
    openUrl(`https://console.firebase.google.com/project/${projectId}/firestore`);
  }

  // Summary
  console.log(`
${colors.green}
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     ✅ Setup Complete!                                        ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
${colors.reset}

📋 Yang Sudah Dilakukan:

1. ✅ Login Firebase
2. ✅ Connect ke project: ${projectId}
3. ⚠ Enable services (manual di Console)
4. ⚠ Register web app (manual di Console)
5. ✅ Created .env.local
6. ⚠ Deploy rules (coba otomatis atau manual)

📋 Next Steps:

1. ${colors.green}Enable services di Firebase Console${colors.reset}
   https://console.firebase.google.com/project/${projectId}

2. ${colors.green}Deploy Firestore rules${colors.reset}
   firebase deploy --only firestore:rules

3. ${colors.green}Test setup${colors.reset}
   npm run dev

4. ${colors.green}Deploy to Vercel${colors.reset}
   vercel deploy --prod

5. ${colors.green}Add Vercel URL ke Firebase Authorized Domains${colors.reset}
   Firebase Console > Authentication > Authorized domains
   Add: your-app.vercel.app

  `);

  // Ask to start dev server
  const startDev = await question('Jalankan npm run dev sekarang? (y/n)');
  if (startDev.toLowerCase() === 'y') {
    log.info('Starting dev server...');
    execSync('npm run dev', { stdio: 'inherit' });
  }
}

main().catch((error) => {
  log.error(`Error: ${error.message}`);
  process.exit(1);
});
