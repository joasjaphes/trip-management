import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTable, TableConfig } from '../../../../shared/components/data-table/data-table';
import { Layout } from '../../../../shared/components/layout/layout';
import { VehicleForm } from '../vehicle-form/vehicle-form';
import { VehicleService } from '../../../../services/vehicle.service';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [CommonModule, DataTable, Layout, VehicleForm],
  templateUrl: './vehicle-list.html',
})
export class VehicleList implements OnInit {
  private vehicleService = inject(VehicleService);

  title = signal('Vehicles management');
  description = signal('Real-time monitoring and lifecycle management of your fleet');
  addText = signal('Add new vehicle');
  viewType = signal('');
  viewDetails = signal(false);
  formTitle = signal('');
  formDescription = signal('');

  vehicles = computed(() =>
    this.vehicleService.allVehicles().map((vehicle) => ({
      id: vehicle.registrationNo,
      registrationYear: vehicle.registrationYear ?? '-',
      tankCapacity: `${vehicle.tankCapacity} L`,
      mileagePerFullTank: `${vehicle.mileagePerFullTank} KM`,
      permitExpiry: this.getPermitExpiry(vehicle.permits),
      status: vehicle.isActive ? 'active' : 'inactive',
    }))
  );

  tableConfigurations: TableConfig = {
    columns: [
      {
        key: 'id',
        label: 'Registration number'
      },
      {
        key: 'registrationYear',
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

  async ngOnInit(): Promise<void> {
    await this.vehicleService.getAll();
  }

  onAdd() {
    this.viewType.set('add');
    this.formTitle.set('Add new vehicle');
    this.formDescription.set('Register a new vehicle and its permit information.');
    this.viewDetails.set(true);
  }

  async onCloseForm() {
    this.viewDetails.set(false);
    this.viewType.set('');
    this.formTitle.set('');
    this.formDescription.set('');
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
