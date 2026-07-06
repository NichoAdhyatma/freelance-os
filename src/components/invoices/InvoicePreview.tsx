'use client';

import { Download, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { formatIDR } from '@/lib/utils';
import { INVOICE_STATUS_CONFIG, INVOICE_STATUS_LABELS } from '@/lib/tokens';
import { getStatusStyle } from '@/lib/tokens';
import type { InvoiceItem } from '@/types/invoice';
import type { BankDetails } from '@/types/user';

interface InvoicePreviewProps {
  invoiceNumber: string;
  clientName: string;
  clientCompany?: string;
  clientEmail?: string;
  clientWhatsapp?: string;
  dueDate: Date;
  issueDate?: Date;
  status: string;
  items: InvoiceItem[];
  tax: number;
  discount: number;
  notes?: string;
  terms?: string;
  userName?: string;
  userCompany?: string;
  userPhone?: string;
  userAddress?: string;
  userLogo?: string;
  bankDetails?: BankDetails;
  onDownloadPDF?: () => void;
  onSendWhatsApp?: () => void;
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const style = getStatusStyle(INVOICE_STATUS_CONFIG, status);
  const label = INVOICE_STATUS_LABELS[status as keyof typeof INVOICE_STATUS_LABELS] ?? status;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
      style={{
        color: style.style?.color,
        background: style.style?.background,
        borderColor: style.style?.borderColor,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: style.style?.color }}
      />
      {label}
    </span>
  );
}

export function InvoicePreview({
  invoiceNumber,
  clientName,
  clientCompany,
  clientEmail,
  clientWhatsapp,
  dueDate,
  issueDate = new Date(),
  status,
  items,
  tax,
  discount,
  notes,
  terms,
  userName,
  userCompany,
  userPhone,
  userAddress,
  userLogo,
  bankDetails,
  onDownloadPDF,
  onSendWhatsApp,
}: InvoicePreviewProps) {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const grandTotal = subtotal + tax - discount;
  const isDraft = status === 'draft';

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Preview card */}
      <div className="flex-1 overflow-auto">
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden relative">
          {/* Draft Watermark */}
          {isDraft && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10">
              <span
                className="text-[120px] font-black text-stone-900/5 rotate-[-30deg] whitespace-nowrap uppercase tracking-widest"
              >
                DRAFT
              </span>
            </div>
          )}

          {/* Invoice Header */}
          <div className="bg-white border-b-2 border-stone-200 px-8 py-7 relative z-20">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-bold text-stone-800 tracking-tight">INVOICE</h2>
                <p className="text-stone-500 text-sm mt-1 font-mono">{invoiceNumber}</p>
              </div>
              <div className="flex items-center gap-3">
                <InvoiceStatusBadge status={status} />
                {userLogo && (
                  <img
                    src={userLogo}
                    alt="Logo"
                    className="h-12 w-auto object-contain"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Meta - From / Bill To */}
          <div className="px-8 py-6 grid grid-cols-2 gap-8 bg-stone-50 border-b border-stone-100 relative z-20">
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">From</p>
              <p className="text-sm font-bold text-stone-800">{userCompany || 'Freelancer OS'}</p>
              {userName && <p className="text-xs text-stone-500 mt-0.5">{userName}</p>}
              {userPhone && <p className="text-xs text-stone-500 mt-0.5">{userPhone}</p>}
              {userAddress && <p className="text-xs text-stone-500 mt-0.5">{userAddress}</p>}
            </div>
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Bill To</p>
              <p className="text-sm font-bold text-stone-800">
                {clientName || <span className="text-stone-300 italic">Select client</span>}
              </p>
              {clientCompany && <p className="text-xs text-stone-500 mt-0.5">{clientCompany}</p>}
              {clientEmail && <p className="text-xs text-stone-500 mt-0.5">{clientEmail}</p>}
              {clientWhatsapp && <p className="text-xs text-stone-500 mt-0.5">{clientWhatsapp}</p>}
            </div>
          </div>

          {/* Dates */}
          <div className="px-8 py-3.5 border-b border-stone-100 grid grid-cols-2 gap-8 relative z-20">
            <div>
              <p className="text-sm text-stone-600">
                <span className="font-semibold text-stone-800">Tanggal Terbit:</span>{' '}
                <span className="text-stone-700">{format(issueDate, 'dd MMMM yyyy', { locale: id })}</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-stone-600">
                <span className="font-semibold text-stone-800">Jatuh Tempo:</span>{' '}
                <span className="text-stone-700">{format(dueDate, 'dd MMMM yyyy', { locale: id })}</span>
              </p>
            </div>
          </div>

          {/* Line Items */}
          <div className="px-8 relative z-20">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-stone-200">
                  <th className="text-left py-3 font-bold text-stone-500 text-[10px] uppercase tracking-wider">Deskripsi</th>
                  <th className="text-center py-3 font-bold text-stone-500 text-[10px] uppercase tracking-wider w-16">Qty</th>
                  <th className="text-right py-3 font-bold text-stone-500 text-[10px] uppercase tracking-wider w-28">Harga</th>
                  <th className="text-right py-3 font-bold text-stone-500 text-[10px] uppercase tracking-wider w-28">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-stone-300 italic">
                      No items yet
                    </td>
                  </tr>
                ) : (
                  items.map((item, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}>
                      <td className="py-3 text-stone-700">
                        {item.description || <span className="text-stone-300 italic">Untitled item</span>}
                      </td>
                      <td className="py-3 text-center text-stone-500 tabular-nums">{item.quantity}</td>
                      <td className="py-3 text-right text-stone-500 tabular-nums">{formatIDR(item.unitPrice)}</td>
                      <td className="py-3 text-right font-semibold text-stone-800 tabular-nums">{formatIDR(item.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="px-8 py-6 relative z-20">
            <div className="ml-auto w-60 flex flex-col gap-2">
              <div className="flex justify-between text-sm text-stone-500 py-1">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatIDR(subtotal)}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between text-sm text-stone-500 py-1">
                  <span>Pajak (Tax)</span>
                  <span className="tabular-nums">+ {formatIDR(tax)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-sm text-stone-500 py-1">
                  <span>Diskon (Discount)</span>
                  <span className="tabular-nums text-green-600">- {formatIDR(discount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center bg-stone-900 text-white rounded-lg px-4 py-3 mt-2">
                <span className="text-xs font-bold uppercase tracking-wide">Total</span>
                <span className="text-lg font-bold tabular-nums">{formatIDR(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          {bankDetails?.bankName && (
            <div className="px-8 pb-6 relative z-20">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Informasi Pembayaran</p>
              <div className="bg-stone-50 rounded-lg p-3 flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-500">Bank</span>
                  <span className="font-semibold text-stone-800">{bankDetails.bankName}</span>
                </div>
                {bankDetails.accountName && (
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-500">Nama Rekening</span>
                    <span className="font-semibold text-stone-800">{bankDetails.accountName}</span>
                  </div>
                )}
                {bankDetails.accountNumber && (
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-500">Nomor Rekening</span>
                    <span className="font-bold text-stone-800 font-mono tracking-wide">{bankDetails.accountNumber}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {notes && (
            <div className="px-8 pb-6 relative z-20">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Catatan</p>
              <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 rounded-lg px-4 py-3 border-l-2 border-stone-900">
                {notes}
              </p>
            </div>
          )}

          {/* Terms */}
          {terms && (
            <div className="px-8 pb-6 relative z-20">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Syarat & Ketentuan</p>
              <p className="text-xs text-stone-500 leading-relaxed bg-stone-50 rounded-lg px-4 py-3">
                {terms}
              </p>
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
