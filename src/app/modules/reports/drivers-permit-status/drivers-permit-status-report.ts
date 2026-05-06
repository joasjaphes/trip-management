import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReportService } from '../../../services/report.service';
import { CompanyProfileService } from '../../../services/company-profile.service';
import { Layout } from '../../../shared/components/layout/layout';
import { Placeholder } from '../../../shared/components/placeholder/placeholder';
import { escapeCsv } from './exports-helper';
import {
  escapeHtml,
  openReportPrintWindow,
  renderBrandedHeader,
  renderReportNote,
} from '../report-print.util';

@Component({
    selector: 'app-drivers-permit-status',
    standalone: true,
    imports: [CommonModule, Layout,Placeholder],
    templateUrl: './drivers-permit-status-report.html',
    styleUrl: './drivers-permit-status-report.css',
})
export class DriversPermitStatusReport implements OnInit {
    private reportService = inject(ReportService);
    private companyService = inject(CompanyProfileService);

    loading = signal(false);
    searchTerm = signal('');
    drivers = signal<any[]>([]);
    filteredDrivers = computed(() => {
        const term = this.normalizeSearchTerm(this.searchTerm());
        const drivers = this.drivers();

        if (!term) {
            return drivers;
        }

        const filtered: any[] = [];

        for (const driver of drivers) {
            const driverName = this.normalizeSearchTerm(driver?.driverName || '');
            const permits = Array.isArray(driver?.permits) ? driver.permits : [];

            if (driverName.includes(term)) {
                filtered.push({ ...driver, permits });
                continue;
            }

            const matchingPermits = permits.filter((permit: any) =>
                this.normalizeSearchTerm(permit?.permitName || '').includes(term)
            );

            if (matchingPermits.length > 0) {
                filtered.push({ ...driver, permits: matchingPermits });
            }
        }

        return filtered;
    });

    get hasSearchTerm(): boolean {
        return this.searchTerm().trim().length > 0;
    }

    ngOnInit() {
        this.loadReport().then();
    }

    async loadReport(): Promise<void> {
        this.loading.set(true);
        try {
            const data = await this.reportService.getDriversPermitStatus();

            this.drivers.set(data || []);
            console.log('Loaded drivers permit status report data:', this.drivers()); // Debug log
        } catch (e) {
            console.error('Failed to load drivers permit status', e);
            this.drivers.set([]);
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
        const header = ['Driver Name','Phone','Permit','Expiry Date','Days Remaining','Status'];
        items.push(header.map(escapeCsv).join(','));

        for (const d of this.filteredDrivers()) {
            const permits = d?.permits || [];
            for (const p of permits) {
                const days = p.daysToExpiry ?? p.daysRemaining ?? '';
                const expiry = p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : '';
                const row = [d.driverName || '', d.phoneNumber || '', p.permitName || '', expiry, days, this.getBadgeLabel(days === '' ? null : Number(days))];
                items.push(row.map(escapeCsv).join(','));
            }
        }

        const csv = items.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `drivers-permit-status-${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    exportPdf() {
        openReportPrintWindow('Drivers Permit Status', this.renderReportBody());
    }

    private renderReportBody(): string {
        const profile = this.companyService.profile();
        const datePipe = new DatePipe('en-US');
        const formatDate = (v: unknown) => {
            if (!v) return '-';
            const d = new Date(v as string);
            return Number.isNaN(d.getTime()) ? '-' : (datePipe.transform(d, 'dd/MM/yyyy') ?? '-');
        };

        const drivers = this.filteredDrivers();
        const totalPermits = drivers.reduce((sum, d) => sum + ((d?.permits || []).length), 0);
        const searchTerm = this.searchTerm().trim();

        const rowsHtml = totalPermits === 0
            ? `<tr><td class="cell center" colspan="6" style="padding:24px;color:#888;">No driver permits to display.</td></tr>`
            : drivers.map((d: any) => {
                const permits = (d?.permits || []) as any[];
                if (permits.length === 0) return '';
                return permits.map((p, idx) => {
                    const days = p.daysToExpiry ?? p.daysRemaining ?? null;
                    const numericDays = days === null || days === '' ? null : Number(days);
                    const badgeClass = this.getPdfBadgeClass(numericDays);
                    const badgeLabel = this.getBadgeLabel(numericDays);
                    const driverCell = idx === 0
                        ? `<td class="cell" rowspan="${permits.length}"><strong>${escapeHtml(d.driverName || '-')}</strong></td><td class="cell" rowspan="${permits.length}">${escapeHtml(d.phoneNumber || '-')}</td>`
                        : '';
                    return `
                        <tr>
                            ${driverCell}
                            <td class="cell">${escapeHtml(p.permitName || '-')}</td>
                            <td class="cell">${formatDate(p.expiryDate)}</td>
                            <td class="cell center">${days === null || days === '' ? '-' : escapeHtml(String(days))}</td>
                            <td class="cell center"><span class="status-badge ${badgeClass}">${escapeHtml(badgeLabel)}</span></td>
                        </tr>`;
                }).join('');
            }).join('');

        return `
        <div class="report-document">
            ${renderBrandedHeader(profile)}

            <h2 class="report-title">Drivers Permit Status</h2>

            <table class="meta-table">
                <tr>
                    <td class="cell" style="width: 33%;">
                        <div class="cell-label">Total Drivers</div>
                        <div class="cell-value bold">${drivers.length}</div>
                    </td>
                    <td class="cell" style="width: 33%;">
                        <div class="cell-label">Total Permits</div>
                        <div class="cell-value bold">${totalPermits}</div>
                    </td>
                    <td class="cell" style="width: 34%;">
                        <div class="cell-label">Filter</div>
                        <div class="cell-value bold">${searchTerm ? escapeHtml(searchTerm) : 'All Drivers'}</div>
                    </td>
                </tr>
            </table>

            <table class="items-table">
                <thead>
                    <tr>
                        <th class="cell head" style="width: 22%;">Driver</th>
                        <th class="cell head" style="width: 14%;">Phone</th>
                        <th class="cell head" style="width: 24%;">Permit</th>
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
