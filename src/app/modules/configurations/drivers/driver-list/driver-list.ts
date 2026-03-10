import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTable, TableConfig } from '../../../../shared/components/data-table/data-table';
import { Layout } from '../../../../shared/components/layout/layout';
import { DriverForm } from '../driver-form/driver-form';
import { DriverService } from '../../../../services/driver.service';

@Component({
  selector: 'app-driver-list',
  standalone: true,
  imports: [CommonModule, DataTable, Layout, DriverForm],
  templateUrl: './driver-list.html',
})
export class DriverList implements OnInit {
  private driverService = inject(DriverService);

  title = signal('Drivers management');
  description = signal('Monitor fleet compliance, driver status, and contact information');
  addText = signal('Add new driver');
  viewType = signal('');
  viewDetails = signal(false);
  formTitle = signal('');
  formDescription = signal('');

  drivers = computed(() =>
    this.driverService.allDrivers().map((driver) => ({
      ...driver,
      licenseStatus: this.getLicenseStatus(driver.licenseDetails?.expiryDate),
      status: driver.isActive ? 'Active' : 'Inactive',
      initials: `${driver.firstName?.charAt(0) ?? ''}${driver.lastName?.charAt(0) ?? ''}`.toUpperCase(),
    }))
  );

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
      // {
      //   key: 'licenseStatus',
      //   label: 'License status'
      // },
      {
        key: 'status',
        label: 'Status'
      }
    ]
  };

  async ngOnInit(): Promise<void> {
    await this.driverService.getAll();
  }

  onAdd() {
    this.viewType.set('add');
    this.formTitle.set('Add new driver');
    this.formDescription.set('Create a new driver profile and license details.');
    this.viewDetails.set(true);
  }

  async onCloseForm() {
    this.viewDetails.set(false);
    this.viewType.set('');
    this.formTitle.set('');
    this.formDescription.set('');
    await this.driverService.getAll();
  }

  private getLicenseStatus(expiryDate?: Date): string {
    if (!expiryDate) {
      return 'Unknown';
    }

    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysToExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysToExpiry < 0) {
      return 'Expired';
    }

    if (daysToExpiry <= 30) {
      return 'Expiring Soon';
    }

    return 'Valid';
  }
}
