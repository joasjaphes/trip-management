import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../../services/report.service';
import { CompanyProfileService } from '../../../services/company-profile.service';
import { Layout } from '../../../shared/components/layout/layout';
import { Placeholder } from '../../../shared/components/placeholder/placeholder';
import { escapeCsv } from '../drivers-permit-status/exports-helper';
import {
  escapeHtml,
  formatPeriodLabel,
  openReportPrintWindow,
  renderBrandedHeader,
  renderPeriodMeta,
  renderReportNote,
} from '../report-print.util';

type PeriodType = 'custom' | 'monthly' | 'quarterly' | 'semiannual' | 'yearly';

interface VehicleIncomeVsMaintenanceItem {
  registrationNo?: string;
  truckAndTrailer?: string;
  revenue?: number;
  tripExpenses?: number;
  maintenanceCost?: number;
  grossIncome?: number;
}

interface VehicleIncomeVsMaintenanceResponse {
  items?: VehicleIncomeVsMaintenanceItem[];
  totalRevenue?: number;
  totalTripExpenses?: number;
  totalMaintenanceCost?: number;
  totalGrossIncome?: number;
}

@Component({
  selector: 'app-vehicle-income-vs-maintenance-report',
  imports: [CommonModule, Layout, Placeholder, DecimalPipe, FormsModule],
  templateUrl: './vehicle-income-vs-maintenance-report.html',
  styleUrl: './vehicle-income-vs-maintenance-report.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehicleIncomeVsMaintenanceReport implements OnInit {
  private reportService = inject(ReportService);
  private companyService = inject(CompanyProfileService);

  loading = signal(false);
  searchTerm = signal('');
  rows = signal<VehicleIncomeVsMaintenanceItem[]>([]);
  totals = signal({
    totalRevenue: 0,
    totalTripExpenses: 0,
    totalMaintenanceCost: 0,
    totalGrossIncome: 0,
  });

  period = signal<PeriodType>('monthly');
  year = signal<number>(new Date().getFullYear());
  month = signal<number>(new Date().getMonth() + 1);
  quarter = signal<number>(Math.floor((new Date().getMonth()) / 3) + 1);
  half = signal<number>(new Date().getMonth() < 6 ? 1 : 2);
  customStart = signal<string>('');
  customEnd = signal<string>('');

  filteredRows = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.rows();

    return this.rows().filter((row) => {
      const registration = row.registrationNo || row.truckAndTrailer || '';
      return registration.toLowerCase().includes(term);
    });
  });

  filteredTotals = computed(() => this.filteredRows().reduce((totals, row) => ({
    totalRevenue: totals.totalRevenue + (row.revenue || 0),
    totalTripExpenses: totals.totalTripExpenses + (row.tripExpenses || 0),
    totalMaintenanceCost: totals.totalMaintenanceCost + (row.maintenanceCost || 0),
    totalGrossIncome: totals.totalGrossIncome + (row.grossIncome || 0),
  }), {
    totalRevenue: 0,
    totalTripExpenses: 0,
    totalMaintenanceCost: 0,
    totalGrossIncome: 0,
  }));

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

  updateSearchTerm(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.searchTerm.set(target?.value ?? '');
  }

  exportCsv() {
    const items: string[] = [];
    const totals = this.filteredTotals();
    items.push(['Truck & Trailer', 'Trip Revenue (TZS)', 'Vehicle Maintenance Cost (TZS)', 'Trip Expenses (TZS)', 'Gross Income (TZS)'].map(escapeCsv).join(','));

    for (const row of this.filteredRows()) {
      items.push([
        row.truckAndTrailer || '-',
        row.revenue || 0,
        row.maintenanceCost || 0,
        row.tripExpenses || 0,
        row.grossIncome || 0,
      ].map(escapeCsv).join(','));
    }

    items.push(['TOTAL', totals.totalRevenue, totals.totalMaintenanceCost, totals.totalTripExpenses, totals.totalGrossIncome].map(escapeCsv).join(','));

    const csv = items.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vehicle-income-vs-expenses-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  exportPdf() {
    const label = formatPeriodLabel({
      type: this.period(),
      year: this.year(),
      month: this.month(),
      quarter: this.quarter(),
      half: this.half(),
      customStart: this.customStart(),
      customEnd: this.customEnd(),
    });
    openReportPrintWindow(`Vehicle Income vs Expenses Report - ${label}`, this.renderReportBody(label));
  }

  private renderReportBody(periodLabel: string): string {
    const profile = this.companyService.profile();
    const numberPipe = new DecimalPipe('en-US');
    const formatAmount = (v: unknown) => numberPipe.transform(Number(v) || 0, '1.2-2') ?? '0.00';
    const range = this.periodRange();
    const rows = this.filteredRows();
    const totals = this.filteredTotals();

    const rowsHtml = rows.length === 0
      ? `<tr><td class="cell center" colspan="5" style="padding:24px;color:#888;">No vehicle income data available</td></tr>`
      : rows.map((row) => `
          <tr>
            <td class="cell">${escapeHtml(row.truckAndTrailer || '-')}</td>
            <td class="cell right">${formatAmount(row.revenue)}</td>
            <td class="cell right">${formatAmount(row.maintenanceCost)}</td>
            <td class="cell right">${formatAmount(row.tripExpenses)}</td>
            <td class="cell right">${formatAmount(row.grossIncome)}</td>
          </tr>`).join('');

    return `            
    <div class="report-document">
      ${renderBrandedHeader(profile)}

      <h2 class="report-title">Vehicle Income vs Expenses Report</h2>

      ${renderPeriodMeta(periodLabel, range.start, range.end)}

      <table class="items-table">
        <thead>
          <tr>
            <th class="cell head" style="width: 34%;">Vehicle</th>
            <th class="cell head right" style="width: 17%;">Trips Revenue (TZS)</th>
            <th class="cell head right" style="width: 17%;">Vehicle Maintenance Cost (TZS)</th>
            <th class="cell head right" style="width: 16%;">Trips Expenses (TZS)</th>
            <th class="cell head right" style="width: 16%;">Gross Income (TZS)</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr class="grand-total-row">
            <td class="cell bold">GRAND TOTAL (TZS)</td>
            <td class="cell right bold">${formatAmount(totals.totalRevenue)}</td>
            <td class="cell right bold">${formatAmount(totals.totalMaintenanceCost)}</td>
            <td class="cell right bold">${formatAmount(totals.totalTripExpenses)}</td>
            <td class="cell right bold">${formatAmount(totals.totalGrossIncome)}</td>
          </tr>
        </tbody>
      </table>

      ${renderReportNote()}
    </div>`;
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
      const response = await this.reportService.getVehicleIncomeVsMaintenance({ startDate: startIso, endDate: endIso }) as VehicleIncomeVsMaintenanceResponse;
      this.rows.set(response?.items || []);
      this.totals.set({
        totalRevenue: response?.totalRevenue || 0,
        totalTripExpenses: response?.totalTripExpenses || 0,
        totalMaintenanceCost: response?.totalMaintenanceCost || 0,
        totalGrossIncome: response?.totalGrossIncome || 0,
      });
    } catch (error) {
      console.error('Error loading vehicle income vs expenses report:', error);
      this.rows.set([]);
      this.totals.set({
        totalRevenue: 0,
        totalTripExpenses: 0,
        totalMaintenanceCost: 0,
        totalGrossIncome: 0,
      });
    } finally {
      this.loading.set(false);
    }
  }
}