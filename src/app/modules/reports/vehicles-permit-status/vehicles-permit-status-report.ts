import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../../services/report.service';
import { Layout } from '../../../shared/components/layout/layout';
import { escapeCsv } from '../drivers-permit-status/exports-helper';
import { Placeholder } from '../../../shared/components/placeholder/placeholder';

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
    if (daysRemaining > 60) return 'bg-green-100 text-green-800';
    if (daysRemaining >= 30) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }

  getBadgeLabel(daysRemaining: number | null | undefined): string {
    if (daysRemaining == null) return '—';
    if (daysRemaining > 60) return 'Good';
    if (daysRemaining >= 30) return 'Warning';
    return 'Critical';
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
    const buildTable = () => {
      let html = '<table style="width:100%;border-collapse:collapse">';
      html += '<thead><tr>' +
        '<th style="border:1px solid #ddd;padding:8px;background:#f3f4f6">Registration</th>' +
        '<th style="border:1px solid #ddd;padding:8px;background:#f3f4f6">Type</th>' +
        '<th style="border:1px solid #ddd;padding:8px;background:#f3f4f6">Permit</th>' +
        '<th style="border:1px solid #ddd;padding:8px;background:#f3f4f6">Expiry</th>' +
        '<th style="border:1px solid #ddd;padding:8px;background:#f3f4f6">Days Remaining</th>' +
        '<th style="border:1px solid #ddd;padding:8px;background:#f3f4f6">Status</th>' +
        '</tr></thead><tbody>';

      for (const v of this.filteredVehicles()) {
        const permits = v?.permits || [v];
        let first = true;
        for (const p of permits) {
          html += '<tr>';
          if (first) {
            html += `<td style="border:1px solid #ddd;padding:8px" rowspan="${permits.length}">${v.registrationNo || v.registration || ''}</td>`;
            html += `<td style="border:1px solid #ddd;padding:8px" rowspan="${permits.length}">${v.vehicleType || ''}</td>`;
            first = false;
          }
          const expiry = p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : '';
          const days = p.daysToExpiry ?? p.daysRemaining ?? '';
          html += `<td style="border:1px solid #ddd;padding:8px">${p.permitName || p.name || ''}</td>`;
          html += `<td style="border:1px solid #ddd;padding:8px">${expiry}</td>`;
          html += `<td style="border:1px solid #ddd;padding:8px;text-align:center">${days}</td>`;
          html += `<td style="border:1px solid #ddd;padding:8px;text-align:center">${this.getBadgeLabel(days === '' ? null : Number(days))}</td>`;
          html += '</tr>';
        }
      }

      html += '</tbody></table>';
      return html;
    };

    const content = `<!doctype html><html><head><meta charset="utf-8"><title>Vehicles Permit Status</title>` +
      `<style>body{font-family:Arial,Helvetica,sans-serif;margin:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px}th{background:#f3f4f6}</style>` +
      `</head><body><h1>Vehicles Permit Status</h1>${buildTable()}</body></html>`;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}
