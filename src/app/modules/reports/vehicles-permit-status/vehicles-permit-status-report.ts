import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReportService } from '../../../services/report.service';
import { CompanyProfileService } from '../../../services/company-profile.service';
import { Layout } from '../../../shared/components/layout/layout';
import { escapeCsv } from '../drivers-permit-status/exports-helper';
import { Placeholder } from '../../../shared/components/placeholder/placeholder';
import {
  escapeHtml,
  openReportPrintWindow,
  renderBrandedHeader,
  renderReportNote,
} from '../report-print.util';

@Component({
  selector: 'app-vehicles-permit-status',
  standalone: true,
  imports: [CommonModule, Layout, Placeholder],
  templateUrl: './vehicles-permit-status-report.html',
  styleUrl: './vehicles-permit-status-report.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehiclesPermitStatusReport implements OnInit {
  private reportService = inject(ReportService);
  private companyService = inject(CompanyProfileService);

  loading = signal(false);
  searchTerm = signal('');
  vehicles = signal<any[]>([]);
  filteredVehicles = computed(() => {
    const term = this.normalizeSearchTerm(this.searchTerm());
    const vehicles = this.vehicles();

    if (!term) {
      return vehicles;
    }

    const filtered: any[] = [];

    for (const vehicle of vehicles) {
      const permits = Array.isArray(vehicle?.permits) ? vehicle.permits : [vehicle];
      const registration = this.normalizeSearchTerm(vehicle?.registrationNo || vehicle?.registration || '');
      const vehicleType = this.normalizeSearchTerm(vehicle?.vehicleType || vehicle?.type || '');

      if (registration.includes(term) || vehicleType.includes(term)) {
        filtered.push({ ...vehicle, permits });
        continue;
      }

      const matchingPermits = permits.filter((permit: any) =>
        this.normalizeSearchTerm(permit?.permitName || permit?.name || '').includes(term)
      );

      if (matchingPermits.length > 0) {
        filtered.push({ ...vehicle, permits: matchingPermits });
      }
    }

    return filtered;
  });

  get hasSearchTerm(): boolean {
    return this.searchTerm().trim().length > 0;
  }

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const data = await this.reportService.getVehiclesPermitStatus();
      this.vehicles.set(data || []);
    } catch (e) {
      console.error('Failed to load vehicles permit status', e);
      this.vehicles.set([]);
    }
    this.loading.set(false);
  }

  updateSearchTerm(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.searchTerm.set(target?.value ?? '');
  }

  private normalizeSearchTerm(value: unknown): string {
    return String(value ?? '').trim().toLowerCase();
  }

  getBadgeColor(daysRemaining: number | null | undefined): string {
    if (daysRemaining == null) return 'bg-gray-200 text-gray-800';
    if (daysRemaining >= 60) return 'bg-green-100 text-green-800';
    if (daysRemaining >= 1 && daysRemaining <= 30) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }

  getBadgeLabel(daysRemaining: number | null | undefined): string {
    if (daysRemaining == null) return '—';
    if (daysRemaining >= 60) return 'Good';
    if (daysRemaining >= 1 && daysRemaining <= 30) return 'Warning';
    return 'Expired';
  }

  exportCsv() {
    const items: string[] = [];
    const header = ['Registration', 'Vehicle Type', 'Permit', 'Expiry Date', 'Days Remaining', 'Status'];
    items.push(header.map(escapeCsv).join(','));

    for (const v of this.filteredVehicles()) {
      const permits = v?.permits || (Array.isArray(v) ? v : [v]);
      for (const p of permits) {
        const days = p.daysToExpiry ?? p.daysRemaining ?? '';
        const expiry = p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : '';
        const row = [v.registrationNo || v.registration || '', v.vehicleType || '', p.permitName || p.name || '', expiry, days, this.getBadgeLabel(days === '' ? null : Number(days))];
        items.push(row.map(escapeCsv).join(','));
      }
    }

    const csv = items.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vehicles-permit-status-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  exportPdf() {
    openReportPrintWindow('Vehicles Permit Status', this.renderReportBody());
  }

  private renderReportBody(): string {
    const profile = this.companyService.profile();
    const datePipe = new DatePipe('en-US');
    const formatDate = (v: unknown) => {
      if (!v) return '-';
      const d = new Date(v as string);
      return Number.isNaN(d.getTime()) ? '-' : (datePipe.transform(d, 'dd/MM/yyyy') ?? '-');
    };

    const vehicles = this.filteredVehicles();
    const totalPermits = vehicles.reduce((sum, v) => sum + ((v?.permits || []).length), 0);
    const searchTerm = this.searchTerm().trim();

    const rowsHtml = totalPermits === 0
      ? `<tr><td class="cell center" colspan="6" style="padding:24px;color:#888;">No vehicle permits to display.</td></tr>`
      : vehicles.map((v: any) => {
          const permits = (v?.permits || []) as any[];
          if (permits.length === 0) return '';
          return permits.map((p, idx) => {
            const days = p.daysToExpiry ?? p.daysRemaining ?? null;
            const numericDays = days === null || days === '' ? null : Number(days);
            const badgeClass = this.getPdfBadgeClass(numericDays);
            const badgeLabel = this.getBadgeLabel(numericDays);
            const vehicleCell = idx === 0
              ? `<td class="cell" rowspan="${permits.length}"><strong>${escapeHtml(v.registrationNo || v.registration || '-')}</strong></td><td class="cell" rowspan="${permits.length}">${escapeHtml(v.vehicleType || '-')}</td>`
              : '';
            return `
              <tr>
                ${vehicleCell}
                <td class="cell">${escapeHtml(p.permitName || p.name || '-')}</td>
                <td class="cell">${formatDate(p.expiryDate)}</td>
                <td class="cell center">${days === null || days === '' ? '-' : escapeHtml(String(days))}</td>
                <td class="cell center"><span class="status-badge ${badgeClass}">${escapeHtml(badgeLabel)}</span></td>
              </tr>`;
          }).join('');
        }).join('');

    return `
    <div class="report-document">
      ${renderBrandedHeader(profile)}

      <h2 class="report-title">Vehicles Permit Status</h2>

      <table class="meta-table">
        <tr>
          <td class="cell" style="width: 33%;">
            <div class="cell-label">Total Vehicles</div>
            <div class="cell-value bold">${vehicles.length}</div>
          </td>
          <td class="cell" style="width: 33%;">
            <div class="cell-label">Total Permits</div>
            <div class="cell-value bold">${totalPermits}</div>
          </td>
          <td class="cell" style="width: 34%;">
            <div class="cell-label">Filter</div>
            <div class="cell-value bold">${searchTerm ? escapeHtml(searchTerm) : 'All Vehicles'}</div>
          </td>
        </tr>
      </table>

      <table class="items-table">
        <thead>
          <tr>
            <th class="cell head" style="width: 18%;">Registration</th>
            <th class="cell head" style="width: 14%;">Type</th>
            <th class="cell head" style="width: 28%;">Permit</th>
            <th class="cell head" style="width: 14%;">Expiry Date</th>
            <th class="cell head center" style="width: 12%;">Days Left</th>
            <th class="cell head center" style="width: 14%;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      ${renderReportNote()}
    </div>`;
  }

  private getPdfBadgeClass(days: number | null): string {
    if (days === null) return 'status-warning';
    if (days > 60) return 'status-good';
    if (days >= 30) return 'status-warning';
    return 'status-critical';
  }
}
