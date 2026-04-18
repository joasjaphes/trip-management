import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DataTable, TableConfig } from '../../../shared/components/data-table/data-table';
import { Layout } from '../../../shared/components/layout/layout';
import { OffloadingPlaceService } from '../../../services/offloading-place.service';
import { OffloadingPlaceForm } from './offloading-place-form/offloading-place-form';
import { OffloadingPlace } from '../../../models/offloading-place.model';

@Component({
  selector: 'app-offloading-places',
  standalone: true,
  imports: [CommonModule, DataTable, Layout, OffloadingPlaceForm],
  templateUrl: './offloading-places.html',
})
export class OffloadingPlaces implements OnInit {
  private offloadingPlaceService = inject(OffloadingPlaceService);

  title = signal('Offloading Places');
  description = signal('Manage offloading places used for trip destination details.');
  addText = signal('Add offloading place');
  viewType = signal('');
  viewDetails = signal(false);
  formTitle = signal('');
  formDescription = signal('');
  selectedOffloadingPlace = signal<OffloadingPlace | undefined>(undefined);

  loading = this.offloadingPlaceService.loading;

  offloadingPlaces = computed(() =>
    this.offloadingPlaceService.allOffloadingPlaces().map((place) => ({
      id: place.id,
      name: place.name,
      latitude: place.latitude != null ? String(place.latitude) : '-',
      longitude: place.longitude != null ? String(place.longitude) : '-',
      createdDate: place.createdAt ? new Date(place.createdAt).toLocaleDateString() : '-',
    }))
  );

  tableConfigurations: TableConfig = {
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'latitude', label: 'Latitude' },
      { key: 'longitude', label: 'Longitude' },
      { key: 'createdDate', label: 'Created date' },
    ],
    actions: { edit: true },
  };

  async ngOnInit(): Promise<void> {
    await this.offloadingPlaceService.getAll();
  }

  onAdd() {
    this.selectedOffloadingPlace.set(undefined);
    this.viewType.set('add');
    this.formTitle.set('Add offloading place');
    this.formDescription.set('Register an offloading place for trip destinations.');
    this.viewDetails.set(true);
  }

  onEdit(row: any) {
    const place = this.offloadingPlaceService.getById(row.id);
    this.selectedOffloadingPlace.set(place);
    this.viewType.set('edit');
    this.formTitle.set('Edit offloading place');
    this.formDescription.set(`Editing: ${row.name}`);
    this.viewDetails.set(true);
  }

  async onCloseForm() {
    this.viewDetails.set(false);
    this.viewType.set('');
    this.formTitle.set('');
    this.formDescription.set('');
    this.selectedOffloadingPlace.set(undefined);
    await this.offloadingPlaceService.getAll();
  }
}
