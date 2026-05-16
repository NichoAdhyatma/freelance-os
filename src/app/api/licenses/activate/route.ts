import { NextResponse } from 'next/server';

import { getAdminDb } from '@/lib/firebase/admin';
import { LICENSE_KEY_REGEX, PLAN_FROM_LICENSE } from '@/lib/firebase/constants';
import { type LicensePlan } from '@/lib/firebase/constants';

async function verifyToken(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const { getAdminAuth } = await import('@/lib/firebase/admin');
    const auth = getAdminAuth();
    return await auth.verifyIdToken(authHeader.slice(7));
  } catch {
    return null;
  }
}

async function findLicenseByKey(normalizedKey: string): Promise<any | null> {
  const db = getAdminDb();

  const snapshot = await db.collection('licenses').where('key', '==', normalizedKey).get();

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  return null;
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const decodedToken = await verifyToken(authHeader);

  if (!decodedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const uid = decodedToken.uid;

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

  // Validate format
  const normalizedKey = licenseKey.toUpperCase().replace(/\s/g, '');
  if (!LICENSE_KEY_REGEX.test(normalizedKey)) {
    return NextResponse.json(
      { valid: false, message: 'Invalid license key format.' },
      { status: 400 },
    );
  }

  // Find and validate license
  const license = await findLicenseByKey(normalizedKey);

  if (!license) {
    return NextResponse.json({ valid: false, message: 'License key not found.' }, { status: 404 });
  }

  const status = license.status as string;
  if (status === 'revoked' || status === 'expired') {
    return NextResponse.json(
      { valid: false, message: `This license has been ${status}.` },
      { status: 403 },
    );
  }
  if (status === 'activated') {
    return NextResponse.json(
      { valid: false, message: 'This license has already been activated.' },
      { status: 409 },
    );
  }

  // Determine plan
  const licenseType = license.type as string;
  const plan: LicensePlan = PLAN_FROM_LICENSE[licenseType.toUpperCase()] ?? 'pro';

  // Activate license
  const db = getAdminDb();
  await db.collection('licenses').doc(license.id).update({
    status: 'activated',
    activatedBy: uid,
    activatedAt: new Date(),
  });

  // Update user profile
  await db.collection('users').doc(uid).set(
    {
      licenseKey: normalizedKey,
      licenseStatus: 'active',
      plan,
      updatedAt: new Date(),
    },
    { merge: true },
  );

  return NextResponse.json({
    valid: true,
    message: 'License activated successfully!',
    plan,
  });
}
