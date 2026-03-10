import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTable, TableConfig } from '../../../shared/components/data-table/data-table';
import { Layout } from '../../../shared/components/layout/layout';
import { CargoTypeService } from '../../../services/cargo-type.service';
import { CargoTypeForm } from './cargo-type-form/cargo-type-form';

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

  tableConfigurations: TableConfig = {
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status' },
      { key: 'createdDate', label: 'Created date' },
    ],
  };

  async ngOnInit(): Promise<void> {
    await this.cargoTypeService.getAll();
  }

  onAdd() {
    this.viewType.set('add');
    this.formTitle.set('Add new cargo type');
    this.formDescription.set('Create a cargo classification for trips.');
    this.viewDetails.set(true);
  }

  async onCloseForm() {
    this.viewDetails.set(false);
    this.viewType.set('');
    this.formTitle.set('');
    this.formDescription.set('');
    await this.cargoTypeService.getAll();
  }
}
