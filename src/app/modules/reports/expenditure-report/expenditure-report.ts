import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../../services/report.service';
import { CompanyProfileService } from '../../../services/company-profile.service';
import { Layout } from '../../../shared/components/layout/layout';
import { Placeholder } from '../../../shared/components/placeholder/placeholder';
import { escapeCsv } from '../drivers-permit-status/exports-helper';

type PeriodType = 'custom' | 'monthly' | 'quarterly' | 'semiannual' | 'yearly';

@Component({
  selector: 'app-expenditure-report',
  standalone: true,
  imports: [CommonModule, Layout, Placeholder, DecimalPipe, FormsModule],
  templateUrl: './expenditure-report.html',
  styleUrl: './expenditure-report.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenditureReport implements OnInit {
  private reportService = inject(ReportService);
  private companyService = inject(CompanyProfileService);

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

  grandTotal = signal(0);
  expanded = signal<number | null>(null);

 

  toggleRow(i: number) {
    this.expanded.set(this.expanded() === i ? null : i);
  }

  exportCsv() {
    const items: string[] = [];
    const header = ['Item', 'Total'];
    items.push(header.map(escapeCsv).join(','));
    for (const r of this.rows()) {
      items.push([r.itemName || r.itemId, r.total].map(escapeCsv).join(','));
    }
    const csv = items.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenditure-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  exportPdf() {
    const label = this.periodLabel();
    this.openPrintWindow(`Expenditure Report - ${label}`, this.renderReportBody());
  }

  private periodLabel(): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const y = this.year();
    switch (this.period()) {
      case 'monthly':
        return `${months[this.month() - 1]} ${y}`;
      case 'quarterly':
        return `Q${this.quarter()} ${y}`;
      case 'semiannual':
        return `${this.half() === 1 ? '1st' : '2nd'} Half ${y}`;
      case 'yearly':
        return `Year ${y}`;
      case 'custom':
      default: {
        const datePipe = new DatePipe('en-US');
        const start = this.customStart() ? new Date(this.customStart()) : null;
        const end = this.customEnd() ? new Date(this.customEnd()) : null;
        if (!start || !end) return 'Custom Range';
        return `${datePipe.transform(start, 'dd MMM yyyy')} — ${datePipe.transform(end, 'dd MMM yyyy')}`;
      }
    }
  }

  private renderReportBody(): string {
    const profile = this.companyService.profile();
    const datePipe = new DatePipe('en-US');
    const numberPipe = new DecimalPipe('en-US');
    const formatAmount = (v: unknown) => numberPipe.transform(Number(v) || 0, '1.2-2') ?? '0.00';
    const formatDate = (value: Date | null | undefined) =>
      value ? datePipe.transform(value, 'dd/MM/yyyy') ?? '-' : '-';

    const range = this.periodRange();
    const periodLabel = this.periodLabel();

    const fallbackLogoUrl = `${window.location.origin}/assets/images/easytruckinglogo.png`;
    const logoUrl = profile?.logoUrl || fallbackLogoUrl;
    const logoBlock = `<img src="${this.escape(logoUrl)}" alt="Logo" style="height: 88px; object-fit: contain;">`;

    const companyName = profile?.companyName || 'EASY TRUCKING LIMITED';
    const companyAddress1 = profile?.street || '';
    const companyAddress2 = profile?.region || '';
    const companyAddress3 = profile
      ? `P. O. BOX ${profile?.postalAddress || ''} ${profile?.country || ''}`.trim()
      : '';
    const companyTIN = profile?.tin ? `TIN ${profile.tin}` : '';
    const companyVRN = profile?.vrn ? `VRN ${profile.vrn}` : '';

    const categoryRowsHtml = this.rows().length === 0
      ? `<tr><td class="cell center" colspan="2" style="padding: 24px; color:#888;">No expenditure recorded in this period.</td></tr>`
      : this.rows().map((r) => {
          const items = (r.items as Array<{ itemName?: string; itemId?: string; totalAmount?: number }>) || [];
          const itemsHtml = items.map((i) => `
            <tr class="item-row">
              <td class="cell item-name">${this.escape(i.itemName || i.itemId || '-')}</td>
              <td class="cell right item-amount">${formatAmount(i.totalAmount)}</td>
            </tr>`).join('');

          return `
            <tr class="category-row">
              <td class="cell category-name">${this.escape(r.itemName || '-')}</td>
              <td class="cell right category-total">${formatAmount(r.total)}</td>
            </tr>
            ${itemsHtml}
          `;
        }).join('');

    return `
    <div class="report-document">
      <div class="report-header">
        <div class="header-left">${logoBlock}</div>
        <div class="header-right">
          <h1 class="company-name">${this.escape(companyName)}</h1>
          ${companyAddress1 ? `<p class="company-line">${this.escape(companyAddress1)}</p>` : ''}
          ${companyAddress2 ? `<p class="company-line">${this.escape(companyAddress2)}</p>` : ''}
          ${companyAddress3 ? `<p class="company-line">${this.escape(companyAddress3)}</p>` : ''}
          ${companyTIN ? `<p class="company-line">${this.escape(companyTIN)}${companyVRN ? ' &nbsp; • &nbsp; ' + this.escape(companyVRN) : ''}</p>` : ''}
        </div>
      </div>

      <h2 class="report-title">Expenditure Report</h2>

      <table class="meta-table">
        <tr>
          <td class="cell" style="width: 50%;">
            <div class="cell-label">Period</div>
            <div class="cell-value bold">${this.escape(periodLabel)}</div>
          </td>
          <td class="cell" style="width: 50%;">
            <div class="cell-label">Date Range</div>
            <div class="cell-value bold">${formatDate(range.start)} — ${formatDate(range.end)}</div>
          </td>
        </tr>
      </table>

      <table class="items-table">
        <thead>
          <tr>
            <th class="cell head" style="width: 70%;">Category / Item</th>
            <th class="cell head right" style="width: 30%;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${categoryRowsHtml}
          <tr class="grand-total-row">
            <td class="cell bold">GRAND TOTAL</td>
            <td class="cell right bold">${formatAmount(this.grandTotal())}</td>
          </tr>
        </tbody>
      </table>

      <div class="report-footer">
        <div class="signature">
          <div class="signature-line"></div>
          <div class="signature-label">Prepared By</div>
        </div>
        <div class="signature">
          <div class="signature-line"></div>
          <div class="signature-label">Reviewed By</div>
        </div>
        <div class="signature">
          <div class="signature-line"></div>
          <div class="signature-label">Approved By</div>
        </div>
      </div>

      <p class="report-note">This document was generated by the Trip Management System on ${formatDate(new Date())}.</p>
    </div>`;
  }

  private renderPrintShell(title: string, body: string): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${this.escape(title)}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    body { font-family: Arial, Helvetica, sans-serif; margin: 0; color: #000; background: #fff; font-size: 13px; }
    .report-document { width: 100%; max-width: 210mm; margin: 0 auto; }

    .report-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; border-bottom: 4px solid #000; padding-bottom: 12px; margin-bottom: 12px; }
    .header-left { width: 30%; }
    .header-right { width: 70%; padding-left: 12px; }
    .company-name { font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.025em; margin: 0; }
    .company-line { font-size: 13px; margin: 2px 0; }

    .report-title { text-align: center; font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin: 16px 0 12px; }

    table { width: 100%; border-collapse: collapse; }
    .meta-table, .items-table { border: 1px solid #000; }
    .items-table { border-top: 0; }

    .cell { border: 1px solid #000; padding: 8px; vertical-align: top; }
    .cell.head { background: #f0f0f0; font-weight: 800; text-transform: uppercase; font-size: 12px; }
    .cell.head.right { text-align: right; }
    .cell-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #444; }
    .cell-value { font-size: 14px; margin-top: 4px; }
    .bold { font-weight: 700; }
    .right { text-align: right; }
    .center { text-align: center; }

    .items-table thead tr { page-break-inside: avoid; }
    .items-table tbody tr { page-break-inside: avoid; }

    .category-row td { background: #fff7f2; font-weight: 800; font-size: 14px; }
    .category-name { color: #000; }
    .category-total { color: #f25f2f; }

    .item-row td { font-size: 12.5px; color: #333; padding: 6px 8px; }
    .item-row .item-name { padding-left: 28px; }

    .grand-total-row td { background: #f25f2f; color: #fff; font-size: 16px; font-weight: 800; padding: 12px 8px; border-color: #f25f2f; }

    .report-footer { display: flex; justify-content: space-between; gap: 40px; margin-top: 56px; }
    .signature { flex: 1; text-align: center; }
    .signature-line { border-top: 1px solid #000; height: 1px; margin-bottom: 6px; }
    .signature-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }

    .report-note { font-size: 10px; color: #666; text-align: center; margin-top: 36px; font-style: italic; }

    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  </style>
</head>
<body>
  ${body}
</body>
</html>`;
  }

  private openPrintWindow(title: string, body: string) {
    const win = window.open('', '_blank', 'width=980,height=760');
    if (!win) return;
    win.document.open();
    win.document.write(this.renderPrintShell(title, body));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  }

  private escape(value: string | null | undefined): string {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async ngOnInit(): Promise < void> {
    console.log('this month', this.month(), 'quarter', this.quarter(), 'half', this.half());
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
      const resp = await this.reportService.getExpenditure({ startDate: startIso, endDate: endIso });
      console.log('Expenditure report response', resp);
      this.rows.set([
        {
          itemName: 'Purchases',
          total: resp?.purchases?.total,
          items: resp?.purchases?.items || [],
        },
        {
          itemName: 'Office Expenses',
          total: resp?.officeExpenses?.total,
          items: resp?.officeExpenses?.items || [],
        },
        {
          itemName: 'Trip Expenses',
          total: resp?.tripExpenses?.total,
          items: resp?.tripExpenses?.items || [],
        }
      ])
      this.grandTotal.set(resp.grandTotal || 0);
      //   this.rows.set(resp|| []);
    } catch (e) {
      console.error('Failed to load expenditure', e);
      this.rows.set([]);
    } finally {
      this.loading.set(false);
    }
  }
}
