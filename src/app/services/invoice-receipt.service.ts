import { Injectable, computed, signal } from '@angular/core';
import { InvoiceReceipt } from '../models/invoice.model';
import { HttpClientService } from './http-client.service';
import { CommonService } from './common.service';

type InvoiceReceiptCreatePayload = {
  invoiceId: string;
  amount?: number;
  paidAt?: string;
  reference?: string;
  attachment?: string;
  notes?: string;
};

@Injectable({
  providedIn: 'root',
})
export class InvoiceReceiptService {
  private receipts = signal<InvoiceReceipt[]>([]);
  private isLoading = signal(false);
  private error = signal<string | null>(null);

  readonly allReceipts = this.receipts.asReadonly();
  readonly loading = this.isLoading.asReadonly();
  readonly errorMessage = this.error.asReadonly();

  readonly totalReceived = computed(() =>
    this.receipts().reduce((sum, receipt) => sum + Number(receipt.amount || 0), 0)
  );

  constructor(private http: HttpClientService, private commonService: CommonService) {}

  async getAll(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const receipts = await this.http.get<InvoiceReceipt[]>('receipts');
      this.receipts.set(receipts);
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to fetch invoice receipts');
      console.error('Failed to fetch invoice receipts', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  getById(id: string): InvoiceReceipt | undefined {
    return this.receipts().find((receipt) => receipt.id === id);
  }

  getByInvoiceId(invoiceId: string): InvoiceReceipt[] {
    return this.receipts().filter((receipt) => receipt.invoiceId === invoiceId);
  }

  async create(receipt: InvoiceReceiptCreatePayload): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.http.post('receipts', {
        id: this.commonService.makeid(),
        invoiceId: receipt.invoiceId,
        amount: receipt.amount,
        paidAt: receipt.paidAt || new Date().toISOString(),
        reference: receipt.reference,
        attachment: receipt.attachment,
        notes: receipt.notes,
      });
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to save invoice receipt');
      console.error('Failed to save invoice receipt', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async update(id: string, receipt: Partial<InvoiceReceipt>): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const existing = this.getById(id);
      await this.http.put('receipts', {
        id,
        invoiceId: receipt.invoiceId ?? existing?.invoiceId,
        amount: receipt.amount ?? existing?.amount,
        paidAt: receipt.paidAt ?? existing?.paidAt,
        reference: receipt.reference ?? existing?.reference,
        attachment: receipt.attachment ?? existing?.attachment,
        notes: receipt.notes ?? existing?.notes,
      });
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to update invoice receipt');
      console.error('Failed to update invoice receipt', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async delete(id: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.http.delete(`receipts/${id}`);
      this.receipts.update((receipts) => receipts.filter((receipt) => receipt.id !== id));
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to remove invoice receipt');
      console.error('Failed to remove invoice receipt', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }
}
