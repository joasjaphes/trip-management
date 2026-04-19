import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Invoice, InvoiceStatus } from '../../../models/invoice.model';
import { InvoiceService } from '../../../services/invoice.service';
import { TripService } from '../../../services/trip.service';
import { DataTable, TableConfig } from '../../../shared/components/data-table/data-table';
import { Layout } from '../../../shared/components/layout/layout';
import { InvoiceReceiptsManage } from './invoice-receipts-manage/invoice-receipts-manage';
import { InvoiceReceiptService } from '../../../services/invoice-receipt.service';
import { CompanyProfileService } from '../../../services/company-profile.service';
import { Placeholder } from '../../../shared/components/placeholder/placeholder';
import { HttpClientService } from '../../../services/http-client.service';

@Component({
  selector: 'app-invoicing',
  standalone: true,
  imports: [CommonModule, FormsModule, Layout, DataTable, InvoiceReceiptsManage, Placeholder, DecimalPipe],
  templateUrl: './invoicing.html',
  styleUrl: './invoicing.css',
})
export class Invoicing implements OnInit {
  private invoiceService = inject(InvoiceService);
  private tripService = inject(TripService);
  private invoiceReceiptService = inject(InvoiceReceiptService);
  private companyService = inject(CompanyProfileService);
  private http = inject(HttpClientService);

  title = signal('Invoicing');
  description = signal('Manage invoice generation and billing status changes.');
  addText = signal('Generate invoice');
  viewDetails = signal(false);
  showAddButton = signal(false);
  formTitle = signal('');
  formDescription = signal('');
  companyProfile = this.companyService.profile;
  loadingCompanyProfile = this.companyService.loading;

  selectedTripId = '';
  generationStatus: InvoiceStatus = 'draft';
  selectedInvoice = signal<Invoice | undefined>(undefined);
  selectedStatus: InvoiceStatus = 'draft';
  panelMode = signal<'generate' | 'detail' | 'manage-receipts' | 'view-receipts'>('generate');
  splitSize = signal<'full' | 'half'>('full');

  loading = computed(
    () => this.invoiceService.loading() || this.tripService.loading()
  );
  totalOutstanding = this.invoiceService.totalOutstanding;
  invoiceReceipts = computed(() => {
    const invoiceId = this.selectedInvoice()?.id;
    if (!invoiceId) {
      return [];
    }
    return this.invoiceReceiptService
      .allReceipts()
      .filter((receipt) => receipt.invoiceId === invoiceId);
  });
  totalReceived = computed(() =>
    this.invoiceReceipts().reduce((sum, receipt) => sum + Number(receipt.amount || 0), 0)
  );
  remainingAmount = computed(() => {
    const invoiceAmount = Number(this.selectedInvoice()?.amount || 0);
    return Math.max(0, invoiceAmount - this.totalReceived());
  });

