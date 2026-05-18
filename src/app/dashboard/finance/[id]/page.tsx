'use client';

import { ArrowLeft, Download, Edit, Mail, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { setDashboardTitle } from '@/app/dashboard/_context';
import { InvoicePDFTemplate } from '@/components/invoices/InvoicePDFTemplate';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/DataTableSkeleton';
import { useClients } from '@/hooks/useClients';
import { useInvoices } from '@/hooks/useInvoices';
import { useProjects } from '@/hooks/useProjects';
import { getInvoice } from '@/lib/services/invoiceService';
import type { Invoice } from '@/types/invoice';

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
        if (!inv) {
          toast.error('Invoice not found');
          router.push('/dashboard/finance');
          return;
        }
        setInvoice(inv);
        setDashboardTitle(`Invoice ${inv.invoiceNumber}`);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : 'Failed to load invoice');
        router.push('/dashboard/finance');
      })
      .finally(() => setLoading(false));
  }, [invoiceId, router]);

  const handleDownloadPDF = async () => {
    if (!invoice) return;

    setDownloading(true);
    try {
      const element = document.getElementById('invoice-pdf-template');
      if (!element) {
        toast.error('PDF template not found');
        return;
      }

      // Capture the element as canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Convert to PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Calculate dimensions to fit A4
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${invoice.invoiceNumber}.pdf`);
         toast.success('PDF downloaded successfully');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!invoice) return;
    if (!confirm(`Delete invoice ${invoice.invoiceNumber}? This action cannot be undone.`)) return;

    try {
      await remove(invoice.id);
      toast.success('Invoice deleted');
      router.push('/dashboard/finance');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete invoice');
    }
  };

  const handleEdit = () => {
    // TODO: Open invoice edit modal
    toast.info('Edit feature coming soon');
  };

  const handleSendEmail = () => {
    // TODO: Implement email sending
    toast.info('Email feature coming soon');
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (!invoice) {
    return null;
  }

  const client = invoice.clientId ? clients.find((c) => c.id === invoice.clientId) : null;
  const project = invoice.projectId ? projects.find((p) => p.id === invoice.projectId) : null;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/finance')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Finance
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSendEmail}
            className="gap-2"
          >
            <Mail className="h-4 w-4" />
            Send Email
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {downloading ? 'Generating...' : 'Download PDF'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Preview */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <InvoicePDFTemplate
          invoice={invoice}
          client={client ?? null}
          projectTitle={project?.title}
        />
      </div>
    </div>
  );
}