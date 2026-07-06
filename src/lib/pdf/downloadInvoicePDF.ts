'use client';

import { buildInvoiceHTML } from '@/components/invoices/InvoicePDFTemplate';
import type { BankDetails, UserProfile } from '@/types/user';
import type { Client } from '@/types/client';
import type { Invoice } from '@/types/invoice';

interface DownloadOptions {
  invoice: Invoice;
  client: Client | null;
  userProfile?: UserProfile | null;
  issueDate?: Date;
  terms?: string;
}

export async function downloadInvoicePDF({
  invoice,
  client,
  userProfile,
  issueDate,
  terms,
}: DownloadOptions): Promise<void> {
  const [html2canvasModule, jsPDFModule] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);
  const html2canvas = html2canvasModule.default;
  const jsPDF = jsPDFModule.default;

  const html = buildInvoiceHTML({
    invoice,
    client,
    userName: userProfile?.name,
    userCompany: userProfile?.company,
    userPhone: userProfile?.phone,
    userAddress: userProfile?.address,
    userLogo: userProfile?.logo,
    bankDetails: userProfile?.bankDetails,
    issueDate,
    terms,
  });

  // Create a hidden iframe to render the HTML without affecting the DOM
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:794px;height:1123px;opacity:0;pointer-events:none;border:none;';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error('Cannot access iframe document');
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // Wait for fonts and content to load
  await new Promise((resolve) => setTimeout(resolve, 500));

  const iframeBody = iframeDoc.body;
  iframeBody.style.transform = 'scale(1)';
  iframeBody.style.width = '794px';

  try {
    const canvas = await html2canvas(iframeBody, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794,
      height: 1123,
      windowWidth: 794,
      windowHeight: 1123,
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // A4 dimensions: 210mm x 297mm
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${invoice.invoiceNumber}.pdf`);
  } finally {
    document.body.removeChild(iframe);
  }
}
