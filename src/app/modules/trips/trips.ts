import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTable, TableConfig } from '../../shared/components/data-table/data-table';
import { Layout, SplitSize } from '../../shared/components/layout/layout';
import { TripForm } from './trip-form/trip-form';
import { TripDetail } from './trip-detail/trip-detail';
import { TripService } from '../../services/trip.service';
import { Trip, TripStatus } from '../../models/trip.model';

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [CommonModule, DataTable, Layout, TripForm, TripDetail],
  templateUrl: './trips.html'
})
export class Trips implements OnInit {
  private tripService = inject(TripService);

  title = signal('Trips management');
  description = signal('Overview and management of all logistics trips');
  addText = signal('Add new trip');
  viewType = signal('');
  viewDetails = signal(false);
  formTitle = signal('');
  formDescription = signal('');
  splitSize = signal<SplitSize>('full');
  selectedTrip = signal<Trip | undefined>(undefined);
  showAddButton = signal(true);
  loading = this.tripService.loading;

  trips = computed(() =>
    this.tripService.allTrips().map((trip) => ({
      id: trip.id,
      date: new Date(trip.tripDate).toLocaleDateString(),
      endDate: trip.endDate ? new Date(trip.endDate).toLocaleDateString() : '-',
      vehicle: trip.vehicle?.registrationNo || trip.vehicleId,
      driver: trip.driver ? `${trip.driver.firstName} ${trip.driver.lastName}` : trip.driverId,
      route: trip.route?.name || trip.routeId,
      revenue: `${Number(trip.revenue || 0).toLocaleString()}`,
      status: trip.status,
      _trip: trip
    }))
  );

  tableConfigurations: TableConfig = {
    columns: [
      {
        key: 'route',
        label: 'Route'
      },
      {
        key: 'date',
        label: 'Start date'
      },
      {
        key: 'endDate',
        label: 'End date'
      },
      {
        key: 'vehicle',
        label: 'Vehicle'
      },
      {
        key: 'driver',
        label: 'Driver'
      },
      {
        key: 'revenue',
        label: 'Revenue'
      },
      {
        key: 'status',
        label: 'Status'
      }
    ],
    actions: {
      view: true,
      edit: true,
      delete: true,
      more: true
    }
  };

  moreActions = computed(() => [
    {
      label: 'Review & Complete',
      key: 'review-complete',
      icon: 'fa-solid fa-check-circle text-green-500',
      action: (row: any) => this.onView(row)
    },
  ]);

  async ngOnInit(): Promise<void> {
    await this.tripService.getAll();
  }

  onAdd() {
    this.viewType.set('add');
    this.formTitle.set('Add new trip');
    this.formDescription.set('Create and schedule a new logistics trip.');
    this.showAddButton.set(false);
    this.viewDetails.set(true);
  }

  onView(row: any) {
    this.selectedTrip.set(row._trip);
    this.formTitle.set(`Trip details ( ${row.route} )`);
    this.formDescription.set(`View detailed information about this trip, including expenses and route details.`);
    this.viewType.set('detail');
    this.showAddButton.set(false);
    this.viewDetails.set(true);
    // this.splitSize.set('half');
  }

  async onCloseForm() {
    this.viewDetails.set(false);
    this.viewType.set('');
    this.formTitle.set('');
    this.formDescription.set('');
    this.selectedTrip.set(undefined);
    this.splitSize.set('full');
    this.showAddButton.set(true);
    await this.tripService.getAll();
  }

  async completeTrip(trip: Trip) {
    if (!trip?.id || trip.status === 'completed') {
      return;
    }

    // await this.tripService.updateStatus(trip.id, TripStatus.COMPLETED);
    await this.tripService.update(trip.id, { ...trip, status: TripStatus.COMPLETED, endDate: new Date() });
    const refreshedTrip = this.tripService.getById(trip.id);
    if (refreshedTrip) {
      this.selectedTrip.set(refreshedTrip);
    }
  }

  onCloseDetail() {
    this.viewDetails.set(false);
    this.viewType.set('');
    this.selectedTrip.set(undefined);
    this.showAddButton.set(true);
    this.splitSize.set('full');
  }
}
