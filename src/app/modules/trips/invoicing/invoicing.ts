import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Invoice, InvoiceStatus } from '../../../models/invoice.model';
import { Trip } from '../../../models/trip.model';
import { InvoiceService } from '../../../services/invoice.service';
import { TripService } from '../../../services/trip.service';
import { ActionPermision, DataTable, TableConfig } from '../../../shared/components/data-table/data-table';
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
  selectedPaymentStatusFilter = signal<'all' | 'full_paid' | 'partially_paid' | 'unpaid'>('all');

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
        tripRoute: invoice.trips[0]?.route?.name || invoice.tripId,
        tripNumber: invoice.tripReferenceNumber || '-',
        rate:invoice.rate,
        quantity: invoice.quantity,
        trucks: invoice.trucks || '-',
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

  paymentStatusTabs = computed(() => {
    const allInvoices = this.invoices();
    const tabs: Array<{ label: string; value: 'all' | 'full_paid' | 'partially_paid' | 'unpaid'; count: number; icon: string }> = [];
    
    // Count all invoices
    const totalCount = allInvoices.length;
    if (totalCount > 0) {
      tabs.push({
        label: 'All',
        value: 'all',
        count: totalCount,
        icon: 'fa-list'
      });
    }

    // Count unpaid invoices
    const unpaidCount = allInvoices.filter(inv => inv.paymentStatus === 'unpaid').length;
    if (unpaidCount > 0) {
      tabs.push({
        label: 'Unpaid',
        value: 'unpaid',
        count: unpaidCount,
        icon: 'fa-clock text-red-500'
      });
    }

    // Count partially paid invoices
    const partialCount = allInvoices.filter(inv => inv.paymentStatus === 'partially_paid').length;
    if (partialCount > 0) {
      tabs.push({
        label: 'Partial Paid',
        value: 'partially_paid',
        count: partialCount,
        icon: 'fa-exclamation-circle text-yellow-500'
      });
    }

    // Count full paid invoices
    const paidCount = allInvoices.filter(inv => inv.paymentStatus === 'full_paid').length;
    if (paidCount > 0) {
      tabs.push({
        label: 'Paid',
        value: 'full_paid',
        count: paidCount,
        icon: 'fa-check-circle text-emerald-500'
      });
    }

    return tabs;
  });

  filteredInvoices = computed(() => {
    const filter = this.selectedPaymentStatusFilter();
    const allInvoices = this.invoices();

    if (filter === 'all') {
      return allInvoices;
    }

    return allInvoices.filter(inv => inv.paymentStatus === filter);
  });

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

  permissions = signal<ActionPermision>({
    more:{
      viewReceipts: ['VIEW_INVOICE_PAYMENTS'],
      manageReceipts: ['RECEIVE_PAYMENTS'],
    }
  })

 
  formatPostalAddress(value: string | null | undefined): string {
    if (!value) return '';
    return String(value).replace(/^\s*P\.?\s*O?\.?\s*BOX\.?\s*/i, '').trim();
  }

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
    console.log('Viewing invoice', row._invoice);
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

  calculateLoss(trip: Trip | undefined): number | null {
    if (!trip?.offloadedQuantity || !trip?.loadedQuantity) {
      return null;
    }
    return trip.offloadedQuantity - trip.loadedQuantity;
  }

  calculateAllowableLoss(trip: Trip | undefined): number {
    return trip?.cargoType?.allowableLoss ?? 0;
  }

  calculateNetLoss(trip: Trip | undefined): number | null {
    const loss = this.calculateLoss(trip);
    if (loss === null) return null;
    return loss - this.calculateAllowableLoss(trip);
  }

  calculateChargeableLoss(trip: Trip | undefined): number | null {
    const netLoss = this.calculateNetLoss(trip);
    if (netLoss === null || !trip?.ratePerUnit) {
      return null;
    }
    return (trip.ratePerUnit * netLoss) / 1000;
  }

  calculateTripTotal(trip: Trip | undefined): number {
    if (!trip) return 0;
    const chargeableLoss = this.calculateChargeableLoss(trip) ?? 0;
    return (trip.revenue ?? 0) + chargeableLoss;
  }

  calculateInvoiceTotalForLitres(invoice: Invoice | undefined): number {
    if (!invoice?.trips) return 0;
    return invoice.trips.reduce((sum, trip) => sum + this.calculateTripTotal(trip), 0);
  }

  calculateTotalChargeableLoss(invoice: Invoice | undefined): number {
    if (!invoice?.trips) return 0;
    return invoice.trips.reduce((sum, trip) => sum + (this.calculateChargeableLoss(trip) ?? 0), 0);
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

  printInvoice() {
    const invoice = this.selectedInvoice();
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
          <div><div class="k">Trip</div><div class="v">${invoice.trips[0]?.route?.name || invoice.tripId}</div></div>
          <div><div class="k">Trucks</div><div class="v">${invoice.trucks || '-'}</div></div>
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
          <div><div class="k">Trip</div><div class="v">${invoice.trips[0]?.route?.name || invoice.tripId}</div></div>
          <div><div class="k">Trucks</div><div class="v">${invoice.trucks || '-'}</div></div>
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