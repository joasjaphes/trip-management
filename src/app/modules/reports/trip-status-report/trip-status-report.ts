import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { TripService } from '../../../services/trip.service';
import { TripStatus } from '../../../models/trip.model';

@Component({
  selector: 'app-trip-status-report',
  imports: [CommonModule, CurrencyPipe, DatePipe],
  templateUrl: './trip-status-report.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TripStatusReport implements OnInit {
  private tripService = inject(TripService);

  loading = this.tripService.loading;
  errorMessage = this.tripService.errorMessage;

  trips = computed(() =>
    this.tripService.allTrips().map((trip) => ({
      id: trip.id,
      tripReference: trip.tripReferenceNumber || trip.id,
      route: trip.route?.name || trip.routeId,
      driver: trip.driver ? `${trip.driver.firstName} ${trip.driver.lastName}`.trim() : trip.driverId,
      vehicle: trip.vehicle?.registrationNo || trip.vehicleId,
      tripDate: trip.tripDate,
      endDate: trip.endDate,
      revenue: Number(trip.revenue || 0),
      status: trip.status,
    }))
  );

  tripStatusSummary = computed(() => ([
    { label: 'Pending Payment', value: this.tripService.pendingTrips().length, color: 'text-amber-600 bg-amber-50' },
    { label: 'In Progress', value: this.tripService.inProgressTrips().length, color: 'text-blue-600 bg-blue-50' },
    { label: 'Completed', value: this.tripService.completedTrips().length, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Cancelled', value: this.tripService.cancelledTrips().length, color: 'text-red-600 bg-red-50' },
  ]));

  async ngOnInit(): Promise<void> {
    await this.tripService.getAll();
  }

  getStatusClass(status: TripStatus): string {
    switch (status) {
      case TripStatus.COMPLETED:
        return 'text-emerald-600 bg-emerald-50';
      case TripStatus.IN_PROGRESS:
        return 'text-blue-600 bg-blue-50';
      case TripStatus.CANCELLED:
        return 'text-red-600 bg-red-50';
      default:
        return 'text-amber-600 bg-amber-50';
    }
  }
}