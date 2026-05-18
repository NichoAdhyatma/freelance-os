'use client';

import { ArrowLeft, Download, Edit, Share2, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { InvoicePDFTemplate } from '@/components/invoices/InvoicePDFTemplate';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/DataTableSkeleton';
import { useClients } from '@/hooks/useClients';
import { useInvoices } from '@/hooks/useInvoices';
import { useProjects } from '@/hooks/useProjects';
import { getInvoice } from '@/lib/services/invoiceService';
import { formatIDR } from '@/lib/utils';
import type { Invoice } from '@/types/invoice';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const STATUS_COLORS: Record<string, string> = {
  paid: '#16a34a', sent: '#2563eb', pending: '#d97706',
  draft: '#6b7280', overdue: '#dc2626', cancelled: '#9ca3af',
};

const STATUS_LABELS: Record<string, string> = {
  paid: 'Lunas', sent: 'Terkirim', pending: 'Menunggu',
  draft: 'Draft', overdue: 'Jatuh Tempo', cancelled: 'Batal',
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const { clients } = useClients();
  const { projects } = useProjects();
  const { remove } = useInvoices();

  useEffect(() => {
    if (!invoiceId) return;
    getInvoice(invoiceId)
      .then((inv) => {
        if (!inv) { toast.error('Invoice not found'); router.push('/dashboard/finance'); return; }
        setInvoice(inv);
      })
      .catch((err) => { toast.error(err instanceof Error ? err.message : 'Failed to load'); router.push('/dashboard/finance'); })
      .finally(() => setLoading(false));
  }, [invoiceId, router]);

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    setDownloading(true);
    try {
      const element = document.getElementById('invoice-pdf-template');
      if (!element) { toast.error('Template not found'); return; }
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false, backgroundColor: '#fafaf9' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgW = canvas.width; const imgH = canvas.height;
      const ratio = Math.min(pdfWidth / imgW, pdfHeight / imgH);
      pdf.addImage(imgData, 'PNG', 0, 0, imgW * ratio, imgH * ratio);
      pdf.save(`${invoice.invoiceNumber}.pdf`);
      toast.success('PDF downloaded');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!invoice) return;
    if (!confirm(`Hapus invoice ${invoice.invoiceNumber}? Tindakan ini tidak bisa dibatalkan.`)) return;
    try { await remove(invoice.id); toast.success('Invoice dihapus'); router.push('/dashboard/finance'); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Gagal hapus invoice'); }
  };

  const handleSendWhatsApp = async () => {
    if (!invoice || !client) {
      toast.error('Client tidak ditemukan. Pastikan invoice sudah punya client.');
      return;
    }
    if (!client.whatsapp) {
      toast.error('Client ini belum memiliki nomor WhatsApp.');
      return;
    }

    const waNumber = client.whatsapp.replace(/\D/g, '');

    const dueDate = invoice.dueDate.toDate();
    const total = (invoice.amount ?? 0) + (invoice.tax ?? 0) - (invoice.discount ?? 0);

    const message = `Halo ${client.name}! 👋

Berikut invoice untuk pekerjaan yang telah diselesaikan:

📄 *${invoice.invoiceNumber}*
🏢 *${client.company || ''}*
💰 *Total: ${formatIDR(total)}*
📅 *Jatuh Tempo: ${format(dueDate, 'dd MMMM yyyy', { locale: id })}*

Mohon melakukan pembayaran sebelum jatuh tempo. Terima kasih atas kepercayaan nya! 🙏

—
Dikirim via Freelancer OS`;

    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) return <PageSkeleton />;
  if (!invoice) return null;

  const client = invoice.clientId ? clients.find((c) => c.id === invoice.clientId) : null;
  const project = invoice.projectId ? projects.find((p) => p.id === invoice.projectId) : null;

  const subtotal = invoice.amount ?? 0;
  const tax = invoice.tax ?? 0;
  const discount = invoice.discount ?? 0;
  const total = subtotal + tax - discount;
  const statusColor = STATUS_COLORS[invoice.status] ?? STATUS_COLORS.draft;

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>

      {/* ── Top bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '28px',
        gap: '12px',
      }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/finance')}
          style={{ gap: '8px', color: '#78716c' }}
        >
          <ArrowLeft style={{ width: '16px', height: '16px' }} />
          <span style={{ fontSize: '13px' }}>Kembali</span>
        </Button>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            style={{
              borderColor: '#fca5a5',
              color: '#dc2626',
              background: 'transparent',
              fontSize: '12px',
              gap: '6px',
            }}
          >
            <Trash2 style={{ width: '14px', height: '14px' }} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            style={{ fontSize: '12px', gap: '6px', borderColor: '#d6d3d1', color: '#57534e' }}
          >
            <Edit style={{ width: '14px', height: '14px' }} />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendWhatsApp}
            style={{ fontSize: '12px', gap: '6px', borderColor: '#25D366', color: '#25D366', background: 'transparent' }}
          >
            <Share2 style={{ width: '14px', height: '14px' }} />
            Kirim WA
          </Button>
          <Button
            onClick={handleDownloadPDF}
            disabled={downloading}
            style={{
              background: '#1c1917',
              color: '#fafaf9',
              border: 'none',
              fontSize: '12px',
              fontWeight: '600',
              gap: '6px',
              padding: '0 16px',
              height: '34px',
              borderRadius: '6px',
            }}
          >
            <Download style={{ width: '14px', height: '14px' }} />
            {downloading ? 'Generating...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      {/* ── Invoice card ── */}
      <div style={{
        background: '#fafaf9',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(28,25,23,0.08), 0 1px 4px rgba(28,25,23,0.04)',
        border: '1px solid #e7e5e4',
      }}>
        {/* Top accent */}
        <div style={{ height: '4px', background: 'linear-gradient(90deg, #1c1917 0%, #57534e 50%, #a8a29e 100%)' }} />

        {/* PDF Template */}
        <InvoicePDFTemplate
          invoice={invoice}
          client={client ?? null}
          projectTitle={project?.title}
        />

        {/* Bottom accent */}
        <div style={{ height: '4px', background: 'linear-gradient(90deg, #a8a29e 0%, #1c1917 100%)' }} />
      </div>

      {/* ── Quick actions footer ── */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginTop: '16px',
        justifyContent: 'center',
      }}>
        <button
          style={{
            fontSize: '12px',
            color: '#78716c',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px 12px',
            borderRadius: '6px',
            transition: 'all 0.15s',
          }}
          onMouseOver={(e) => { (e.target as HTMLElement).style.color = '#1c1917'; (e.target as HTMLElement).style.background = '#f5f4f1'; }}
          onMouseOut={(e) => { (e.target as HTMLElement).style.color = '#78716c'; (e.target as HTMLElement).style.background = 'transparent'; }}
        >
          Mark as Paid
        </button>
        <button
          style={{
            fontSize: '12px',
            color: '#78716c',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px 12px',
            borderRadius: '6px',
            transition: 'all 0.15s',
          }}
          onMouseOver={(e) => { (e.target as HTMLElement).style.color = '#1c1917'; (e.target as HTMLElement).style.background = '#f5f4f1'; }}
          onMouseOut={(e) => { (e.target as HTMLElement).style.color = '#78716c'; (e.target as HTMLElement).style.background = 'transparent'; }}
        >
          Duplicate Invoice
        </button>
      </div>
    </div>
  );
}