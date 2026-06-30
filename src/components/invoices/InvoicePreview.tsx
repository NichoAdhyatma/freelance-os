'use client';

import { Download, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatIDR } from '@/lib/utils';
import { INVOICE_STATUS_CONFIG, INVOICE_STATUS_LABELS } from '@/lib/tokens';
import { getStatusStyle } from '@/lib/tokens';
import type { InvoiceItem } from '@/types/invoice';

interface InvoicePreviewProps {
  invoiceNumber: string;
  clientName: string;
  clientCompany?: string;
  dueDate: Date;
  status: string;
  items: InvoiceItem[];
  tax: number;
  discount: number;
  notes?: string;
  userName?: string;
  onDownloadPDF?: () => void;
  onSendWhatsApp?: () => void;
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const style = getStatusStyle(INVOICE_STATUS_CONFIG, status);
  const label = INVOICE_STATUS_LABELS[status as keyof typeof INVOICE_STATUS_LABELS] ?? status;
  return (
    <span
      style={{
        color: style.style?.color,
        background: style.style?.background,
        borderColor: style.style?.borderColor,
      }}
      className="inline-flex h-fit w-fit items-center rounded-4xl border px-2 py-0.5 text-xs"
    >
      <Badge variant="outline" className="bg-transparent border-0 p-0 font-medium">
        {label}
      </Badge>
    </span>
  );
}

export function InvoicePreview({
  invoiceNumber,
  clientName,
  clientCompany,
  dueDate,
  status,
  items,
  tax,
  discount,
  notes,
  userName,
  onDownloadPDF,
  onSendWhatsApp,
}: InvoicePreviewProps) {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const grandTotal = subtotal + tax - discount;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Preview card */}
      <div className="flex-1 overflow-auto">
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          {/* Invoice Header */}
          <div className="bg-stone-50 border-b border-stone-200 px-8 py-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-stone-800 tracking-tight">INVOICE</h2>
                <p className="text-stone-500 text-sm mt-0.5 font-mono">{invoiceNumber}</p>
              </div>
              <InvoiceStatusBadge status={status} />
            </div>
          </div>

          {/* Meta */}
          <div className="px-8 py-6 grid grid-cols-2 gap-6 border-b border-stone-100">
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">From</p>
              <p className="text-sm font-semibold text-stone-800">Freelancer OS</p>
              {userName && <p className="text-xs text-stone-500">{userName}</p>}
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Bill To</p>
              <p className="text-sm font-semibold text-stone-800">
                {clientName || <span className="text-stone-300 italic">Select client</span>}
              </p>
              {clientCompany && <p className="text-xs text-stone-500">{clientCompany}</p>}
            </div>
          </div>

          {/* Due Date */}
          <div className="px-8 py-4 border-b border-stone-100">
            <p className="text-xs text-stone-400">
              <span className="font-medium text-stone-500">Due Date:</span>{' '}
              <span className="text-stone-700">{format(dueDate, 'dd MMMM yyyy', { locale: id })}</span>
            </p>
          </div>

          {/* Line Items */}
          <div className="px-8 py-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left py-2 font-semibold text-stone-600 text-xs">Description</th>
                  <th className="text-right py-2 font-semibold text-stone-600 text-xs w-16">Qty</th>
                  <th className="text-right py-2 font-semibold text-stone-600 text-xs w-28">Price</th>
                  <th className="text-right py-2 font-semibold text-stone-600 text-xs w-28">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-stone-300 italic text-sm">
                      No items yet
                    </td>
                  </tr>
                ) : (
                  items.map((item, i) => (
                    <tr key={i} className="border-b border-stone-100 last:border-0">
                      <td className="py-2.5 text-stone-700">
                        {item.description || <span className="text-stone-300 italic">Untitled item</span>}
                      </td>
                      <td className="py-2.5 text-right text-stone-600 tabular-nums">{item.quantity}</td>
                      <td className="py-2.5 text-right text-stone-600 tabular-nums">{formatIDR(item.unitPrice)}</td>
                      <td className="py-2.5 text-right text-stone-800 font-medium tabular-nums">{formatIDR(item.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="px-8 pb-6">
            <div className="ml-auto w-56 flex flex-col gap-2">
              <div className="flex justify-between text-sm text-stone-500">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatIDR(subtotal)}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between text-sm text-stone-500">
                  <span>Tax</span>
                  <span className="tabular-nums">+ {formatIDR(tax)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-sm text-stone-500">
                  <span>Discount</span>
                  <span className="tabular-nums">- {formatIDR(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-stone-900 border-t border-stone-200 pt-2 mt-1">
                <span>Total</span>
                <span className="tabular-nums">{formatIDR(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {notes && (
            <div className="px-8 pb-6">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Notes</p>
              <p className="text-xs text-stone-500 leading-relaxed">{notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onDownloadPDF}
          disabled={!invoiceNumber}
        >
          <Download className="h-4 w-4 mr-1.5" />
          Download PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onSendWhatsApp}
          disabled={!clientName}
        >
          <MessageCircle className="h-4 w-4 mr-1.5" />
          WhatsApp
        </Button>
      </div>
    </div>
  );
}
