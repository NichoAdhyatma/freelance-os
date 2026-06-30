'use client';

import { setDashboardTitle } from '@/app/dashboard/_context';
import { InvoiceBuilder } from '@/components/invoices/InvoiceBuilder';

export default function InvoiceBuilderPage() {
  setDashboardTitle('New Invoice');

  return (
    <div className="h-full">
      <InvoiceBuilder />
    </div>
  );
}
