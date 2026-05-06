import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../../services/report.service';
import { Layout } from '../../../shared/components/layout/layout';
import { Placeholder } from '../../../shared/components/placeholder/placeholder';
import { DebtorsStatement } from '../debtors-statement/debtors-statement';
import { escapeCsv } from '../drivers-permit-status/exports-helper';

type PeriodType = 'custom' | 'monthly' | 'quarterly' | 'semiannual' | 'yearly';

interface DebtorInvoiceRow {
  issuedAt: string;
  invoiceNumber: string;
  invoiceAmount: number;
  paidAmount: number;
  outstandingAmount: number;
}

interface DebtorRow {
  customerId?: string;
  customerName: string;
  totalInvoicedAmount: number;
  totalPaidAmount: number;
  outstandingAmount: number;
  invoices?: DebtorInvoiceRow[];
}

interface DebtorsReportResponse {
  items?: Array<{
    customerId?: string;
    customerName?: string;
    totalInvoicedAmount?: number;
    totalPaidAmount?: number;
    outstandingAmount?: number;
    invoices?: Array<{
      issuedAt?: string;
      invoiceDate?: string;
      invoiceNumber?: string;
      amount?: number;
      invoiceAmount?: number;
      paidAmount?: number;
      outstanding?: number;
      outstandingAmount?: number;
    }>;
  }>;
  totalInvoicedAmount?: number;
  totalPaidAmount?: number;
  totalOutstandingAmount?: number;
}

