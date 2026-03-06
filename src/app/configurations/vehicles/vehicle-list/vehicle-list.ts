import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Layout, SplitSize } from '../../../shared/components/layout/layout';
import { DataTable, TableConfig } from '../../../shared/components/data-table/data-table';
import { Vehicle } from '../../../models/vehicle.model';
import { CommonModule } from '@angular/common';
import { AddVehicle } from '../vehicle-form/add-vehicle';
import { VehicleService } from '../../../services/vehicle.service';

@Component({
  selector: 'app-vehicle-list',
  imports: [Layout, DataTable, AddVehicle, CommonModule],
  templateUrl: './vehicle-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehicleList {
  private vehicleService = inject(VehicleService);

  title = signal('Vehicles');
  viewDetails = signal(false);
  viewType = signal<'add' | 'edit'>('add');
  formSize = signal<SplitSize>('half');
  selectedVehicleId = signal<string | null>(null);

  // Get data from service
  vehicles = this.vehicleService.allVehicles;
  isLoading = this.vehicleService.loading;
  activeVehiclesCount = this.vehicleService.activeVehiclesCount;

  // Table configuration
  tableConfig = signal<TableConfig>({
    columns: [
      { key: 'registrationNo', label: 'Registration', sortable: true },
      { key: 'make', label: 'Make', sortable: true },
      { key: 'model', label: 'Model', sortable: true },
      { key: 'year', label: 'Year', sortable: true },
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
    this.selectedVehicleId.set(null);
    this.viewDetails.set(true);
  }

  onRowClick(vehicle: Vehicle): void {
    this.selectedVehicleId.set(vehicle.id);
    this.viewType.set('edit');
    this.viewDetails.set(true);
  }

  onRowSelect(selectedVehicles: Vehicle[]): void {
    console.log('Selected vehicles:', selectedVehicles);
  }

  onSortChange(event: { column: string; direction: 'asc' | 'desc' }): void {
    console.log('Sort changed:', event);
  }

  onFormSaved(): void {
    this.viewDetails.set(false);
    this.selectedVehicleId.set(null);
  }
}
