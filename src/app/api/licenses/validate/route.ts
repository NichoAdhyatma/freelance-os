import { NextResponse } from 'next/server';

import { getAdminDb } from '@/lib/firebase/admin';
import { LICENSE_KEY_REGEX } from '@/lib/firebase/constants';

async function findLicenseByKey(normalizedKey: string): Promise<any | null> {
  const db = getAdminDb();
  const licensesRef = db.collection('licenses');
  const snapshot = await licensesRef.where('key', '==', normalizedKey).limit(1).get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

export async function POST(request: Request) {
  let body: { licenseKey?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { licenseKey } = body;

  if (!licenseKey) {
    return NextResponse.json({ error: 'licenseKey is required' }, { status: 400 });
  }

  const normalizedKey = licenseKey.toUpperCase().replace(/\s/g, '');
  if (!LICENSE_KEY_REGEX.test(normalizedKey)) {
    return NextResponse.json({ valid: false, message: 'Invalid license key format.' });
  }

  try {
    const license = await findLicenseByKey(normalizedKey);

    if (!license) {
      return NextResponse.json({ valid: false, message: 'License key not found.' });
    }

    const status = license.status as string;
    if (status === 'revoked' || status === 'expired') {
      return NextResponse.json({ valid: false, message: `This license has been ${status}.` });
    }
    if (status === 'activated') {
      return NextResponse.json({ valid: false, message: 'This license has already been activated.' });
    }

    return NextResponse.json({
      valid: true,
      message: 'License key is valid.',
      license: { id: license.id, type: license.type },
    });
  } catch (error: any) {
    console.error('License validation error:', error);
    return NextResponse.json({ valid: false, message: `Server error: ${error?.message || 'Unknown error'}` }, { status: 500 });
  }
}
