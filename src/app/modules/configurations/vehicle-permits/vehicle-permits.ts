import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTable, TableConfig } from '../../../shared/components/data-table/data-table';
import { Layout } from '../../../shared/components/layout/layout';
import { PermitForm } from './permit-form/permit-form';
import { PermitDetail } from './permit-detail/permit-detail';
import { PermitRegistrationService } from '../../../services/permit-registration.service';
import { Permit } from '../../../models/permits.model';

@Component({
  selector: 'app-vehicle-permits',
  standalone: true,
  imports: [CommonModule, DataTable, Layout, PermitForm, PermitDetail],
  templateUrl: './vehicle-permits.html',
})
export class VehiclePermits implements OnInit {
  private permitRegistrationService = inject(PermitRegistrationService);

  title = signal('Permits management');
  description = signal('Manage and track regulatory permits for your fleet');
  addText = signal('Add new permit');
  viewType = signal<'add' | 'edit' | 'view' | ''>('');
  viewDetails = signal(false);
  formTitle = signal('');
  formDescription = signal('');
  selectedPermit = signal<Permit | undefined>(undefined);
  splitSize = signal<'full' | 'half'>('full');
  loading = this.permitRegistrationService.loading;

  permits = computed(() =>
    this.permitRegistrationService.allPermits().map((permit) => ({
      id: permit.id,
      name: permit.name,
      authorizingBody: permit.authorizingBody || '-',
      status: permit.isActive ? 'Active' : 'Inactive',
      createdDate: permit.createdAt
        ? new Date(permit.createdAt).toLocaleDateString()
        : '-',
    }))
  );
  async ngOnInit(): Promise<void> {
    await this.permitRegistrationService.getAll();
  }


  tableConfigurations: TableConfig = {
    columns: [
      { key: 'name', label: 'Permit name' },
      { key: 'authorizingBody', label: 'Authorizing body' },
      { key: 'status', label: 'Status', type: 'status' },
      { key: 'createdDate', label: 'Created date' }
    ],
    actions: { edit: true, view: true }
  };

  onAdd() {
    this.selectedPermit.set(undefined);
    this.viewType.set('add');
    this.formTitle.set('Add new permit');
    this.formDescription.set('Provide regulatory details for a new vehicle permit.');
    this.splitSize.set('full');
    this.viewDetails.set(true);
  }

  onEdit(row: { id: string }) {
    const permit = this.permitRegistrationService.allPermits().find((p) => p.id === row.id);
    if (!permit) return;
    this.selectedPermit.set(permit);
    this.viewType.set('edit');
    this.formTitle.set('Edit permit');
    this.formDescription.set(permit.name);
    this.splitSize.set('full');
    this.viewDetails.set(true);
  }

  onView(row: { id: string }) {
    const permit = this.permitRegistrationService.allPermits().find((p) => p.id === row.id);
    if (!permit) return;
    this.selectedPermit.set(permit);
    this.viewType.set('view');
    this.formTitle.set('Permit Details');
    this.formDescription.set(permit.name);
    this.splitSize.set('full');
    this.viewDetails.set(true);
  }

  async onCloseForm() {
    this.viewDetails.set(false);
    this.viewType.set('');
    this.formTitle.set('');
    this.formDescription.set('');
    this.selectedPermit.set(undefined);
    this.splitSize.set('full');
    await this.permitRegistrationService.getAll();
  }
}
