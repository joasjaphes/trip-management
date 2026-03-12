import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTable, TableConfig } from '../../../../shared/components/data-table/data-table';
import { Layout } from '../../../../shared/components/layout/layout';
import { VehicleForm } from '../vehicle-form/vehicle-form';
import { VehicleDetail } from '../vehicle-detail/vehicle-detail';
import { VehicleService } from '../../../../services/vehicle.service';
import { Vehicle } from '../../../../models/vehicle.model';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [CommonModule, DataTable, Layout, VehicleForm, VehicleDetail],
  templateUrl: './vehicle-list.html',
})
export class VehicleList implements OnInit {
  private vehicleService = inject(VehicleService);

  title = signal('Vehicles management');
  description = signal('Real-time monitoring and lifecycle management of your fleet');
  addText = signal('Add new vehicle');
  viewType = signal<'add' | 'edit' | 'view' | ''>('');
  viewDetails = signal(false);
  formTitle = signal('');
  formDescription = signal('');
  loading = this.vehicleService.loading;
  selectedVehicle = signal<Vehicle | undefined>(undefined);
  splitSize = signal<'full' | 'half'>('full');

  vehicles = computed(() =>
    this.vehicleService.allVehicles().map((vehicle) => ({
      id: vehicle.id,
      registrationNo: vehicle.registrationNo,
      registrationYear: vehicle.registrationYear ?? '-',
      tankCapacity: `${vehicle.tankCapacity} L`,
      mileagePerFullTank: `${vehicle.mileagePerFullTank} KM`,
      permitExpiry: this.getPermitExpiry(vehicle.permits),
      status: vehicle.isActive ? 'Active' : 'Inactive',
    }))
  );

  tableConfigurations: TableConfig = {
    columns: [
      { key: 'registrationNo', label: 'Registration number' },
      { key: 'registrationYear', label: 'Registration year' },
      { key: 'tankCapacity', label: 'Tank capacity' },
      { key: 'mileagePerFullTank', label: 'Mileage per full tank' },
      { key: 'permitExpiry', label: 'Permit expiry' },
      { key: 'status', label: 'Status',type: 'status' },
    ],
    actions: { edit: true, view: true },
  };

  async ngOnInit(): Promise<void> {
    await this.vehicleService.getAll();
  }

  onAdd() {
    this.selectedVehicle.set(undefined);
    this.viewType.set('add');
    this.formTitle.set('Add new vehicle');
    this.formDescription.set('Register a new vehicle and its permit information.');
    this.splitSize.set('full');
    this.viewDetails.set(true);
  }

  onEdit(row: { id: string }) {
    const vehicle = this.vehicleService.getById(row.id);
    if (!vehicle) return;
    this.selectedVehicle.set(vehicle);
    this.viewType.set('edit');
    this.formTitle.set('Edit vehicle');
    this.formDescription.set(`Editing ${vehicle.registrationNo}`);
    this.splitSize.set('full');
    this.viewDetails.set(true);
  }

  onView(row: { id: string }) {
    const vehicle = this.vehicleService.getById(row.id);
    if (!vehicle) return;
    this.selectedVehicle.set(vehicle);
    this.viewType.set('view');
    this.formTitle.set('Vehicle Details');
    this.formDescription.set(vehicle.registrationNo);
    this.splitSize.set('full');
    this.viewDetails.set(true);
  }

  async onCloseForm() {
    this.viewDetails.set(false);
    this.viewType.set('');
    this.formTitle.set('');
    this.formDescription.set('');
    this.selectedVehicle.set(undefined);
    this.splitSize.set('full');
    await this.vehicleService.getAll();
  }

  private getPermitExpiry(permits: { endDate: Date }[] = []): string {
    if (!permits.length) {
      return '-';
    }

    const latestPermit = permits.reduce((latest, current) =>
      new Date(current.endDate) > new Date(latest.endDate) ? current : latest
    );

    return new Date(latestPermit.endDate).toLocaleDateString();
  }
}