@Component({
  selector: 'app-debtors-report',
  standalone: true,
  imports: [CommonModule, Layout, Placeholder, DecimalPipe, DebtorsStatement, FormsModule],
  templateUrl: './debtors-report.html',
  styleUrl: './debtors-report.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DebtorsReport implements OnInit {
  private reportService = inject(ReportService);

  loading = signal(false);
  rows = signal<DebtorRow[]>([]);
  selectedDebtor = signal<DebtorRow | null>(null);
  viewDetails = signal(false);
  showAddButton = signal(false);
  formTitle = signal('Customer Statement');
  formDescription = signal('Review invoices for the selected customer and print a statement.');

  period = signal<PeriodType>('monthly');
  year = signal<number>(new Date().getFullYear());
  month = signal<number>(new Date().getMonth() + 1);
  quarter = signal<number>(Math.floor((new Date().getMonth()) / 3) + 1);
  half = signal<number>(new Date().getMonth() < 6 ? 1 : 2);
  customStart = signal<string>('');
  customEnd = signal<string>('');

  // ngModel proxies for template two-way binding
  get periodModel(): PeriodType { return this.period(); }
  set periodModel(v: PeriodType) { this.period.set(v); }

  get yearModel(): number { return this.year(); }
  set yearModel(v: any) { this.year.set(Number(v)); }

  get monthModel(): number { return this.month(); }
  set monthModel(v: any) { this.month.set(Number(v)); }

  get quarterModel(): number { return this.quarter(); }
  set quarterModel(v: any) { this.quarter.set(Number(v)); }

  get halfModel(): number { return this.half(); }
  set halfModel(v: any) { this.half.set(Number(v)); }

  get customStartModel(): string { return this.customStart(); }
  set customStartModel(v: string) { this.customStart.set(v); }

  get customEndModel(): string { return this.customEnd(); }
  set customEndModel(v: string) { this.customEnd.set(v); }

  months = computed(() => [
    { v: 1, label: 'January' },
    { v: 2, label: 'February' },
    { v: 3, label: 'March' },
    { v: 4, label: 'April' },
    { v: 5, label: 'May' },
    { v: 6, label: 'June' },
    { v: 7, label: 'July' },
    { v: 8, label: 'August' },
    { v: 9, label: 'September' },
    { v: 10, label: 'October' },
    { v: 11, label: 'November' },
    { v: 12, label: 'December' }
  ]);

  currentYear = computed(() => new Date().getFullYear());
  currentMonth = computed(() => new Date().getMonth() + 1);
  currentQuarter = computed(() => Math.floor((new Date().getMonth()) / 3) + 1);
  currentHalf = computed(() => (new Date().getMonth() < 6 ? 1 : 2));

  quarters = computed(() => [
    { v: 1, label: 'Q1 (Jan 1 - Mar 31)' },
    { v: 2, label: 'Q2 (Apr 1 - Jun 30)' },
    { v: 3, label: 'Q3 (Jul 1 - Sep 30)' },
    { v: 4, label: 'Q4 (Oct 1 - Dec 31)' }
  ]);

  halves = computed(() => [
    { v: 1, label: '1st half (Jan 1 - Jun 30)' },
    { v: 2, label: '2nd half (Jul 1 - Dec 31)' }
  ]);

  years = computed(() => {
    const current = new Date().getFullYear();
    const out: number[] = [];
    for (let i = current; i >= current - 9; i--) out.push(i);
    return out;
  });

  totals = signal<{ totalInvoicedAmount: number; totalPaidAmount: number; totalOutstandingAmount: number }>({
    totalInvoicedAmount: 0,
    totalPaidAmount: 0,
    totalOutstandingAmount: 0,
  });

  reportStartDate = signal<string>('');
  reportEndDate = signal<string>('');

  openStatement(row: DebtorRow) {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }

    this.selectedDebtor.set(row);
    this.formTitle.set(row.customerName || 'Customer Statement');
    this.formDescription.set('Customer invoice statement for the selected period.');
    this.viewDetails.set(true);
  }

  closeStatement() {
    this.viewDetails.set(false);
    this.selectedDebtor.set(null);
  }

  exportCsv() {
    const items: string[] = [];
    const header = ['Customer Name', 'Total Invoiced Amount', 'Total Paid Amount', 'Outstanding Amount'];
    items.push(header.map(escapeCsv).join(','));
    for (const r of this.rows()) {
      items.push([r.customerName, r.totalInvoicedAmount, r.totalPaidAmount, r.outstandingAmount].map(escapeCsv).join(','));
      // Add invoices as sub-rows
      if (r.invoices) {
        for (const inv of r.invoices) {
          items.push(['  ' + inv.invoiceNumber, inv.invoiceAmount, inv.paidAmount, inv.outstandingAmount].map(escapeCsv).join(','));
        }
      }
    }
    items.push(['TOTAL', this.totals().totalInvoicedAmount, this.totals().totalPaidAmount, this.totals().totalOutstandingAmount].map(escapeCsv).join(','));
    const csv = items.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debtors-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  exportPdf() {
    const buildTable = () => {
      const decimalPipe = new DecimalPipe('en-US');
      let html = '<table style="width:100%;border-collapse:collapse">';
      html += '<thead><tr><th style="border:1px solid #ddd;padding:8px;background:#f3f4f6">Customer</th><th style="border:1px solid #ddd;padding:8px;background:#f3f4f6">Total Invoiced</th><th style="border:1px solid #ddd;padding:8px;background:#f3f4f6">Total Paid</th><th style="border:1px solid #ddd;padding:8px;background:#f3f4f6">Outstanding</th></tr></thead><tbody>';
      for (const r of this.rows()) {
        html += `<tr><td style="border:1px solid #ddd;padding:8px;font-weight:bold">${r.customerName}</td><td style="border:1px solid #ddd;padding:8px; text-align: right;">${decimalPipe.transform(r.totalInvoicedAmount || 0, '1.2-2')}</td><td style="border:1px solid #ddd;padding:8px; text-align: right;">${decimalPipe.transform(r.totalPaidAmount || 0, '1.2-2')}</td><td style="border:1px solid #ddd;padding:8px; text-align: right;">${decimalPipe.transform(r.outstandingAmount || 0, '1.2-2')}</td></tr>`;
        if (r.invoices) {
          for (const i of r.invoices) {
            html += `<tr><td style="border:1px solid #ddd;padding:8px 8px 8px 32px">${i.invoiceNumber}</td><td style="border:1px solid #ddd;padding:8px; text-align: right;">${decimalPipe.transform(i.invoiceAmount || 0, '1.2-2')}</td><td style="border:1px solid #ddd;padding:8px; text-align: right;">${decimalPipe.transform(i.paidAmount || 0, '1.2-2')}</td><td style="border:1px solid #ddd;padding:8px; text-align: right;">${decimalPipe.transform(i.outstandingAmount || 0, '1.2-2')}</td></tr>`;
          }
        }
      };
      html += `<tr><td style="border:1px solid #ddd;padding:8px;font-weight:bold">Overall Total</td><td style="border:1px solid #ddd;padding:8px;font-weight:bold; text-align: right;">${decimalPipe.transform(this.totals().totalInvoicedAmount || 0, '1.2-2')}</td><td style="border:1px solid #ddd;padding:8px;font-weight:bold; text-align: right;">${decimalPipe.transform(this.totals().totalPaidAmount || 0, '1.2-2')}</td><td style="border:1px solid #ddd;padding:8px;font-weight:bold; text-align: right;">${decimalPipe.transform(this.totals().totalOutstandingAmount || 0, '1.2-2')}</td></tr>`;
      html += '</tbody></table>';
      return html;
    }
    const content = `<!doctype html><html><head><meta charset="utf-8"><title>Debtors</title>` +
      `<style>body{font-family:Arial,Helvetica,sans-serif;margin:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px}th{background:#f3f4f6}</style>` +
      `</head><body><h1>Debtors Report</h1>${buildTable()}</body></html>`;
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    printWindow.document.open();
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
  }

  async ngOnInit(): Promise<void> {
    await this.loadReport();
  }

  constructor() {
    // clamp month/quarter/half to current when selecting the current year
    effect(() => {

      const y = this.year();
      if (y === this.currentYear()) {
        if (this.month() > this.currentMonth()) this.month.set(this.currentMonth());
        if (this.quarter() > this.currentQuarter()) this.quarter.set(this.currentQuarter());
        if (this.half() > this.currentHalf()) this.half.set(this.currentHalf());
      }
    });
  }

  private periodRange() {
    const y = this.year();
    switch (this.period()) {
      case 'monthly': {
        const m = this.month();
        const start = new Date(y, m - 1, 1);
        const end = new Date(y, m, 0);
        return { start, end };
      }
      case 'quarterly': {
        const q = this.quarter();
        const start = new Date(y, (q - 1) * 3, 1);
        const end = new Date(y, q * 3, 0);
        return { start, end };
      }
      case 'semiannual': {
        const h = this.half();
        const start = new Date(y, h === 1 ? 0 : 6, 1);
        const end = new Date(y, h === 1 ? 6 : 12, 0);
        return { start, end };
      }
      case 'yearly': {
        const start = new Date(y, 0, 1);
        const end = new Date(y, 11, 31);
        return { start, end };
      }
      case 'custom':
      default:
        return { start: new Date(this.customStart() || ''), end: new Date(this.customEnd() || '') };
    }
  }

  async loadReport() {
    const range = this.periodRange();
    const startIso = range.start?.toISOString().split('T')[0];
    const endIso = range.end?.toISOString().split('T')[0];

    this.reportStartDate.set(startIso || '');
    this.reportEndDate.set(endIso || '');

    this.loading.set(true);
    try {
      const resp = await this.reportService.getDebtors({ startDate: startIso, endDate: endIso }) as DebtorsReportResponse;
      console.log('Debtors report response', resp);
      this.rows.set((resp?.items || []).map((item) => ({
        customerId: item.customerId,
        customerName: item.customerName || '-',
        totalInvoicedAmount: item.totalInvoicedAmount || 0,
        totalPaidAmount: item.totalPaidAmount || 0,
        outstandingAmount: item.outstandingAmount || 0,
        invoices: (item.invoices || []).map((invoice) => ({
          issuedAt: invoice.issuedAt || invoice.issuedAt || '',
          invoiceNumber: invoice.invoiceNumber || '-',
          invoiceAmount: invoice.invoiceAmount ?? invoice.amount ?? 0,
          paidAmount: invoice.paidAmount ?? 0,
          outstandingAmount: invoice.outstandingAmount ?? invoice.outstanding ?? 0,
        })),
      })));
      this.totals.set({
        totalInvoicedAmount: resp?.totalInvoicedAmount || 0,
        totalPaidAmount: resp?.totalPaidAmount || 0,
        totalOutstandingAmount: resp?.totalOutstandingAmount || 0,
      });
    } catch (error) {
      console.error('Error loading debtors report:', error);
      this.rows.set([]);
    } finally {
      this.loading.set(false);
    }
  }
}
