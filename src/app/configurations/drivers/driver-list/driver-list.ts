import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Layout, SplitSize } from '../../../shared/components/layout/layout';
import { DataTable, TableConfig } from '../../../shared/components/data-table/data-table';
import { Driver } from '../../../models/driver.model';
import { CommonModule } from '@angular/common';
import { AddDriver } from '../driver-form/add-driver';
import { DriverService } from '../../../services/driver.service';

@Component({
  selector: 'app-driver-list',
  imports: [Layout, DataTable, AddDriver, CommonModule],
  templateUrl: './driver-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriverList {
  private driverService = inject(DriverService);

  title = signal('Drivers');
  viewDetails = signal(false);
  viewType = signal<'add' | 'edit'>('add');
  formSize = signal<SplitSize>('half');
  selectedDriverId = signal<string | null>(null);

  // Get data from service
  drivers = this.driverService.allDrivers;
  isLoading = this.driverService.loading;
  activeDriversCount = this.driverService.activeDriversCount;

  // Table configuration
  tableConfig = signal<TableConfig>({
    columns: [
      { key: 'firstName', label: 'First Name', sortable: true },
      { key: 'lastName', label: 'Last Name', sortable: true },
      { key: 'email', label: 'Email', sortable: true },
      { key: 'phone', label: 'Phone', sortable: false },
      { key: 'isActive', label: 'Status', sortable: true },
      { key: 'createdAt', label: 'Created', sortable: true },
    ],
    pageSize: 10,
    striped: true,
    hover: true,
    bordered: false,
  });

  onAdd(): void {
    this.viewType.set('add');
    this.selectedDriverId.set(null);
    this.viewDetails.set(true);
  }

  onRowClick(driver: Driver): void {
    this.selectedDriverId.set(driver.id);
    this.viewType.set('edit');
    this.viewDetails.set(true);
  }

  onRowSelect(selectedDrivers: Driver[]): void {
    console.log('Selected drivers:', selectedDrivers);
  }

  onSortChange(event: { column: string; direction: 'asc' | 'desc' }): void {
    console.log('Sort changed:', event);
  }

  onFormSaved(): void {
    this.viewDetails.set(false);
    this.selectedDriverId.set(null);
  }
}
