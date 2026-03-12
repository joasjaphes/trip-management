import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { VehiclePermitService } from '../../../services/vehicle-permit.service';

type PermitReportRow = {
  id: string;
  description: string;
  startDate: Date;
  endDate: Date;
  daysRemaining: number;
  isExpired: boolean;
};

@Component({
  selector: 'app-expiring-permits-report',
  imports: [CommonModule, DatePipe],
  templateUrl: './expiring-permits-report.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpiringPermitsReport implements OnInit {
  private vehiclePermitService = inject(VehiclePermitService);

  loading = this.vehiclePermitService.loading;
  errorMessage = this.vehiclePermitService.errorMessage;

  permitRows = computed<PermitReportRow[]>(() => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    return this.vehiclePermitService
      .allPermits()
      .map((permit) => {
        const endDate = new Date(permit.endDate);
        const endTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();
        const daysRemaining = Math.ceil((endTime - startOfToday) / (1000 * 60 * 60 * 24));

        return {
          id: permit.id,
          description: permit.description,
          startDate: new Date(permit.startDate),
          endDate,
          daysRemaining,
          isExpired: daysRemaining < 0,
        };
      })
      .filter((permit) => permit.daysRemaining <= 30)
      .sort((left, right) => left.daysRemaining - right.daysRemaining);
  });

  async ngOnInit(): Promise<void> {
    await this.vehiclePermitService.getAll();
  }

  getStatusClass(row: PermitReportRow): string {
    if (row.isExpired) {
      return 'text-red-600 bg-red-50';
    }
    if (row.daysRemaining <= 7) {
      return 'text-amber-600 bg-amber-50';
    }
    return 'text-blue-600 bg-blue-50';
  }

  getStatusLabel(row: PermitReportRow): string {
    if (row.isExpired) {
      return 'Expired';
    }
    if (row.daysRemaining === 0) {
      return 'Expires today';
    }
    return `${row.daysRemaining} day(s) left`;
  }
}