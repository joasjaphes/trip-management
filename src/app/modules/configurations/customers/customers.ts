import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DataTable, TableConfig } from '../../../shared/components/data-table/data-table';
import { Layout } from '../../../shared/components/layout/layout';
import { CustomerService } from '../../../services/customer.service';
import { CustomerForm } from './customer-form/customer-form';
import { Customer } from '../../../models/customer.model';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, DataTable, Layout, CustomerForm],
  templateUrl: './customers.html',
})
export class Customers implements OnInit {
  private customerService = inject(CustomerService);

  title = signal('Customers');
  description = signal('Manage customer records used for trips and invoices.');
  addText = signal('Add customer');
  viewType = signal('');
  viewDetails = signal(false);
  formTitle = signal('');
  formDescription = signal('');
  selectedCustomer = signal<Customer | undefined>(undefined);

  customers = computed(() =>
    this.customerService.allCustomers().map((customer) => ({
      id: customer.id,
      name: customer.name,
      tin: customer.tin,
      phone: customer.phone || '-',
      createdDate: customer.createdAt
        ? new Date(customer.createdAt).toLocaleDateString()
        : '-',
    }))
  );

  tableConfigurations: TableConfig = {
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'tin', label: 'TIN' },
      { key: 'phone', label: 'Phone' },
      { key: 'createdDate', label: 'Created date' },
    ],
    actions: { edit: true },
  };

  async ngOnInit(): Promise<void> {
    await this.customerService.getAll();
  }

  onAdd() {
    this.selectedCustomer.set(undefined);
    this.viewType.set('add');
    this.formTitle.set('Add customer');
    this.formDescription.set('Register a customer for trip billing and invoicing.');
    this.viewDetails.set(true);
  }

  onEdit(row: any) {
    const customer = this.customerService.getById(row.id);
    this.selectedCustomer.set(customer);
    this.viewType.set('edit');
    this.formTitle.set('Edit customer');
    this.formDescription.set(`Editing: ${row.name}`);
    this.viewDetails.set(true);
  }

  async onCloseForm() {
    this.viewDetails.set(false);
    this.viewType.set('');
    this.formTitle.set('');
    this.formDescription.set('');
    this.selectedCustomer.set(undefined);
    await this.customerService.getAll();
  }
}
