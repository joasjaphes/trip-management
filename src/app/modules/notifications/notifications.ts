import { CommonModule, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  NotificationService,
  NotificationSeverity,
} from '../../services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, DecimalPipe, RouterLink],
  templateUrl: './notifications.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Notifications implements OnInit {
  private notificationService = inject(NotificationService);

  vehiclePermits = this.notificationService.vehiclePermitNotifications;
  driverPermits = this.notificationService.driverPermitNotifications;
  overdueInvoices = this.notificationService.overdueInvoiceNotifications;
  totalCount = this.notificationService.totalCount;

  vehicleUrgent = computed(
    () => this.vehiclePermits().filter((n) => n.severity === 'urgent').length
  );
  vehicleWarning = computed(
    () => this.vehiclePermits().filter((n) => n.severity === 'warning').length
  );
  driverUrgent = computed(
    () => this.driverPermits().filter((n) => n.severity === 'urgent').length
  );
  driverWarning = computed(
    () => this.driverPermits().filter((n) => n.severity === 'warning').length
  );

  async ngOnInit(): Promise<void> {
    await this.notificationService.loadAll();
  }

  badgeClass(severity: NotificationSeverity): string {
    return severity === 'urgent'
      ? 'bg-red-50 text-red-700 border-red-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';
  }

  rowClass(severity: NotificationSeverity): string {
    return severity === 'urgent' ? 'bg-red-50/40' : 'bg-amber-50/40';
  }

  daysLabel(daysRemaining: number): string {
    if (daysRemaining < 0) {
      const days = Math.abs(daysRemaining);
      return `Expired ${days} day${days === 1 ? '' : 's'} ago`;
    }
    if (daysRemaining === 0) return 'Expires today';
    return `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left`;
  }

  ageLabel(days: number): string {
    return `${days} day${days === 1 ? '' : 's'}`;
  }
}
