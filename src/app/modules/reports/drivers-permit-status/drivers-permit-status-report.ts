import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../../services/report.service';
import { Layout } from '../../../shared/components/layout/layout';
import { Placeholder } from '../../../shared/components/placeholder/placeholder';
import { escapeCsv } from './exports-helper';

@Component({
    selector: 'app-drivers-permit-status',
    standalone: true,
    imports: [CommonModule, Layout,Placeholder],
    templateUrl: './drivers-permit-status-report.html',
    styleUrl: './drivers-permit-status-report.css',
})
export class DriversPermitStatusReport implements OnInit {
    private reportService = inject(ReportService);

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
        const buildTable = () => {
            let html = '<table style="width:100%;border-collapse:collapse">';
            html += '<thead><tr>' +
                '<th style="border:1px solid #ddd;padding:8px;background:#f3f4f6">Driver</th>' +
                '<th style="border:1px solid #ddd;padding:8px;background:#f3f4f6">Phone</th>' +
                '<th style="border:1px solid #ddd;padding:8px;background:#f3f4f6">Permit</th>' +
                '<th style="border:1px solid #ddd;padding:8px;background:#f3f4f6">Expiry</th>' +
                '<th style="border:1px solid #ddd;padding:8px;background:#f3f4f6">Days Remaining</th>' +
                '<th style="border:1px solid #ddd;padding:8px;background:#f3f4f6">Status</th>' +
                '</tr></thead><tbody>';

            for (const d of this.filteredDrivers()) {
                const permits = d?.permits || [];
                let first = true;
                for (const p of permits) {
                    html += '<tr>';
                    if (first) {
                        html += `<td style="border:1px solid #ddd;padding:8px" rowspan="${permits.length}">${d.driverName || ''}</td>`;
                        html += `<td style="border:1px solid #ddd;padding:8px" rowspan="${permits.length}">${d.phoneNumber || ''}</td>`;
                        first = false;
                    }
                    const expiry = p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : '';
                    const days = p.daysToExpiry ?? p.daysRemaining ?? '';
                    html += `<td style="border:1px solid #ddd;padding:8px">${p.permitName || ''}</td>`;
                    html += `<td style="border:1px solid #ddd;padding:8px">${expiry}</td>`;
                    html += `<td style="border:1px solid #ddd;padding:8px;text-align:center">${days}</td>`;
                    html += `<td style="border:1px solid #ddd;padding:8px;text-align:center">${this.getBadgeLabel(days === '' ? null : Number(days))}</td>`;
                    html += '</tr>';
                }
            }

            html += '</tbody></table>';
            return html;
        };

        const content = `<!doctype html><html><head><meta charset="utf-8"><title>Drivers Permit Status</title>` +
            `<style>body{font-family:Arial,Helvetica,sans-serif;margin:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px}th{background:#f3f4f6}</style>` +
            `</head><body><h1>Drivers Permit Status</h1>${buildTable()}</body></html>`;

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
