import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Invoice, InvoiceStatus } from '../../../models/invoice.model';
import { InvoiceService } from '../../../services/invoice.service';
import { TripService } from '../../../services/trip.service';
import { DataTable, TableConfig } from '../../../shared/components/data-table/data-table';
import { Layout } from '../../../shared/components/layout/layout';
import { InvoiceReceiptsManage } from './invoice-receipts-manage/invoice-receipts-manage';
import { InvoiceReceiptService } from '../../../services/invoice-receipt.service';

@Component({
  selector: 'app-invoicing',
  standalone: true,
  imports: [CommonModule, FormsModule, Layout, DataTable, InvoiceReceiptsManage],
  templateUrl: './invoicing.html',
})
export class Invoicing implements OnInit {
  private invoiceService = inject(InvoiceService);
  private tripService = inject(TripService);
  private invoiceReceiptService = inject(InvoiceReceiptService);

  title = signal('Invoicing');
  description = signal('Manage invoice generation and billing status changes.');
  addText = signal('Generate invoice');
  viewDetails = signal(false);
  showAddButton = signal(false);
  formTitle = signal('');
  formDescription = signal('');

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
          manageReceipts: true,
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

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.invoiceService.getAll(),
      this.tripService.getAll(),
      this.invoiceReceiptService.getAll(),
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
    @page { size: A4; margin: 14mm; }
    body { font-family: 'Segoe UI', Tahoma, sans-serif; margin: 0; color: #1f2937; }
    .sheet { border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; }
    .top { background: linear-gradient(135deg, #f25f2f, #ff7b4a); color: #fff; padding: 18px 22px; }
    .top h1 { margin: 0; font-size: 22px; letter-spacing: 0.3px; }
    .top p { margin: 6px 0 0; opacity: 0.95; font-size: 12px; }
    .content { padding: 18px 22px 24px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; margin-bottom: 14px; }
    .k { font-size: 11px; text-transform: uppercase; color: #6b7280; letter-spacing: .08em; font-weight: 700; }
    .v { font-size: 14px; color: #111827; font-weight: 700; margin-top: 2px; }
    .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .table th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #6b7280; border-bottom: 1px solid #e5e7eb; padding: 8px 6px; }
    .table td { font-size: 13px; border-bottom: 1px solid #f3f4f6; padding: 10px 6px; }
    .right { text-align: right; }
    .totals { margin-top: 14px; border-top: 2px solid #111827; padding-top: 10px; display: grid; gap: 6px; }
    .row { display: flex; justify-content: space-between; font-size: 13px; }
    .strong { font-weight: 800; font-size: 15px; }
    .foot { margin-top: 22px; font-size: 11px; color: #6b7280; border-top: 1px dashed #d1d5db; padding-top: 10px; }
  </style>
</head>
<body>
${body}
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
}