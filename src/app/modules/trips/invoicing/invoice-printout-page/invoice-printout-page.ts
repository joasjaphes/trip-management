import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Invoice } from '../../../../models/invoice.model';
import { CompanyProfileService } from '../../../../services/company-profile.service';
import { InvoiceService } from '../../../../services/invoice.service';
import { InvoiceView } from '../../../../shared/components/invoice-view/invoice-view';

declare const jsPDF: any;

@Component({
    selector: 'app-invoice-printout-page',
    standalone: true,
    imports: [CommonModule, InvoiceView],
    templateUrl: './invoice-printout-page.html',
})
export class InvoicePrintoutPage {
    private invoiceService = inject(InvoiceService);
    private companyService = inject(CompanyProfileService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    invoiceIn = input<Invoice | undefined>();
    isSubmiting = input(false);
    submitting = signal(false);
    isConfirming = signal(false);
    invoiceLocal = signal<Invoice | undefined>(undefined);
    invoice = computed(() => this.invoiceIn() ?? this.invoiceLocal());

    companyProfile = this.companyService.profile;
    loadingCompanyProfile = this.companyService.loading;
    busy = signal(false);
    message = signal<string | null>(null);
    isLocked = computed(() => this.invoice()?.status === 'issued');

    close = output<void>();

    ngOnInit() {
        const routeInvoiceId = this.route.snapshot.paramMap.get('id') || this.route.snapshot.queryParamMap.get('invoiceId');
        if (!this.invoice() && routeInvoiceId) {
            const found = this.invoiceService.getById(routeInvoiceId);
            if (found) {
                this.invoiceLocal.set(found);
            }
        }
    }

    closePanel() {
        this.close.emit();
    }

    // async downloadPdf() {
    //     const invoice = this.invoice();
    //     if (!invoice || this.busy()) return;

    //     this.busy.set(true);
    //     this.message.set('Preparing PDF...');

    //     try {
    //         await this.ensurePdfLibrary();
    //         const pdf = this.buildPdf(invoice);
    //         pdf.save(`Invoice-${invoice.invoiceNumber || invoice.id}.pdf`);
    //         this.message.set('PDF downloaded.');
    //     } catch (error) {
    //         console.error(error);
    //         this.message.set('Failed to generate PDF.');
    //     } finally {
    //         this.busy.set(false);
    //     }
    // }

    printInvoice() {
        const invoice = this.invoice();
        if (!invoice) return;

        const element = document.getElementById('invoice-document');
        if (!element) return;

        // Clone so we can mutate img URLs without touching the on-screen DOM.
        const clone = element.cloneNode(true) as HTMLElement;

        // The CompanyProfileService resolves logos to blob: URLs, which are
        // scoped to the original document and won't load in the new print window.
        // Swap any blob: src (or empty/relative src) for the bundled brand logo.
        const fallbackLogo = `${window.location.origin}/assets/images/easytruckinglogo.png`;
        clone.querySelectorAll('img').forEach((img) => {
            const src = img.getAttribute('src') || '';
            if (!src || src.startsWith('blob:')) {
                img.setAttribute('src', fallbackLogo);
                return;
            }
            if (!/^(https?:|data:)/i.test(src)) {
                // Make any other relative URLs absolute against the current origin.
                img.setAttribute('src', new URL(src, window.location.href).href);
            }
        });

        this.openPrintWindow(`Invoice ${invoice.invoiceNumber || invoice.id}`, clone.innerHTML);
    }

    private renderPrintShell(title: string, body: string): string {
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page { size: A4 portrait; margin: 7mm; }
    *, *::before, *::after { box-sizing: border-box; }
    html, body { width: 100%; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; color: #000; background: #fff; font-size: 11px; line-height: 1.25; }
    /* Reset heading defaults so inline text-size classes drive size */
    h1, h2, h3, h4, h5, h6 { font-size: inherit; font-weight: inherit; margin: 0; }
    p { margin: 0; line-height: 1.25; }
    img { max-width: 100%; height: auto; }

    .print-container { width: 100%; max-width: 100%; margin: 0; padding: 0; }
    table { width: 100%; border-collapse: collapse; page-break-inside: avoid; }
    td, th { vertical-align: top; }

    /* Borders */
    .border { border: 1px solid #000; }
    .border-b { border-bottom: 1px solid #000; }
    .border-l { border-left: 1px solid #000; }
    .border-r { border-right: 1px solid #000; }
    .border-t { border-top: 1px solid #000; }
    .border-t-0 { border-top: 0; }
    .border-black { border-color: #000; }
    .border-gray-100, .border-gray-200 { border-color: #e5e7eb; }
    .border-b-\\[4px\\] { border-bottom-width: 4px; }
    .border-b-\\[2px\\] { border-bottom: 2px solid #000; }
    .border-collapse { border-collapse: collapse; }

    /* Padding (tighter in print to fit one page) */
    .p-0 { padding: 0; }
    .p-1 { padding: 3px; }
    .p-2 { padding: 4px; }
    .p-3 { padding: 6px; }
    .p-4 { padding: 8px; }
    .p-8 { padding: 8px; }
    .pl-2 { padding-left: 6px; }
    .pl-6 { padding-left: 16px; }
    .pr-2 { padding-right: 6px; }
    .pb-1 { padding-bottom: 3px; }
    .pb-4 { padding-bottom: 8px; }
    .pb-10 { padding-bottom: 0; }
    .px-2 { padding-left: 6px; padding-right: 6px; }
    .px-3 { padding-left: 8px; padding-right: 8px; }
    .px-4 { padding-left: 8px; padding-right: 8px; }
    .px-5 { padding-left: 12px; padding-right: 12px; }
    .px-6 { padding-left: 16px; padding-right: 16px; }

    /* Text alignment */
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }

    /* Weights */
    .font-bold { font-weight: bold; }
    .font-extrabold { font-weight: 800; }
    .font-semibold { font-weight: 600; }
    .font-medium { font-weight: 500; }
    .font-sans { font-family: Arial, Helvetica, sans-serif; }
    .uppercase { text-transform: uppercase; }
    .capitalize { text-transform: capitalize; }
    .tracking-wide { letter-spacing: 0.025em; }

    /* Font sizes — scaled down ~15% from on-screen values to fit one page in print.
       CSS needs \\[ ... \\] in template literal to produce \\[ in compiled CSS. */
    .text-\\[10px\\] { font-size: 9px; }
    .text-\\[11px\\] { font-size: 9px; }
    .text-\\[12px\\] { font-size: 10px; }
    .text-\\[13px\\] { font-size: 10px; }
    .text-\\[14px\\] { font-size: 11px; }
    .text-\\[18px\\] { font-size: 14px; }
    .text-\\[20px\\] { font-size: 15px; }
    .text-\\[24px\\] { font-size: 17px; }

    /* Line height & margins (compressed for print) */
    .leading-none { line-height: 1; }
    .leading-snug { line-height: 1.25; }
    .mt-1 { margin-top: 2px; }
    .mt-2 { margin-top: 4px; }
    .mt-4 { margin-top: 6px; }
    .mt-6 { margin-top: 8px; }
    .mt-8 { margin-top: 8px; }
    .mb-0 { margin-bottom: 0; }
    .mb-2 { margin-bottom: 4px; }
    .mb-4 { margin-bottom: 6px; }

    /* Heights (compressed) */
    .h-6 { height: 18px; }
    .h-8 { height: 22px; }
    .h-10 { height: 26px; }
    .h-20 { height: 38px; }
    .h-24 { height: 54px; }
    .h-28 { height: 60px; }
    .h-32 { height: auto; }
    .h-\\[75px\\] { height: 44px; }
    .h-\\[6px\\] { height: 4px; }

    .object-contain { object-fit: contain; }

    /* Flex layout */
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .items-center { align-items: center; }
    .items-start { align-items: flex-start; }
    .items-end { align-items: flex-end; }
    .justify-between { justify-content: space-between; }
    .justify-start { justify-content: flex-start; }
    .justify-end { justify-content: flex-end; }
    .gap-2 { gap: 4px; }
    .gap-4 { gap: 8px; }
    .gap-6 { gap: 12px; }
    .gap-8 { gap: 12px; }

    /* Positioning — force static in print so absolute elements flow naturally */
    .relative { position: relative; }
    .absolute { position: static !important; }
    .bottom-0, .bottom-4, .bottom-\\[4\\.5rem\\] { bottom: auto; }
    .right-0, .right-4 { right: auto; }
    .left-0 { left: auto; }
    .z-0, .z-10 { z-index: auto; }

    /* Widths */
    .w-full { width: 100%; }
    .w-1\\/2 { width: 50%; }
    .w-1\\/3 { width: 33.333%; }
    .w-2\\/3 { width: 66.667%; }
    .w-3\\/4 { width: 75%; }
    .w-40 { width: 160px; }
    .w-\\[6\\%\\] { width: 6%; }
    .w-\\[12\\%\\] { width: 12%; }
    .w-\\[14\\%\\] { width: 14%; }
    .w-\\[15\\%\\] { width: 15%; }
    .w-\\[16\\%\\] { width: 16%; }
    .w-\\[20\\%\\] { width: 20%; }
    .w-\\[25\\%\\] { width: 25%; }
    .w-\\[26\\%\\] { width: 26%; }
    .w-\\[30\\%\\] { width: 30%; }
    .w-\\[34\\%\\] { width: 34%; }
    .w-\\[35\\%\\] { width: 35%; }
    .w-\\[36\\%\\] { width: 36%; }
    .w-\\[40\\%\\] { width: 40%; }
    .w-\\[42\\%\\] { width: 42%; }
    .w-\\[45\\%\\] { width: 45%; }
    .w-\\[48\\%\\] { width: 48%; }
    .w-\\[55\\%\\] { width: 55%; }
    .w-\\[60\\%\\] { width: 60%; }
    .w-\\[65\\%\\] { width: 65%; }

    /* Reposition absolute "For Easy Trucking Limited / Authorized Signatory" block */
    .absolute[style*="border-top"] {
      border-top: 1px solid #000 !important;
      padding-top: 2px !important;
      margin-top: 32px !important;
      width: 75% !important;
      margin-left: auto !important;
      margin-right: auto !important;
      text-align: center;
    }

    .overflow-hidden { overflow: visible; }

    /* Ensure page-break safety */
    td { page-break-inside: avoid; }

    /* Colored bars */
    .bg-red-600 { background-color: #dc2626; }
    .bg-black { background-color: #000; }
    .bg-white { background-color: #fff; }
    .bg-gray-100 { background-color: #f3f4f6; }

    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  </style>
</head>
<body>
  <div class="print-container">
    ${body}
  </div>
</body>
</html>`;
    }


    private openPrintWindow(title: string, html: string) {
        const win = window.open('', '_blank', 'width=980,height=760');
        if (!win) {
            return;
        }

        win.document.open();
        win.document.write(this.renderPrintShell(title, html));
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 250);
    }

    async submitAndDownloadPdf(confirming = false) {
        if(!confirming) {
            this.isConfirming.set(true);
            return;
        }
        const invoice = this.invoice();
        if (!invoice) return;
        this.submitting.set(true);
        this.message.set('Submitting invoice and preparing PDF...');
        try {
            // Mark invoice as issued
            await this.invoiceService.updateStatus(invoice.id, 'issued');
            const refreshed = this.invoiceService.getById(invoice.id) || invoice;
            this.invoiceLocal.set(refreshed);
            this.message.set('Invoice submitted and PDF downloaded. This invoice cannot be modified.');
            await this.printInvoice();
            this.close.emit();
        } catch (err) {
            console.error(err);
            this.message.set(String(err || 'Failed to submit invoice.'));
        } finally {
            this.submitting.set(false);
        }
    }

    copyShareableLink() {
        const invoice = this.invoice();
        if (!invoice) return;

        const link = this.getShareableLink(invoice.id);
        navigator.clipboard?.writeText(link);
        this.message.set('Shareable link copied to clipboard.');
        setTimeout(() => this.message.set(null), 2000);
    }

    getShareableLink(invoiceId?: string) {
        const id = invoiceId || this.invoice()?.id;
        if (!id) return `${window.location.origin}${this.router.serializeUrl(this.router.createUrlTree(['/invoicing']))}`;

        return `${window.location.origin}${this.router.serializeUrl(this.router.createUrlTree(['/invoices', id, 'print']))}`;
    }
}
