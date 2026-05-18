import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTable, TableConfig } from '../../shared/components/data-table/data-table';
import { Layout, SplitSize } from '../../shared/components/layout/layout';
import { TripForm } from './trip-form/trip-form';
import { TripDetail } from './trip-detail/trip-detail';
import { TripExpensesManage } from './trip-expenses-manage/trip-expenses-manage';
import { TripActualPositionManage } from './trip-actual-position-manage/trip-actual-position-manage';
import { TripService } from '../../services/trip.service';
import { Trip, TripStatus } from '../../models/trip.model';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment from 'moment';
import { Tabs } from '../../shared/components/tabs/tabs';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [CommonModule, DataTable, Layout, TripForm, TripDetail, TripExpensesManage, TripActualPositionManage, MatTooltipModule, MatTabsModule],
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
  tabs = ['In Progress', 'Completed']
  selectedTab = signal<'In Progress' | 'Completed'>('In Progress');


  trips = computed(() =>
    this.tripService.allTrips().map((trip) => ({
      id: trip.id,
      createdAt: new Date(trip.createdAt).toLocaleDateString(),
      customerName: trip.customer?.name || trip.customerId,
      tripReferenceNumber: trip.tripReferenceNumber,
      date: trip.tripDate ? new Date(trip.tripDate).toLocaleDateString() : '-',
      paidAmount: Number(trip.paidAmount || 0),
      endDate: trip.endDate ? new Date(trip.endDate).toLocaleDateString() : '-',
      vehicle: trip.vehicle?.registrationNo || trip.vehicleId || '-',
      trailer: trip.trailer?.registrationNo || trip.trailerId || '-',
      driver: trip.driver ? `${trip.driver.firstName} ${trip.driver.lastName}` : trip.driverId,
      docNumber: trip.docNumber || '-',
      route: trip.route?.name || trip.routeId,
      revenue: Number(trip.revenue || 0),
      offloadingPlace: trip.offloadingPlace,
      offloadingPlaceName: trip.offloadingPlaceName,
      offloadingPlaceId: trip.offloadingPlaceId,
      status: trip.status,
      _trip: trip,
      canEdit: trip.status !== TripStatus.COMPLETED,
      actions: {
        reviewComplete: trip.status !== TripStatus.COMPLETED,
        manageExpense: trip.status !== TripStatus.COMPLETED,
        manageActualPosition: trip.status !== TripStatus.COMPLETED
      }
    }))
  );

  permissions = signal({
    edit: ['EDIT_TRIP'],
    view: ['VIEW_TRIPS'],
    add: ['CREATE_TRIP'],
    delete: ['DELETE_TRIP'],
    more: {
      reviewComplete: ['COMPLETE_TRIP'],
      manageExpense: ['ADD_TRIP_EXPENSES'],
      manageActualPosition: ['EDIT_TRIP']
    }
  })

  addPermision = signal('CREATE_TRIP');

  activeTab = signal<'in-progress' | 'completed'>('in-progress');


  setTab(tab: 'In Progress' | 'Completed') {
    console.log('Selected tab:', tab);
    this.selectedTab.set(tab);
  }

  private isTripCompleted(trip: any): boolean {
    const rawStatus = (trip?.status ?? trip?.tripStatus ?? '')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[_\s-]/g, '');

    return rawStatus === 'completed' || rawStatus === 'complete' || trip?.isCompleted === true;
  }


  completedTrips = computed(() => {
    return this.trips().filter((trip: any) => this.isTripCompleted(trip));
  });

  inProgressTrips = computed(() => {
    return this.trips().filter((trip: any) => !this.isTripCompleted(trip) && !trip.isOverstayed);
  });

  overStayedTrips = computed(() => { 
    return this.trips().filter((trip: any) =>  trip.isOverstayed);
  });

  filteredTrips = computed(() => {
    const allTrips = this.trips() ?? [];

    if (this.selectedTab() === 'Completed') {
      return allTrips.filter((trip: any) => this.isTripCompleted(trip));
    }

    return allTrips.filter((trip: any) => !this.isTripCompleted(trip));
  });


  tableConfigurations: TableConfig = {
    columns: [
      {
        key: 'createdAt',
        label: 'Created At',
        type: 'date'
      },
      {
        key: 'tripReferenceNumber',
        label: 'Trip#'
      },
      {
        key: 'customerName',
        label: 'Customer'
      },
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
        label: 'Truck'
      },
      {
        key: 'trailer',
        label: 'Trailer'
      },
      {
        key: 'docNumber',
        label: 'Container/Document Number'
      },
      {
        key: 'driver',
        label: 'Driver'
      },
      {
        key: 'offloadingPlaceName',
        label: 'Offloading place'
      },
      {
        key: 'status',
        label: 'Status',
        type: 'tripStatus'
      }
    ],
    actions: {
      view: true,
      edit: false,
      delete: false,
      more: false
    }
  };

  moreActions = computed(() => [
    {
      label: 'Review & Complete',
      key: 'reviewComplete',
      icon: 'fa-solid fa-check-circle text-green-500',
      action: (row: any) => this.onComplete(row)
    },
    {
      label: 'Manage expense',
      key: 'manageExpense',
      icon: 'fa-solid fa-money-bill-wave text-orange-500',
      action: (row: any) => this.onManageExpense(row)
    },
    {
      label: 'Update actual position',
      key: 'manageActualPosition',
      icon: 'fa-solid fa-location-dot text-blue-500',
      action: (row: any) => this.onManageActualPosition(row)
    },
  ]);

  async ngOnInit(): Promise<void> {
    await this.tripService.getAll();
  }

  onAdd() {
    this.viewType.set('add');
    this.formTitle.set('Add new trip');
    this.formDescription.set('Create and schedule a new logistics trip.');
    this.selectedTrip.set(undefined);
    this.showAddButton.set(false);
    this.viewDetails.set(true);
  }

  onEdit(row: any) {
    this.selectedTrip.set(row._trip);
    this.viewType.set('edit');
    this.formTitle.set(`Edit trip ( ${row.route} )`);
    this.formDescription.set('Update trip details and optionally add new expense rows.');
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

  onComplete(row: any) {
    this.selectedTrip.set(row._trip);
    this.formTitle.set(`Trip details ( ${row.route} )`);
    this.formDescription.set(`View detailed information about this trip, including expenses and route details.`);
    this.viewType.set('complete');
    this.showAddButton.set(false);
    this.viewDetails.set(true);
    // this.splitSize.set('half');
  }

  onManageExpense(row: any) {
    this.selectedTrip.set(row._trip);
    this.formTitle.set(`Manage expenses`);
    this.formDescription.set('Add, update, or remove expenses for this trip.');
    this.viewType.set('manage-expense');
    this.showAddButton.set(false);
    this.viewDetails.set(true);
  }

  onManageActualPosition(row: any) {
    this.selectedTrip.set(row._trip);
    this.formTitle.set('Update actual position');
    this.formDescription.set('Update the current trip location/position.');
    this.viewType.set('manage-actual-position');
    this.showAddButton.set(false);
    this.viewDetails.set(true);
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
    console.log('Completing trip:', trip);
    if (!trip?.id || trip.status === 'Completed') {
      return;
    }
    try {
      // await this.tripService.updateStatus(trip.id, TripStatus.COMPLETED);
      await this.tripService.update(trip.id, {
        ...trip,
        status: TripStatus.COMPLETED,
        endDate: trip.endDate || moment(new Date()).format('YYYY-MM-DD')
      });
      const refreshedTrip = this.tripService.getById(trip.id);
      if (refreshedTrip) {
        this.selectedTrip.set(refreshedTrip);
      }
    } catch (e) {
      console.error('Error completing trip:', e);
    }
  }

  async onExpensesChanged() {
    const tripId = this.selectedTrip()?.id;
    await this.tripService.getAll();

    if (!tripId) {
      return;
    }

    const refreshedTrip = this.tripService.getById(tripId);
    if (refreshedTrip) {
      this.selectedTrip.set(refreshedTrip);
    }
  }

  async onActualPositionChanged() {
    const tripId = this.selectedTrip()?.id;
    await this.tripService.getAll();

    if (!tripId) {
      return;
    }

    const refreshedTrip = this.tripService.getById(tripId);
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

  getTripsByStatus() {
    if (this.selectedTab() == 'Completed') {
      return this.trips().filter((trip: any) => this.isTripCompleted(trip));
    }

    return this.trips().filter((trip: any) => !this.isTripCompleted(trip));
  }
}
