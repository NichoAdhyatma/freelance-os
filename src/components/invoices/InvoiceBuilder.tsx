'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { CalendarIcon, Check, ChevronDown, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineItemsEditor } from './LineItemsEditor';
import { InvoicePreview } from './InvoicePreview';
import { useClients } from '@/hooks/useClients';
import { useInvoices } from '@/hooks/useInvoices';
import { cn } from '@/lib/utils';
import type { InvoiceFormData, InvoiceItem, InvoiceStatus } from '@/types/invoice';
import { downloadInvoicePDF } from '@/lib/pdf/downloadInvoicePDF';

const DEFAULT_DUE_DATE = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `INV-${year}-${rand}`;
}

export function InvoiceBuilder() {
  const router = useRouter();
  const { clients } = useClients();
  const { add } = useInvoices();

  const [invoiceNumber] = useState(() => generateInvoiceNumber());
  const [clientId, setClientId] = useState('');
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);
  const [dueDate, setDueDate] = useState<Date>(DEFAULT_DUE_DATE);
  const [status, setStatus] = useState<InvoiceStatus>('draft');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unitPrice: 0, total: 0 },
  ]);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [saving, setSaving] = useState(false);

  const selectedClient = clients.find((c) => c.id === clientId);
  const grandTotal = items.reduce((sum, item) => sum + item.total, 0) + tax - discount;

  const validate = () => {
    if (!clientId.trim()) { toast.error('Pilih client terlebih dahulu'); return false; }
    const hasItems = items.some((item) => item.description.trim());
    if (!hasItems) { toast.error('Tambahkan minimal 1 item dengan deskripsi'); return false; }
    return true;
  };

  const buildFormData = (overrideStatus?: InvoiceStatus): InvoiceFormData => ({
    clientId: clientId.trim(),
    amount: grandTotal,
    tax,
    discount,
    dueDate,
    notes: notes.trim() || undefined,
    items: items.filter((item) => item.description.trim()),
    status: overrideStatus ?? status,
  });

  const handleSave = async (saveStatus: 'draft' | 'sent') => {
    if (!validate()) return;
    setSaving(true);
    try {
      const data = buildFormData(saveStatus);
      await add(data);
      toast.success(`Invoice ${saveStatus === 'draft' ? 'disimpan' : 'dikirim'}`);
      router.push('/dashboard/finance');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan invoice');
    } finally {
      setSaving(false);
    }
  };

  // Build a mock invoice for PDF preview (without Firestore id/timestamps)
  const mockInvoice = {
    id: 'preview',
    invoiceNumber,
    clientId,
    amount: grandTotal,
    tax,
    discount,
    status: status as InvoiceStatus,
    dueDate: { toDate: () => dueDate } as any,
    notes: notes || undefined,
    items: items.filter((item) => item.description.trim()),
    createdAt: { toDate: () => new Date() } as any,
    updatedAt: { toDate: () => new Date() } as any,
  };

  const handleDownloadPDF = async () => {
    if (!clientId) { toast.error('Pilih client terlebih dahulu'); return; }
    try {
      await downloadInvoicePDF({
        invoice: mockInvoice as any,
        client: selectedClient ?? null,
        projectTitle: undefined,
      });
      toast.success('PDF downloaded');
    } catch {
      toast.error('Gagal generate PDF');
    }
  };

  const handleSendWhatsApp = () => {
    if (!selectedClient) { toast.error('Pilih client terlebih dahulu'); return; }
    if (!selectedClient.whatsapp) { toast.error('Client ini belum memiliki nomor WhatsApp'); return; }
    const waNumber = selectedClient.whatsapp.replace(/\D/g, '');
    const message = `Halo ${selectedClient.name}!\n\nBerikut invoice untuk pekerjaan yang telah diselesaikan:\n\n📄 *${invoiceNumber}*\n💰 *Total: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(grandTotal)}*\n📅 *Jatuh Tempo: ${format(dueDate, 'dd MMMM yyyy', { locale: id })}*\n\nMohon melakukan pembayaran sebelum jatuh tempo.\n\n—\nDikirim via Freelancer OS`;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="flex h-full gap-6">
      {/* Panel 1: Meta */}
      <div className="w-72 shrink-0 flex flex-col gap-5 overflow-y-auto">
        <div className="space-y-1.5">
          <Label className="text-xs text-[var(--text-tertiary)]">Invoice Number</Label>
          <Input value={invoiceNumber} readOnly className="font-mono text-sm bg-[var(--surface-base)]" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-[var(--text-tertiary)]">Client *</Label>
          <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                role="combobox"
                className={cn(
                  'w-full flex items-center justify-start h-10 px-3 rounded-md border border-input bg-background text-sm cursor-pointer hover:bg-muted transition-colors text-left',
                  !clientId && 'text-muted-foreground',
                )}
              >
                <User className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate flex-1">
                  {clientId ? (selectedClient?.name ?? 'Select client') : 'Select client'}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-auto" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
              <Command>
                <CommandInput placeholder="Search clients..." autoFocus />
                <CommandList>
                  <CommandEmpty>{clients.length === 0 ? 'No clients yet.' : 'No client found.'}</CommandEmpty>
                  <CommandGroup>
                    {clients.map((client) => (
                      <CommandItem
                        key={client.id}
                        value={client.id}
                        onSelect={() => { setClientId(client.id); setClientPopoverOpen(false); }}
                        className="flex items-center gap-2"
                      >
                        <Check className={cn('h-4 w-4 shrink-0', clientId === client.id ? 'opacity-100' : 'opacity-0')} />
                        <span className="truncate">{client.name}{client.company && <span className="text-muted-foreground ml-1 text-xs">· {client.company}</span>}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-[var(--text-tertiary)]">Due Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-full flex items-center h-10 px-3 rounded-md border border-input bg-background text-sm cursor-pointer hover:bg-muted transition-colors text-left">
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                {format(dueDate, 'dd MMM yyyy', { locale: id })}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dueDate} onSelect={(d) => d && setDueDate(d)} />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-[var(--text-tertiary)]">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as InvoiceStatus)}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 flex-1">
          <Label className="text-xs text-[var(--text-tertiary)]">Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Payment terms, bank details, etc."
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Save buttons */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border-default)]">
          <Button onClick={() => handleSave('draft')} disabled={saving} size="sm" className="w-full">
            {saving ? 'Saving...' : 'Save as Draft'}
          </Button>
          <Button onClick={() => handleSave('sent')} disabled={saving} variant="outline" size="sm" className="w-full">
            Mark as Sent
          </Button>
        </div>
      </div>

      {/* Panel 2: Line Items */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Line Items</h3>
          <span className="text-xs text-[var(--text-tertiary)]">{items.length} item{items.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex-1 overflow-y-auto pr-1">
          <LineItemsEditor
            items={items}
            onChange={setItems}
            tax={tax}
            discount={discount}
            onTaxChange={setTax}
            onDiscountChange={setDiscount}
          />
        </div>
      </div>

      {/* Panel 3: Preview */}
      <div className="w-80 shrink-0 flex flex-col overflow-hidden">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Preview</h3>
        <div className="flex-1 overflow-hidden">
          <InvoicePreview
            invoiceNumber={invoiceNumber}
            clientName={selectedClient?.name ?? ''}
            clientCompany={selectedClient?.company}
            dueDate={dueDate}
            status={status}
            items={items}
            tax={tax}
            discount={discount}
            notes={notes}
            onDownloadPDF={handleDownloadPDF}
            onSendWhatsApp={handleSendWhatsApp}
          />
        </div>
      </div>
    </div>
  );
}
