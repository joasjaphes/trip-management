import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Invoice, InvoiceStatus } from '../../../models/invoice.model';
import { InvoiceService } from '../../../services/invoice.service';
import { TripService } from '../../../services/trip.service';
import { DataTable, TableConfig } from '../../../shared/components/data-table/data-table';
import { Layout } from '../../../shared/components/layout/layout';

@Component({
  selector: 'app-invoicing',
  standalone: true,
  imports: [CommonModule, FormsModule, Layout, DataTable],
  templateUrl: './invoicing.html',
})
export class Invoicing implements OnInit {
  private invoiceService = inject(InvoiceService);
  private tripService = inject(TripService);

  title = signal('Invoicing');
  description = signal('Manage invoice generation and billing status changes.');
  addText = signal('Generate invoice');
  viewDetails = signal(false);
  showAddButton = signal(false);
  formTitle = signal('');
  formDescription = signal('');

  selectedTripId = '';
  generationStatus: InvoiceStatus = 'draft';
  selectedInvoice = signal<Invoice | undefined>(undefined);
  selectedStatus: InvoiceStatus = 'draft';

  loading = computed(
    () => this.invoiceService.loading() || this.tripService.loading()
  );
  totalOutstanding = this.invoiceService.totalOutstanding;

  invoices = computed(() =>
    this.invoiceService.allInvoices().map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber || '-',
      tripRoute: invoice.trip?.route?.name || invoice.tripId,
      customer: invoice.customer?.name || '-',
      amount: Number(invoice.amount || 0).toLocaleString(),
      status: invoice.status,
      issuedAt: invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString() : '-',
      _invoice: invoice,
    }))
  );

  tripsWithoutInvoice = computed(() => {
    const usedTripIds = new Set(this.invoiceService.allInvoices().map((invoice) => invoice.tripId));
    return this.tripService
      .allTrips()
      .filter((trip) => !usedTripIds.has(trip.id))
      .map((trip) => ({
        id: trip.id,
        label: `${trip.route?.name || trip.routeId} (${new Date(trip.tripDate).toLocaleDateString()})`,
      }));
  });

  tableConfigurations: TableConfig = {
    columns: [
      { key: 'invoiceNumber', label: 'Invoice #' },
      { key: 'tripRoute', label: 'Trip' },
      { key: 'customer', label: 'Customer' },
      { key: 'amount', label: 'Amount' },
      { key: 'status', label: 'Status' },
      { key: 'issuedAt', label: 'Issued at' },
    ],
    actions: {
      view: true,
    },
  };

  async ngOnInit(): Promise<void> {
    await Promise.all([this.invoiceService.getAll(), this.tripService.getAll()]);
  }

  onAdd() {
    this.formTitle.set('Generate invoice');
    this.formDescription.set('Create a new invoice for a completed or active trip.');
    this.selectedTripId = '';
    this.generationStatus = 'draft';
    this.selectedInvoice.set(undefined);
    this.viewDetails.set(true);
  }

  onView(row: { _invoice: Invoice }) {
    const invoice = row._invoice;
    this.selectedInvoice.set(invoice);
    this.selectedStatus = invoice.status;
    this.formTitle.set(`Invoice ${invoice.invoiceNumber || invoice.id}`);
    this.formDescription.set('Review invoice details and update billing status.');
    this.viewDetails.set(true);
  }

  async generateInvoice() {
    if (!this.selectedTripId) {
      return;
    }

    await this.invoiceService.generateForTrip(this.selectedTripId, this.generationStatus);
    this.viewDetails.set(false);
  }

  async saveInvoiceStatus() {
    const selected = this.selectedInvoice();
    if (!selected || !this.selectedStatus || selected.status === this.selectedStatus) {
      return;
    }

    await this.invoiceService.updateStatus(selected.id, this.selectedStatus);
    const refreshed = this.invoiceService.getById(selected.id);
    if (refreshed) {
      this.selectedInvoice.set(refreshed);
      this.selectedStatus = refreshed.status;
    }
  }

  closePanel() {
    this.viewDetails.set(false);
    this.selectedInvoice.set(undefined);
    this.formTitle.set('');
    this.formDescription.set('');
  }
}