import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTable, TableConfig } from '../../../../shared/components/data-table/data-table';
import { Layout } from '../../../../shared/components/layout/layout';
import { RouteForm } from '../route-form/route-form';

@Component({
  selector: 'app-route-list',
  standalone: true,
  imports: [CommonModule, DataTable, Layout, RouteForm],
  templateUrl: './route-list.html',
})
export class RouteList {
  title = signal('Routes management');
  description = signal('Configure and track operational transport lanes across the region');
  addText = signal('Add new route');
  viewType = signal('');
  viewDetails = signal(false);
  formTitle = signal('');
  formDescription = signal('');

  routes = signal([
    { id: 'RT-4401', name: 'Central Express', start: 'Dar es Salaam', end: 'Dodoma', mileage: '460 km', duration: '6h 30m', status: 'Active' },
    { id: 'RT-4402', name: 'Northern Corridor', start: 'Dar es Salaam', end: 'Arusha', mileage: '635 km', duration: '8h 15m', status: 'Active' },
    { id: 'RT-4403', name: 'Lake Zone Shuttle', start: 'Mwanza', end: 'Dar es Salaam', mileage: '1,100 km', duration: '14h 45m', status: 'Inactive' },
    { id: 'RT-4404', name: 'Southern Highlands', start: 'Dar es Salaam', end: 'Mbeya', mileage: '840 km', duration: '9h 15m', status: 'Active' },
    { id: 'RT-4405', name: 'Cross-Border Longhaul', start: 'Dar es Salaam', end: 'Lusaka', mileage: '1,850 km', duration: '26h 10m', status: 'Active' },
  ]);

  tableConfigurations: TableConfig = {
    columns: [
      {
        key: 'name',
        label: 'Route name'
      },
      {
        key: 'start',
        label: 'Start location'
      },
      {
        key: 'end',
        label: 'End location'
      },
      {
        key: 'mileage',
        label: 'Mileage'
      },
      {
        key: 'duration',
        label: 'Estimated duration'
      },
      {
        key: 'status',
        label: 'Status'
      }
    ]
  };

  onAdd() {
    this.viewType.set('add');
    this.formTitle.set('Add new route');
    this.formDescription.set('Configure a new transport route and timing details.');
    this.viewDetails.set(true);
  }

  onCloseForm() {
    this.viewDetails.set(false);
    this.viewType.set('');
    this.formTitle.set('');
    this.formDescription.set('');
  }
}
