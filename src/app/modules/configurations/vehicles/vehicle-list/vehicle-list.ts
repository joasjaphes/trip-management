import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTable, TableConfig } from '../../../../shared/components/data-table/data-table';
import { Layout } from '../../../../shared/components/layout/layout';
import { VehicleForm } from '../vehicle-form/vehicle-form';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [CommonModule, DataTable, Layout, VehicleForm],
  templateUrl: './vehicle-list.html',
})
export class VehicleList {
  title = signal('Vehicles management');
  description = signal('Real-time monitoring and lifecycle management of your fleet');
  addText = signal('Add new vehicle');
  viewType = signal('');
  viewDetails = signal(false);
  formTitle = signal('');
  formDescription = signal('');

  vehicles = signal([
    {
      id: 'TRK-001-20',
      year: 2020,
      tankCapacity: '500 L',
      mileagePerFullTank: '2000 KM',
      permitExpiry: 'Dec 01, 2024',
      status: 'active'
    },
    {
      id: 'TRK-002-21',
      year: 2021,
      tankCapacity: '450 L',
      mileagePerFullTank: '1800 KM',
      permitExpiry: 'Nov 15, 2024',
      status: 'active'
    },
    {
      id: 'TRK-003-20',
      year: 2020,
      tankCapacity: '550 L',
      mileagePerFullTank: '2200 KM',
      permitExpiry: 'Jan 10, 2025',
      status: 'active'
    },
    {
      id: 'TRK-004-19',
      year: 2019,
      tankCapacity: '500 L',
      mileagePerFullTank: '1950 KM',
      permitExpiry: 'Sep 30, 2024',
      status: 'expiring'
    }
  ]);

  tableConfigurations: TableConfig = {
    columns: [
      {
        key: 'id',
        label: 'Registration number'
      },
      {
        key: 'year',
        label: 'Registration year'
      },
      {
        key: 'tankCapacity',
        label: 'Tank capacity'
      },
      {
        key: 'mileagePerFullTank',
        label: 'Mileage per full tank'
      },
      {
        key: 'permitExpiry',
        label: 'Permit expiry'
      },
      {
        key: 'status',
        label: 'Status'
      }
    ]
  };

  onAdd() {
    this.viewType.set('add');
    this.formTitle.set('Add new vehicle');
    this.formDescription.set('Register a new vehicle and its permit information.');
    this.viewDetails.set(true);
  }

  onCloseForm() {
    this.viewDetails.set(false);
    this.viewType.set('');
    this.formTitle.set('');
    this.formDescription.set('');
  }
}
