import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../../services/report.service';
import { Layout } from '../../../shared/components/layout/layout';
import { Placeholder } from '../../../shared/components/placeholder/placeholder';
import { escapeCsv } from '../drivers-permit-status/exports-helper';

type PeriodType = 'custom' | 'monthly' | 'quarterly' | 'semiannual' | 'yearly';

interface CashReportItem {
  invoiceDate?: string;
  invoiceNumber?: string;
  invoicedAmount?: number;
  actualReceivedAmount?: number;
}

interface CashReportResponse {
  items?: CashReportItem[];
  totalInvoicedAmount?: number;
  totalActualReceivedAmount?: number;
}

@Component({
  selector: 'app-cash-report',
  standalone: true,
  imports: [CommonModule, Layout, Placeholder, DecimalPipe, FormsModule],
  templateUrl: './cash-report.html',
  styleUrl: './cash-report.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CashReport implements OnInit {
  private reportService = inject(ReportService);

  loading = signal(false);
  rows = signal<CashReportItem[]>([]);

  period = signal<PeriodType>('monthly');
  year = signal<number>(new Date().getFullYear());
  month = signal<number>(new Date().getMonth() + 1);
  quarter = signal<number>(Math.floor((new Date().getMonth()) / 3) + 1);
  half = signal<number>(new Date().getMonth() < 6 ? 1 : 2);
  customStart = signal<string>('');
  customEnd = signal<string>('');

  get periodModel(): PeriodType { return this.period(); }
  set periodModel(v: PeriodType) { this.period.set(v); }

  get yearModel(): number { return this.year(); }
  set yearModel(v: string | number) { this.year.set(Number(v)); }

  get monthModel(): number { return this.month(); }
  set monthModel(v: string | number) { this.month.set(Number(v)); }

  get quarterModel(): number { return this.quarter(); }
  set quarterModel(v: string | number) { this.quarter.set(Number(v)); }

  get halfModel(): number { return this.half(); }
  set halfModel(v: string | number) { this.half.set(Number(v)); }

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
    { v: 12, label: 'December' },
  ]);

  currentYear = computed(() => new Date().getFullYear());
  currentMonth = computed(() => new Date().getMonth() + 1);
  currentQuarter = computed(() => Math.floor((new Date().getMonth()) / 3) + 1);
  currentHalf = computed(() => (new Date().getMonth() < 6 ? 1 : 2));

  quarters = computed(() => [
    { v: 1, label: 'Q1 (Jan 1 - Mar 31)' },
    { v: 2, label: 'Q2 (Apr 1 - Jun 30)' },
    { v: 3, label: 'Q3 (Jul 1 - Sep 30)' },
    { v: 4, label: 'Q4 (Oct 1 - Dec 31)' },
  ]);

  halves = computed(() => [
    { v: 1, label: '1st half (Jan 1 - Jun 30)' },
    { v: 2, label: '2nd half (Jul 1 - Dec 31)' },
  ]);

  years = computed(() => {
    const current = new Date().getFullYear();
    const out: number[] = [];
    for (let i = current; i >= current - 9; i--) out.push(i);
    return out;
  });

  totals = signal<{ totalInvoicedAmount: number; totalActualReceivedAmount: number }>({
    totalInvoicedAmount: 0,
    totalActualReceivedAmount: 0,
  });

  constructor() {
    effect(() => {
      const y = this.year();
      if (y === this.currentYear()) {
        if (this.month() > this.currentMonth()) this.month.set(this.currentMonth());
        if (this.quarter() > this.currentQuarter()) this.quarter.set(this.currentQuarter());
        if (this.half() > this.currentHalf()) this.half.set(this.currentHalf());
      }
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadReport();
  }

  exportCsv() {
    const items: string[] = [];
    const header = ['Invoice Date', 'Invoice Number', 'Invoiced Amount', 'Actual Received Amount'];
    items.push(header.map(escapeCsv).join(','));

    for (const row of this.rows()) {
      const invoiceDate = row.invoiceDate ? new Date(row.invoiceDate).toLocaleDateString() : '-';
      items.push([
        invoiceDate,
        row.invoiceNumber || '-',
        row.invoicedAmount || 0,
        row.actualReceivedAmount || 0,
      ].map(escapeCsv).join(','));
    }

    items.push([
      'TOTAL',
      '',
      this.totals().totalInvoicedAmount,
      this.totals().totalActualReceivedAmount,
    ].map(escapeCsv).join(','));

    const csv = items.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cash-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  exportPdf() {
    const buildTable = () => {
      const decimalPipe = new DecimalPipe('en-US');
      let html = '<table style="width:100%;border-collapse:collapse">';
      html += '<thead><tr><th style="border:1px solid #ddd;padding:8px;background:#f3f4f6">Invoice Date</th><th style="border:1px solid #ddd;padding:8px;background:#f3f4f6">Invoice Number</th><th style="border:1px solid #ddd;padding:8px;background:#f3f4f6">Invoiced Amount</th><th style="border:1px solid #ddd;padding:8px;background:#f3f4f6">Actual Received Amount</th></tr></thead><tbody>';
      for (const row of this.rows()) {
        const invoiceDate = row.invoiceDate ? new Date(row.invoiceDate).toLocaleDateString() : '-';
        html += `<tr><td style="border:1px solid #ddd;padding:8px">${invoiceDate}</td><td style="border:1px solid #ddd;padding:8px">${row.invoiceNumber || '-'}</td><td style="border:1px solid #ddd;padding:8px; text-align: right;">${decimalPipe.transform(row.invoicedAmount || 0, '1.2-2')}</td><td style="border:1px solid #ddd;padding:8px; text-align: right;">${decimalPipe.transform(row.actualReceivedAmount || 0, '1.2-2')}</td></tr>`;
      }
      html += `<tr><td style="border:1px solid #ddd;padding:8px;font-weight:bold">TOTAL</td><td style="border:1px solid #ddd;padding:8px"></td><td style="border:1px solid #ddd;padding:8px;font-weight:bold; text-align: right;">${decimalPipe.transform(this.totals().totalInvoicedAmount || 0, '1.2-2')}</td><td style="border:1px solid #ddd;padding:8px;font-weight:bold; text-align: right;">${decimalPipe.transform(this.totals().totalActualReceivedAmount || 0, '1.2-2')}</td></tr>`;
      html += '</tbody></table>';
      return html;
    };

    const content = `<!doctype html><html><head><meta charset="utf-8"><title>Cash Report</title>` +
      `<style>body{font-family:Arial,Helvetica,sans-serif;margin:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px}th{background:#f3f4f6}</style>` +
      `</head><body><h1>Cash Report</h1>${buildTable()}</body></html>`;
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    printWindow?.document.open();
    printWindow?.document.write(content);
    printWindow?.document.close();
    printWindow?.focus();
    setTimeout(() => {
      printWindow?.print();
    }, 500);
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

    this.loading.set(true);
    try {
      const response = await this.reportService.getCash({ startDate: startIso, endDate: endIso }) as CashReportResponse;
      this.rows.set(response?.items || []);
      this.totals.set({
        totalInvoicedAmount: response?.totalInvoicedAmount || 0,
        totalActualReceivedAmount: response?.totalActualReceivedAmount || 0,
      });
    } catch (error) {
      console.error('Error loading cash report:', error);
      this.rows.set([]);
      this.totals.set({
        totalInvoicedAmount: 0,
        totalActualReceivedAmount: 0,
      });
    } finally {
      this.loading.set(false);
    }
  }
}
