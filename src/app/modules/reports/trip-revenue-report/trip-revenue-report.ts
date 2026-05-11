import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../../services/report.service';
import { Layout } from '../../../shared/components/layout/layout';
import { Placeholder } from '../../../shared/components/placeholder/placeholder';
import { escapeCsv } from '../drivers-permit-status/exports-helper';

type PeriodType = 'custom' | 'monthly' | 'quarterly' | 'semiannual' | 'yearly';

@Component({
  selector: 'app-trip-revenue-report',
  standalone: true,
  imports: [CommonModule, Layout, Placeholder, DecimalPipe, FormsModule],
  templateUrl: './trip-revenue-report.html',
  styleUrl: './trip-revenue-report.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TripRevenueReport implements OnInit {
  private reportService = inject(ReportService);

  loading = signal(false);
  rows = signal<any[]>([]);

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

  totals = signal<{ totalTripRevenue: number; totalTripExpenses: number; totalNetIncome: number }>({
    totalTripRevenue: 0,
    totalTripExpenses: 0,
    totalNetIncome: 0,
  });

  exportCsv() {
    const items: string[] = [];
    const header = ['Trip Date', 'Trip Number', 'Route', 'Customer Name', 'Trip Revenue', 'Total Trip Expenses', 'Net Income'];
    items.push(header.map(escapeCsv).join(','));
    for (const r of this.rows()) {
      items.push([r.tripDate, r.tripNumber, r.route, r.customerName, r.tripRevenue, r.totalTripExpenses, r.netIncome].map(escapeCsv).join(','));
    }
    items.push(['', '', '', 'TOTAL', this.totals().totalTripRevenue, this.totals().totalTripExpenses, this.totals().totalNetIncome].map(escapeCsv).join(','));
    const csv = items.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trip-revenue-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  exportPdf() {
    const buildTable = () => {
      const decimalPipe = new DecimalPipe('en-US');
      let html = '<table style="width:100%;border-collapse:collapse">';
      html += '<thead><tr><th style="border:1px solid #ddd;padding:8px;background:#f3f4f6">Trip Date</th><th style="border:1px solid #ddd;padding:8px;background:#f3f4f6">Trip Number</th><th style="border:1px solid #ddd;padding:8px;background:#f3f4f6">Route</th><th style="border:1px solid #ddd;padding:8px;background:#f3f4f6">Customer</th><th style="border:1px solid #ddd;padding:8px;background:#f3f4f6">Revenue</th><th style="border:1px solid #ddd;padding:8px;background:#f3f4f6">Expenses</th><th style="border:1px solid #ddd;padding:8px;background:#f3f4f6">Net Income</th></tr></thead><tbody>';
      for (const r of this.rows()) {
        const tripDate = new Date(r.tripDate).toLocaleDateString();
        html += `<tr><td style="border:1px solid #ddd;padding:8px">${tripDate}</td><td style="border:1px solid #ddd;padding:8px">${r.tripNumber}</td><td style="border:1px solid #ddd;padding:8px">${r.route}</td><td style="border:1px solid #ddd;padding:8px">${r.customerName}</td><td style="border:1px solid #ddd;padding:8px; text-align: right;">${decimalPipe.transform(r.tripRevenue || 0, '1.2-2')}</td><td style="border:1px solid #ddd;padding:8px; text-align: right;">${decimalPipe.transform(r.totalTripExpenses || 0, '1.2-2')}</td><td style="border:1px solid #ddd;padding:8px; text-align: right;">${decimalPipe.transform(r.netIncome || 0, '1.2-2')}</td></tr>`;
      }
      html += `<tr><td style="border:1px solid #ddd;padding:8px;font-weight:bold" colspan="4">TOTAL</td><td style="border:1px solid #ddd;padding:8px;font-weight:bold; text-align: right;">${decimalPipe.transform(this.totals().totalTripRevenue || 0, '1.2-2')}</td><td style="border:1px solid #ddd;padding:8px;font-weight:bold; text-align: right;">${decimalPipe.transform(this.totals().totalTripExpenses || 0, '1.2-2')}</td><td style="border:1px solid #ddd;padding:8px;font-weight:bold; text-align: right;">${decimalPipe.transform(this.totals().totalNetIncome || 0, '1.2-2')}</td></tr>`;
      html += '</tbody></table>';
      return html;
    }
    const content = `<!doctype html><html><head><meta charset="utf-8"><title>Trip Revenue</title>` +
      `<style>body{font-family:Arial,Helvetica,sans-serif;margin:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px}th{background:#f3f4f6}</style>` +
      `</head><body><h1>Trip Revenue Report</h1>${buildTable()}</body></html>`;
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

    this.loading.set(true);
    try {
      const resp = await this.reportService.getTripRevenue({ startDate: startIso, endDate: endIso });
      console.log('Trip revenue report response', resp);
      this.rows.set(resp?.items || []);
      this.totals.set({
        totalTripRevenue: resp?.totalTripRevenue || 0,
        totalTripExpenses: resp?.totalTripExpenses || 0,
        totalNetIncome: resp?.totalNetIncome || 0,
      });
    } catch (error) {
      console.error('Error loading trip revenue report:', error);
      this.rows.set([]);
    } finally {
      this.loading.set(false);
    }
  }
}
