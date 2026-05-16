# Freelancer OS

Modern SaaS platform untuk freelancers, creators, dan agency kecil. Kelola projects, clients, invoices, dan revenue dalam satu workspace berbasis web.

## ✨ Features

- **Dashboard** - Revenue overview, active projects, deadline alerts, productivity insights
- **Project Management** - Kanban board, timeline, progress tracking, priority system
- **Client CRM** - Contact database, activity history, revenue per client
- **Finance** - Invoice management, payment tracking, revenue analytics
- **License System** - Anti-piracy protection dengan license key activation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Firebase account
- npm atau yarn

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/freelancer-os
cd freelance-os

# Install dependencies
npm install

# Setup Firebase (sekali untuk developer)
npm run setup:firebase

# Run development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## 🔥 Firebase Setup (Developer Only)

### Setup Script

Jalankan setup script untuk configure Firebase project:

```bash
npm run setup:firebase
```

Script ini akan:

1. Login ke Firebase
2. Create/select Firebase project
3. Enable Authentication, Firestore, Storage
4. Deploy Firestore security rules
5. Generate `.env.local` dengan config values
6. Create sample license keys

### Manual Setup (Alternative)

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Create project baru
3. Enable **Authentication** (Email/Password)
4. Create **Firestore Database**
5. Enable **Storage**
6. Register Web App
7. Copy config ke `.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

## 🎫 License Key System

### Generate License Keys

```bash
# Generate pro license keys
npm run generate:licenses -- --type=pro --count=10

# Generate agency license keys
npm run generate:licenses -- --type=agency --count=5

# List all licenses
npm run generate:licenses -- list
```

### License Format

```
FOS-{TYPE}-{XXXX}-{XXXX}
Example: FOS-PRO-AB12-CD34
```

Types:

- `FREE` - Free plan (limited features)
- `PRO` - Professional plan (full features)
- `AGENCY` - Agency plan (team features)

### Add License Keys to Firestore

1. Buka Firebase Console → Firestore
2. Create collection: `licenses`
3. Add document untuk setiap license key:

```json
{
  "key": "FOS-PRO-AB12-CD34",
  "type": "pro",
  "status": "available",
  "createdAt": timestamp
}
```

## 📁 Project Structure

```
freelance-os/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Landing page
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   ├── activate/          # License activation page
│   │   └── dashboard/         # Protected dashboard
│   ├── components/            # UI Components
│   │   ├── ui/               # shadcn/ui components
│   │   └── shared/           # Sidebar, Header, etc.
│   ├── features/             # Feature modules
│   │   ├── auth/             # Authentication
│   │   └── license/          # License system
│   ├── lib/                  # Utilities
│   │   └── firebase/         # Firebase configuration
│   └── types/                # TypeScript definitions
├── scripts/                  # Development scripts
│   ├── setup-firebase.js    # Firebase setup script
│   └── generate-licenses.js  # License key generator
├── firestore.rules           # Firestore security rules
└── .env.local                # Environment variables
```

## 🚢 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel deploy --prod
```

### Environment Variables di Vercel

Set environment variables di **Vercel Dashboard → Project Settings → Environment Variables**:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Firebase Authorized Domains

Setelah deploy, tambahkan Vercel URL ke Firebase:

1. Firebase Console → Project Settings → Authentication
2. Scroll ke **Authorized domains**
3. Add: `your-app.vercel.app`

## 🛠 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Firebase (Auth, Firestore, Storage)
- **Hosting:** Vercel
- **Icons:** Lucide React

## 📝 License

This project is proprietary software. View [CLAUDE.md](./CLAUDE.md) for full documentation.

## 🤝 Support

- Documentation: [CLAUDE.md](./CLAUDE.md)
- Setup Guide: [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
