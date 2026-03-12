import { computed, Injectable, signal } from '@angular/core';
import { Invoice, InvoiceStatus } from '../models/invoice.model';
import { HttpClientService } from './http-client.service';
import { CommonService } from './common.service';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  private invoices = signal<Invoice[]>([]);
  private isLoading = signal(false);
  private error = signal<string | null>(null);

  readonly allInvoices = this.invoices.asReadonly();
  readonly loading = this.isLoading.asReadonly();
  readonly errorMessage = this.error.asReadonly();

  readonly totalOutstanding = computed(() =>
    this.invoices()
      .filter((invoice) => invoice.status !== 'paid' && invoice.status !== 'cancelled')
      .reduce((sum, invoice) => sum + (Number(invoice.amount || 0) - Number(invoice.paidAmount || 0)), 0)
  );

  constructor(
    private http: HttpClientService,
    private commonService: CommonService
  ) {}

  async getAll(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const invoices = await this.http.get<Invoice[]>('invoices');
      this.invoices.set(invoices);
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to fetch invoices');
      console.error('Failed to fetch invoices', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  getById(id: string): Invoice | undefined {
    return this.invoices().find((invoice) => invoice.id === id);
  }

  async generateForTrip(tripId: string, status: InvoiceStatus = 'draft'): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.http.post('invoices', {
        id: this.commonService.makeid(),
        tripId,
        status,
      });
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to generate invoice');
      console.error('Failed to generate invoice', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async updateStatus(id: string, status: InvoiceStatus): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.http.patch(`invoices/${id}/status`, { status });
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to update invoice status');
      console.error('Failed to update invoice status', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }
}
