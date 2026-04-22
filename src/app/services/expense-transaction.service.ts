import { Injectable, computed, signal } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ExpenseTransaction } from '../models/expense-transaction.model';

export type ExpenseTransactionPayload = {
  id:string;
  expenseId: string;
  vendorId?: string;
  vendorName?:string;
  description?: string;
  transactionAmount: number;
  transactionDate: string;
  quantity: number;
  unitPrice: number;
  attachment?: string;
};

@Injectable({
  providedIn: 'root',
})
export class ExpenseTransactionService {
  private transactions = signal<ExpenseTransaction[]>([]);
  private isLoading = signal(false);
  private error = signal<string | null>(null);

  readonly allTransactions = this.transactions.asReadonly();
  readonly loading = this.isLoading.asReadonly();
  readonly errorMessage = this.error.asReadonly();

  readonly totalAmount = computed(() =>
    this.transactions().reduce((sum, transaction) => sum + Number(transaction.transactionAmount || 0), 0)
  );

  constructor(private http: HttpClientService) {}

  async getAll(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const transactions = await this.http.get<ExpenseTransaction[]>('expenseTransactions');
      this.transactions.set(transactions);
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to fetch expense transactions');
      console.error('Failed to fetch expense transactions', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  getById(id: string): ExpenseTransaction | undefined {
    return this.transactions().find((transaction) => transaction.id === id);
  }

  async create(transaction: ExpenseTransactionPayload): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.http.post('expenseTransactions', {
        id: transaction.id,
        expenseId: transaction.expenseId,
        vendorName: transaction.vendorName,
        vendorId: transaction.vendorId,
        description: transaction.description || undefined,
        transactionAmount: Number(transaction.transactionAmount),
        transactionDate: transaction.transactionDate,
        quantity: Number(transaction.quantity),
        unitPrice: Number(transaction.unitPrice),
        attachment: transaction.attachment,
      });
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to create expense transaction');
      console.error('Failed to create expense transaction', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async update(id: string, transaction: ExpenseTransactionPayload): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.http.put('expenseTransactions', {
        id,
        expenseId: transaction.expenseId,
        vendorId: transaction.vendorId,
        description: transaction.description || undefined,
        transactionAmount: Number(transaction.transactionAmount),
        transactionDate: transaction.transactionDate,
        quantity: Number(transaction.quantity),
        unitPrice: Number(transaction.unitPrice),
        attachment: transaction.attachment,
      });
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to update expense transaction');
      console.error('Failed to update expense transaction', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }
}
