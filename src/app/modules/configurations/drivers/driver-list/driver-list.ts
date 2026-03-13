import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTable, TableConfig } from '../../../../shared/components/data-table/data-table';
import { Layout } from '../../../../shared/components/layout/layout';
import { DriverForm } from '../driver-form/driver-form';
import { DriverDetail } from '../driver-detail/driver-detail';
import { DriverService } from '../../../../services/driver.service';
import { Driver } from '../../../../models/driver.model';

@Component({
  selector: 'app-driver-list',
  standalone: true,
  imports: [CommonModule, DataTable, Layout, DriverForm, DriverDetail],
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
  selectedDriver = signal<Driver | undefined>(undefined);
  splitSize = signal<'full' | 'half'>('full');
  loading = this.driverService.loading;

  drivers = computed(() =>
    this.driverService.allDrivers().map((driver) => ({
      ...driver,
      fullName: `${driver.firstName} ${driver.lastName}`,
      licenseStatus: this.getLicenseStatus(driver.licenseDetails?.expiryDate),
      status: driver.isActive ? 'Active' : 'Inactive',
      initials: `${driver.firstName?.charAt(0) ?? ''}${driver.lastName?.charAt(0) ?? ''}`.toUpperCase(),
    }))
  );

  tableConfigurations: TableConfig = {
    columns: [
      {
        key: 'fullName',
        label: 'Full name'
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
        label: 'Status',
        type: 'status',
      }
    ],
    actions: { edit: true, view: true },
  };

  async ngOnInit(): Promise<void> {
    await this.driverService.getAll();
  }

  onAdd() {
    this.selectedDriver.set(undefined);
    this.viewType.set('add');
    this.formTitle.set('Add new driver');
    this.formDescription.set('Create a new driver profile and license details.');
    this.viewDetails.set(true);
  }

  onEdit(row: any) {
    const driver = this.driverService.getById(row.id);
    this.selectedDriver.set(driver);
    this.viewType.set('edit');
    this.formTitle.set('Edit driver');
    this.formDescription.set(`Editing: ${row.firstName} ${row.lastName}`);
    this.viewDetails.set(true);
  }

  onView(row: any) {
    const driver = this.driverService.getById(row.id);
    this.selectedDriver.set(driver);
    this.viewType.set('view');
    this.formTitle.set('Driver details');
    this.formDescription.set(`Viewing: ${row.firstName} ${row.lastName}`);
    this.viewDetails.set(true);
  }

  async onCloseForm() {
    this.viewDetails.set(false);
    this.viewType.set('');
    this.formTitle.set('');
    this.formDescription.set('');
    this.selectedDriver.set(undefined);
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
