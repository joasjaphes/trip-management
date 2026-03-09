import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTable, TableConfig } from '../../../../shared/components/data-table/data-table';
import { Layout } from '../../../../shared/components/layout/layout';
import { DriverForm } from '../driver-form/driver-form';

@Component({
  selector: 'app-driver-list',
  standalone: true,
  imports: [CommonModule, DataTable, Layout, DriverForm],
  templateUrl: './driver-list.html',
})
export class DriverList {
  title = signal('Drivers management');
  description = signal('Monitor fleet compliance, driver status, and contact information');
  addText = signal('Add new driver');
  viewType = signal('');
  viewDetails = signal(false);
  formTitle = signal('');
  formDescription = signal('');

  drivers = signal([
    {
      id: 'DRV-4492',
      firstName: 'Juma',
      lastName: 'Mwamba',
      phone: '+255 712 345 678',
      licenseStatus: 'Valid',
      status: 'Active',
      initials: 'JM'
    },
    {
      id: 'DRV-8821',
      firstName: 'Amina',
      lastName: 'Hassan',
      phone: '+255 754 321 876',
      licenseStatus: 'Expiring Soon',
      status: 'Active',
      initials: 'AH'
    },
    {
      id: 'DRV-3310',
      firstName: 'Baraka',
      lastName: 'Kimaro',
      phone: '+255 689 012 345',
      licenseStatus: 'Valid',
      status: 'Inactive',
      initials: 'BK'
    },
    {
      id: 'DRV-2254',
      firstName: 'Rehema',
      lastName: 'Nyerere',
      phone: '+255 777 654 321',
      licenseStatus: 'Expired',
      status: 'Active',
      initials: 'RN'
    }
  ]);

  tableConfigurations: TableConfig = {
    columns: [
      {
        key: 'firstName',
        label: 'First name'
      },
      {
        key: 'lastName',
        label: 'Last name'
      },
      {
        key: 'phone',
        label: 'Phone'
      },
      {
        key: 'licenseStatus',
        label: 'License status'
      },
      {
        key: 'status',
        label: 'Status'
      }
    ]
  };

  onAdd() {
    this.viewType.set('add');
    this.formTitle.set('Add new driver');
    this.formDescription.set('Create a new driver profile and license details.');
    this.viewDetails.set(true);
  }

  onCloseForm() {
    this.viewDetails.set(false);
    this.viewType.set('');
    this.formTitle.set('');
    this.formDescription.set('');
  }
}