  invoices = computed(() =>
    this.invoiceService.allInvoices().map((invoice) => {
      // const paidAmount = this.invoiceReceiptService
      //   .allReceipts()
      //   .filter((receipt) => receipt.invoiceId === invoice.id)
      //   .reduce((sum, receipt) => sum + Number(receipt.amount || 0), 0);
      // const paymentStatus = paidAmount >= Number(invoice.amount || 0) && Number(invoice.amount || 0) > 0
      //   ? 'paid'
      //   : paidAmount > 0
      //     ? 'partial'
      //     : 'unpaid';
      const remainingAmount = Number(invoice.amount || 0) - Number(invoice.paidAmount || 0);
      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber || '-',
        tripRoute: invoice.trip?.route?.name || invoice.tripId,
        tripNumber: invoice.trip?.tripReferenceNumber || '-',
        description: invoice.description || '-',
        customer: invoice.customer?.name || '-',
        amount: Number(invoice.amount || 0),
        paidAmount: invoice.paidAmount ? Number(invoice.paidAmount) : 0,
        remainingAmount: Number(remainingAmount),
        status: invoice.status,
        paymentStatus: invoice.paymentStatus || 'unpaid',
        issuedAt: invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : '-',
        _invoice: invoice,
        actions: {
          viewReceipts: invoice.paidAmount > 0,
          manageReceipts:  remainingAmount > 0,
        }
      };
    })
  );

  tripsWithoutInvoice = computed(() => {
    const usedTripIds = new Set(this.invoiceService.allInvoices().map((invoice) => invoice.tripId));
    return this.tripService
      .allTrips()
      .filter((trip) => !usedTripIds.has(trip.id))
      .map((trip) => ({
        id: trip.id,
        label: `${trip.route?.name || trip.routeId} (${new Date(trip.tripDate).toLocaleDateString()})`,
      }));
  });

  tableConfigurations: TableConfig = {
    columns: [
      { key: 'invoiceNumber', label: 'Invoice #' },
      { key: 'tripNumber', label: 'Trip #' },
      { key: 'description', label: 'Description' },
      { key: 'customer', label: 'Customer' },
      { key: 'amount', label: 'Amount', type: 'number' },
      { key: 'paidAmount', label: 'Paid Amount', type: 'number' },
      { key: 'remainingAmount', label: 'Remaining Amount', type: 'number' },
      { key: 'paymentStatus', label: 'Payment Status', type: 'invoiceStatus' },
      { key: 'issuedAt', label: 'Issued at' },
    ],
    actions: {
      view: true,
      more: true,
    },
  };

  moreActions = computed(() => [
    {
      label: 'View receipts',
      key: 'viewReceipts',
      icon: 'fa-solid fa-eye text-blue-500',
      action: (row: { _invoice: Invoice }) => this.onViewReceipts(row),
    },
    {
      label: 'Manage receipt',
      key: 'manageReceipts',
      icon: 'fa-solid fa-receipt text-emerald-500',
      action: (row: { _invoice: Invoice }) => this.onManageReceipt(row),
    },
  ]);

  numberToWords(amount: number): string {
    if (!amount) return 'zero';
    const a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    const numToWords = (num: number): string => {
      if ((num = num | 0) === 0) return '';
      if (num < 20) return a[num];
      if (num < 100) return b[Math.floor(num / 10)] + (num % 10 ? '-' + a[num % 10] : '');
      if (num < 1000) return a[Math.floor(num / 100)] + ' hundred' + (num % 100 ? ' and ' + numToWords(num % 100) : '');
      if (num < 1000000) return numToWords(Math.floor(num / 1000)) + ' thousand' + (num % 1000 ? ' ' + numToWords(num % 1000) : '');
      if (num < 1000000000) return numToWords(Math.floor(num / 1000000)) + ' million' + (num % 1000000 ? ' ' + numToWords(num % 1000000) : '');
      return numToWords(Math.floor(num / 1000000000)) + ' billion' + (num % 1000000000 ? ' ' + numToWords(num % 1000000000) : '');
    };
    return numToWords(amount);
  }

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.invoiceService.getAll(),
      this.tripService.getAll(),
      this.invoiceReceiptService.getAll(),
      this.companyService.get(),
    ]);
  }

  onAdd() {
    this.formTitle.set('Generate invoice');
    this.formDescription.set('Create a new invoice for a completed or active trip.');
    this.selectedTripId = '';
    this.generationStatus = 'draft';
    this.selectedInvoice.set(undefined);
    this.panelMode.set('generate');
    this.viewDetails.set(true);
  }

  onView(row: { _invoice: Invoice }) {
    const invoice = row._invoice;
    this.selectedInvoice.set(invoice);
    this.selectedStatus = invoice.status;
    this.formTitle.set(`Invoice ${invoice.invoiceNumber || invoice.id}`);
    this.formDescription.set('Review invoice details and update billing status.');
    this.panelMode.set('detail');
    this.viewDetails.set(true);
  }

  onManageReceipt(row: { _invoice: Invoice }) {
    const invoice = row._invoice;
    this.selectedInvoice.set(invoice);
    this.formTitle.set(`Manage receipts (${invoice.invoiceNumber || invoice.id})`);
    this.formDescription.set('Record, update, and remove invoice payment receipts.');
    this.panelMode.set('manage-receipts');
    this.viewDetails.set(true);
  }

  onViewReceipts(row: { _invoice: Invoice }) {
    const invoice = row._invoice;
    this.selectedInvoice.set(invoice);
    this.formTitle.set(`View receipts (${invoice.invoiceNumber || invoice.id})`);
    this.formDescription.set('View received payments and print a PDF-ready receipt.');
    this.panelMode.set('view-receipts');
    this.viewDetails.set(true);
  }

  async generateInvoice() {
    if (!this.selectedTripId) {
      return;
    }

    await this.invoiceService.generateForTrip(this.selectedTripId, this.generationStatus);
    this.viewDetails.set(false);
  }

  async saveInvoiceStatus() {
    const selected = this.selectedInvoice();
    if (!selected || !this.selectedStatus || selected.status === this.selectedStatus) {
      return;
    }

    await this.invoiceService.updateStatus(selected.id, this.selectedStatus);
    const refreshed = this.invoiceService.getById(selected.id);
    if (refreshed) {
      this.selectedInvoice.set(refreshed);
      this.selectedStatus = refreshed.status;
    }
  }

  closePanel() {
    this.viewDetails.set(false);
    this.selectedInvoice.set(undefined);
    this.panelMode.set('generate');
    this.formTitle.set('');
    this.formDescription.set('');
  }

  async onReceiptsSaved() {
    const selectedInvoiceId = this.selectedInvoice()?.id;
    await Promise.all([this.invoiceService.getAll(), this.invoiceReceiptService.getAll()]);

    if (!selectedInvoiceId) {
      return;
    }

    const refreshed = this.invoiceService.getById(selectedInvoiceId);
    if (refreshed) {
      this.selectedInvoice.set(refreshed);
      this.selectedStatus = refreshed.status;
    }
  }

  private renderPrintShell(title: string, body: string): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page { size: A4; margin: 10mm; }
    body { font-family: Arial, Helvetica, sans-serif; margin: 0; color: #000; background: #fff; }
    .print-container { width: 100%; max-width: 210mm; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; page-break-inside: avoid; }
    .border { border: 1px solid #000; }
    .border-b { border-bottom: 1px solid #000; }
    .border-l { border-left: 1px solid #000; }
    .border-r { border-right: 1px solid #000; }
    .border-t { border-top: 1px solid #000; }
    .p-1 { padding: 4px; }
    .p-2 { padding: 8px; }
    .p-3 { padding: 12px; }
    .pl-2 { padding-left: 8px; }
    .pr-2 { padding-right: 8px; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: bold; }
    .uppercase { text-transform: uppercase; }
    .capitalize { text-transform: capitalize; }
    .text-\[12px\] { font-size: 12px; }
    .text-\[13px\] { font-size: 13px; }
    .text-\[14px\] { font-size: 14px; }
    .text-\[20px\] { font-size: 20px; }
    .leading-none { line-height: 1; }
    .leading-snug { line-height: 1.375; }
    .mt-1 { margin-top: 4px; }
    .mt-2 { margin-top: 8px; }
    .mt-4 { margin-top: 16px; }
    .mt-6 { margin-top: 24px; }
    .mt-8 { margin-top: 32px; }
    .mb-2 { margin-bottom: 8px; }
    .h-20 { height: 80px; }
    .h-24 { height: 96px; }
    .h-28 { height: 112px; }
    .h-32 { height: auto; }
    .object-contain { object-fit: contain; }
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .relative { position: relative; }
    .absolute { position: static !important; }
    .bottom-0 { bottom: auto; }
    .bottom-4 { bottom: auto; }
    .bottom-\[4\.5rem\] { bottom: auto; }
    .right-0 { right: auto; }
    .right-4 { right: auto; }
    .left-0 { left: auto; }
    .w-full { width: 100%; }
    .w-1\/2 { width: 50%; }
    .w-1\/3 { width: 33.333333%; }
    .w-2\/3 { width: 66.666667%; }
    .w-3\/4 { width: 75%; }
    .w-\[30\%\] { width: 30%; }
    .w-\[34\%\] { width: 34%; }
    .w-\[36\%\] { width: 36%; }
    .w-\[45\%\] { width: 45%; }
    .w-\[55\%\] { width: 55%; }
    /* Print-specific overrides for signature section */
    td[style*="w-\\[55\\%\\]"] { vertical-align: top; }
    td[style*="w-\\[45\\%\\]"] { vertical-align: top; }
    .absolute[style*="bottom"] { 
      position: static !important; 
      display: block !important;
      text-align: center;
      margin: 0 auto !important;
      margin-top: 20px !important;
      width: 100% !important;
      left: auto !important;
      right: auto !important;
    }
    .absolute[style*="border-top"] {
      border-top: 1px solid #000 !important;
      padding-top: 2px !important;
      margin-top: 40px !important;
      width: 75% !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }
    /* Formal Invoice specific */
    .border-b-\[4px\] { border-bottom-width: 4px; }
    .tracking-wide { letter-spacing: 0.025em; }
    .overflow-hidden { overflow: visible; }
    .object-contain { object-fit: contain; }
    /* Ensure proper page breaks */
    td { page-break-inside: avoid; }
    /* Fix signature area layout */
    table[style*="h-32"] { height: auto; }
    table[style*="h-32"] td { padding: 12px; }
    /* Colored footer bar */
    .flex.mt-8 { display: flex; margin-top: 32px; }
    .bg-red-600 { background-color: #dc2626; }
    .bg-black { background-color: #000; }
    .border-b-\[2px\] { border-bottom: 2px solid #000; }
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    /* Hide scrollbars for print */
    ::-webkit-scrollbar { display: none; }
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

  printInvoice() {
    const invoice = this.selectedInvoice();
    if (!invoice) return;

    const element = document.getElementById('invoice-document');
    if (!element) return;

    // Use specific styles for print shell
    const html = element.innerHTML;
    this.openPrintWindow(`Invoice ${invoice.invoiceNumber || invoice.id}`, html);
  }

  printReceipt(receipt: any) {
    const invoice = this.selectedInvoice();
    if (!invoice) {
      return;
    }

    const html = `
    <div class="sheet">
      <div class="top">
        <h1>Payment Receipt</h1>
        <p>Receipt #${receipt.id} - Invoice #${invoice.invoiceNumber || invoice.id}</p>
      </div>
      <div class="content">
        <div class="meta">
          <div><div class="k">Customer</div><div class="v">${invoice.customer?.name || '-'}</div></div>
          <div><div class="k">Trip</div><div class="v">${invoice.trip?.route?.name || invoice.tripId}</div></div>
          <div><div class="k">Reference</div><div class="v">${receipt.reference || '-'}</div></div>
          <div><div class="k">Paid At</div><div class="v">${receipt.paidAt ? new Date(receipt.paidAt).toLocaleDateString() : '-'}</div></div>
        </div>

        <table class="table">
          <thead><tr><th>Description</th><th class="right">Amount</th></tr></thead>
          <tbody><tr><td>${receipt.notes || 'Invoice payment'}</td><td class="right">${Number(receipt.amount || 0).toLocaleString()}</td></tr></tbody>
        </table>

        <div class="totals">
          <div class="row strong"><span>Received</span><span>${Number(receipt.amount || 0).toLocaleString()}</span></div>
        </div>

        <div class="foot">Generated by Trip Management System. This document is valid as proof of payment receipt.</div>
      </div>
    </div>`;

    this.openPrintWindow(`Receipt ${receipt.id}`, html);
  }

  printAllReceipts() {
    const invoice = this.selectedInvoice();
    if (!invoice) {
      return;
    }
    const receipts = this.invoiceReceipts();

    const rows = receipts
      .map(
        (receipt) => `<tr>
          <td>${receipt.reference || '-'}</td>
          <td>${receipt.paidAt ? new Date(receipt.paidAt).toLocaleDateString() : '-'}</td>
          <td>${receipt.notes || '-'}</td>
          <td class="right">${Number(receipt.amount || 0).toLocaleString()}</td>
        </tr>`
      )
      .join('');

    const html = `
    <div class="sheet">
      <div class="top">
        <h1>Invoice Receipts Summary</h1>
        <p>Invoice #${invoice.invoiceNumber || invoice.id}</p>
      </div>
      <div class="content">
        <div class="meta">
          <div><div class="k">Customer</div><div class="v">${invoice.customer?.name || '-'}</div></div>
          <div><div class="k">Trip</div><div class="v">${invoice.trip?.route?.name || invoice.tripId}</div></div>
          <div><div class="k">Invoice Amount</div><div class="v">${Number(invoice.amount || 0).toLocaleString()}</div></div>
          <div><div class="k">Printed On</div><div class="v">${new Date().toLocaleDateString()}</div></div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Paid Date</th>
              <th>Notes</th>
              <th class="right">Amount</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="4">No receipts found</td></tr>'}</tbody>
        </table>

        <div class="totals">
          <div class="row"><span>Total Received</span><span>${this.totalReceived().toLocaleString()}</span></div>
          <div class="row strong"><span>Remaining</span><span>${this.remainingAmount().toLocaleString()}</span></div>
        </div>

        <div class="foot">Generated by Trip Management System. Print this page and choose "Save as PDF" for a PDF copy.</div>
      </div>
    </div>`;

    this.openPrintWindow(`Receipts ${invoice.invoiceNumber || invoice.id}`, html);
  }

  async getCompanyLogoUrl(): Promise<string> {
    const logoPath = this.companyProfile()?.logo;
    return await this.http.getImageUrl(logoPath || '');
  }
}