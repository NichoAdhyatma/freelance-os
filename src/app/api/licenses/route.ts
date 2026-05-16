import { NextResponse } from 'next/server';

import { getAdminDb } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  const secret = request.headers.get('x-admin-secret');
  if (secret !== (process.env.ADMIN_SECRET || 'freelancer-os-admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { keys } = await request.json();
  if (!Array.isArray(keys) || keys.length === 0) {
    return NextResponse.json({ error: 'No keys provided' }, { status: 400 });
  }

  const db = getAdminDb();
  const results = [];

  for (const { key, type } of keys) {
    try {
      const normalizedKey = key.toUpperCase().replace(/\s/g, '');
      const docId = normalizedKey.replace(/[^A-Z0-9]/gi, '').toLowerCase();
      const licenseData = {
        key: normalizedKey,
        type: type || 'pro',
        status: 'available',
        createdAt: new Date(),
      };
      await db.collection('licenses').doc(docId).set(licenseData);
      results.push({ key, status: 'created', id: docId });
    } catch (err: any) {
      results.push({ key, status: 'error', message: err.message });
    }
  }

  return NextResponse.json({ results });
}
