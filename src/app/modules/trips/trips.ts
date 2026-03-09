import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTable, TableConfig } from '../../shared/components/data-table/data-table';
import { Layout } from '../../shared/components/layout/layout';
import { TripForm } from './trip-form/trip-form';

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [CommonModule, DataTable, Layout, TripForm],
  templateUrl: './trips.html'
})
export class Trips {
  title = signal('Trips management');
  description = signal('Overview and management of all logistics trips');
  addText = signal('Add new trip');
  viewType = signal('');
  viewDetails = signal(false);
  formTitle = signal('');
  formDescription = signal('');

  trips = signal([
    {
      id: 'TRP-8842',
      date: 'Oct 24, 2023',
      endDate: 'Oct 26, 2023',
      vehicle: 'Volvo FH16 (V-09)',
      driver: 'Marcus Sterling',
      route: 'New York',
      revenue: '$4,250.00',
      status: 'In-Progress'
    },
    {
      id: 'TRP-8841',
      date: 'Oct 23, 2023',
      endDate: 'Oct 24, 2023',
      vehicle: 'Scania R500 (V-12)',
      driver: 'Sarah Jenkins',
      route: 'Phoenix',
      revenue: '$2,100.00',
      status: 'Completed'
    },
    {
      id: 'TRP-8840',
      date: 'Oct 25, 2023',
      endDate: '-',
      vehicle: 'Freightliner (V-02)',
      driver: 'James Wilson',
      route: 'Atlanta',
      revenue: '$1,850.00',
      status: 'Pending'
    },
    {
      id: 'TRP-8839',
      date: 'Oct 22, 2023',
      endDate: 'Oct 23, 2023',
      vehicle: 'Kenworth T680 (V-15)',
      driver: 'Elena Rodriguez',
      route: 'Portland',
      revenue: '$0.00',
      status: 'Cancelled'
    }
  ]);

  tableConfigurations: TableConfig = {
    columns: [
      {
        key: 'id',
        label: 'Trip ID'
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
        key: 'route',
        label: 'Route'
      },
      {
        key: 'revenue',
        label: 'Revenue'
      },
      {
        key: 'status',
        label: 'Status'
      }
    ]
  };

  onAdd() {
    this.viewType.set('add');
    this.formTitle.set('Add new trip');
    this.formDescription.set('Create and schedule a new logistics trip.');
    this.viewDetails.set(true);
  }

  onCloseForm() {
    this.viewDetails.set(false);
    this.viewType.set('');
    this.formTitle.set('');
    this.formDescription.set('');
  }
}
