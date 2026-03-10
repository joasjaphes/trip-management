import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTable, TableConfig } from '../../../shared/components/data-table/data-table';
import { Layout } from '../../../shared/components/layout/layout';
import { PermitForm } from './permit-form/permit-form';
import { PermitRegistrationService } from '../../../services/permit-registration.service';

@Component({
  selector: 'app-vehicle-permits',
  standalone: true,
  imports: [CommonModule, DataTable, Layout, PermitForm],
  templateUrl: './vehicle-permits.html',
})
export class VehiclePermits implements OnInit {
  private permitRegistrationService = inject(PermitRegistrationService);

  title = signal('Permits management');
  description = signal('Manage and track regulatory permits for your fleet');
  addText = signal('Add new permit');
  viewType = signal('');
  viewDetails = signal(false);
  formTitle = signal('');
  formDescription = signal('');

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
      {
        key: 'name',
        label: 'Permit name'
      },
      {
        key: 'authorizingBody',
        label: 'Authorizing body'
      },
      {
        key: 'status',
        label: 'Status'
      },
      {
        key: 'createdDate',
        label: 'Created date'
      }
    ]
  };

  onAdd() {
    this.viewType.set('add');
    this.formTitle.set('Add new permit');
    this.formDescription.set('Provide regulatory details for a new vehicle permit.');
    this.viewDetails.set(true);
  }

  async onCloseForm() {
    this.viewDetails.set(false);
    this.viewType.set('');
    this.formTitle.set('');
    this.formDescription.set('');
    await this.permitRegistrationService.getAll();
  }
}
