import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTable, TableConfig } from '../../../shared/components/data-table/data-table';
import { Layout } from '../../../shared/components/layout/layout';
import { IssuingBodyForm } from './issuing-body-form/issuing-body-form';
import { IssuingBodyService } from '../../../services/issuing-body.service';
import { IssuingBody } from '../../../models/issuing-body.model';

@Component({
  selector: 'app-issuing-body',
  standalone: true,
  imports: [CommonModule, DataTable, Layout, IssuingBodyForm],
  templateUrl: './issuing-body.html',
})
export class IssuingBodyComponent implements OnInit {
  private issuingBodyService = inject(IssuingBodyService);

  title = signal('Issuing bodies');
  description = signal('Manage issuing bodies used in trip planning.');
  addText = signal('Add new issuing body');
  viewType = signal('');
  viewDetails = signal(false);
  formTitle = signal('');
  formDescription = signal('');
  selectedIssuingBody = signal<IssuingBody | undefined>(undefined);

  issuingBodies = computed(() =>
    this.issuingBodyService.allIssuingBodies().map((issuingBody) => ({
      id: issuingBody.id,
      name: issuingBody.name,
      description: issuingBody.description,
      status: issuingBody.isActive ? 'Active' : 'Inactive',
      createdDate: issuingBody.createdAt
        ? new Date(issuingBody.createdAt).toLocaleDateString()
        : '-',
    }))
  );

  loading = this.issuingBodyService.loading;

  tableConfigurations: TableConfig = {
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'status', label: 'Status', type: 'status' },
      { key: 'createdDate', label: 'Created date' },
    ],
    actions: { edit: true },
  };

  async ngOnInit(): Promise<void> {
    await this.issuingBodyService.getAll();
  }

  onAdd() {
    this.selectedIssuingBody.set(undefined);
    this.viewType.set('add');
    this.formTitle.set('Add new issuing body');
    this.formDescription.set('Create an issuing body for trips.');
    this.viewDetails.set(true);
  }

  onEdit(row: any) {
    const ib = this.issuingBodyService.getById(row.id);
    this.selectedIssuingBody.set(ib);
    this.viewType.set('edit');
    this.formTitle.set('Edit issuing body');
    this.formDescription.set(`Editing: ${row.name}`);
    this.viewDetails.set(true);
  }

  async onCloseForm() {
    this.viewDetails.set(false);
    this.viewType.set('');
    this.formTitle.set('');
    this.formDescription.set('');
    this.selectedIssuingBody.set(undefined);
    await this.issuingBodyService.getAll();
  }
}
