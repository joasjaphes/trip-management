import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTable, TableConfig } from '../../../shared/components/data-table/data-table';
import { Layout } from '../../../shared/components/layout/layout';
import { CargoTypeService } from '../../../services/cargo-type.service';
import { CargoTypeForm } from './cargo-type-form/cargo-type-form';
import { CargoType } from '../../../models/cargo-type.model';

@Component({
  selector: 'app-cargo-types',
  standalone: true,
  imports: [CommonModule, DataTable, Layout, CargoTypeForm],
  templateUrl: './cargo-types.html',
})
export class CargoTypes implements OnInit {
  private cargoTypeService = inject(CargoTypeService);

  title = signal('Cargo types');
  description = signal('Manage cargo classifications used in trip planning.');
  addText = signal('Add new cargo type');
  viewType = signal('');
  viewDetails = signal(false);
  formTitle = signal('');
  formDescription = signal('');
  selectedCargoType = signal<CargoType | undefined>(undefined);

  cargoTypes = computed(() =>
    this.cargoTypeService.allCargoTypes().map((cargoType) => ({
      id: cargoType.id,
      name: cargoType.name,
      status: cargoType.isActive ? 'Active' : 'Inactive',
      createdDate: cargoType.createdAt
        ? new Date(cargoType.createdAt).toLocaleDateString()
        : '-',
    }))
  );

  loading = this.cargoTypeService.loading;

  tableConfigurations: TableConfig = {
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status', type: 'status' },
      { key: 'createdDate', label: 'Created date' },
    ],
    actions: { edit: true },
  };

  async ngOnInit(): Promise<void> {
    await this.cargoTypeService.getAll();
  }

  onAdd() {
    this.selectedCargoType.set(undefined);
    this.viewType.set('add');
    this.formTitle.set('Add new cargo type');
    this.formDescription.set('Create a cargo classification for trips.');
    this.viewDetails.set(true);
  }

  onEdit(row: any) {
    const ct = this.cargoTypeService.getById(row.id);
    this.selectedCargoType.set(ct);
    this.viewType.set('edit');
    this.formTitle.set('Edit cargo type');
    this.formDescription.set(`Editing: ${row.name}`);
    this.viewDetails.set(true);
  }

  async onCloseForm() {
    this.viewDetails.set(false);
    this.viewType.set('');
    this.formTitle.set('');
    this.formDescription.set('');
    this.selectedCargoType.set(undefined);
    await this.cargoTypeService.getAll();
  }
}
