'use client';

import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { updateClient } from '@/lib/services/clientService';
import {
  createInvoice,
  deleteInvoice,
  subscribeToInvoices,
  updateInvoice,
} from '@/lib/services/invoiceService';
import { type Invoice, type InvoiceFormData, type InvoiceStatus } from '@/types/invoice';

export function useInvoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setInvoices([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToInvoices((list) => {
      setInvoices(list);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const add = useCallback(async (data: InvoiceFormData) => {
    await createInvoice(data);
  }, []);

  const edit = useCallback(
    async (
      id: string,
      data: Partial<InvoiceFormData & { status?: InvoiceStatus; amountPaid?: number }>,
    ) => {
      await updateInvoice(id, data);
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    await deleteInvoice(id);
  }, []);

  const markPaid = useCallback(
    async (id: string, amount: number) => {
      await updateInvoice(id, { status: 'paid', amountPaid: amount });

      // Sync client totalRevenue after marking paid — fire and forget
      const invoice = invoices.find((inv) => inv.id === id);
      if (invoice?.clientId) {
        const paidInvoices = invoices.filter(
          (inv) => inv.clientId === invoice.clientId && inv.status === 'paid',
        );
        const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (inv.amount ?? 0), 0);
        updateClient(invoice.clientId, { totalRevenue }).catch(() => {});
      }
    },
    [invoices],
  );

  const byStatus = useCallback(
    (status: InvoiceStatus) => {
      return invoices.filter((i) => i.status === status);
    },
    [invoices],
  );

  return { invoices, loading, add, edit, remove, markPaid, byStatus, total: invoices.length };
}
