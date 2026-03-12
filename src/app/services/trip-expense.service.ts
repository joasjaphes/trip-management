import { Injectable, signal, computed } from '@angular/core';
import { TripExpense } from '../models';
import { HttpClientService } from './http-client.service';
import { CommonService } from './common.service';

type TripExpenseCreatePayload = {
  tripId: string;
  expenseId: string;
  expenseDescription?: string;
  amount?: number;
  receiptAttachment?: string;
  date?: string;
};

@Injectable({
  providedIn: 'root',
})
export class TripExpenseService {
  private expenses = signal<TripExpense[]>([]);
  private isLoading = signal(false);
  private error = signal<string | null>(null);

  readonly allExpenses = this.expenses.asReadonly();
  readonly loading = this.isLoading.asReadonly();
  readonly errorMessage = this.error.asReadonly();

  readonly totalExpenseAmount = computed(
    () => this.expenses().reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
  );

  constructor(private http: HttpClientService, private commonService: CommonService) {}

  async getAll(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const expenses = await this.http.get<TripExpense[]>('trip-expenses');
      this.expenses.set(expenses);
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to fetch trip expenses');
      console.error('Failed to fetch trip expenses', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  getById(id: string): TripExpense | undefined {
    return this.expenses().find((expense) => expense.id === id);
  }

  async create(expense: TripExpenseCreatePayload): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.http.post('trip-expenses', {
        id: this.commonService.makeid(),
        tripId: expense.tripId,
        expenseId: expense.expenseId,
        expenseDescription: expense.expenseDescription,
        amount: expense.amount,
        receiptAttachment: expense.receiptAttachment,
        date: expense.date || new Date(),
      });
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to create trip expense');
      console.error('Failed to create trip expense', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async update(id: string, expense: Partial<TripExpense>): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const existing = this.getById(id);
      await this.http.put('trip-expenses', {
        id,
        tripId: expense.tripId ?? existing?.tripId,
        expenseId: expense.expenseId ?? existing?.expenseId,
        expenseDescription: expense.expenseDescription ?? existing?.expenseDescription,
        amount: expense.amount ?? existing?.amount,
        receiptAttachment: expense.receiptAttachment ?? existing?.receiptAttachment,
        date: expense.date ?? existing?.date,
      });
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to update trip expense');
      console.error('Failed to update trip expense', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async delete(id: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.http.delete(`trip-expenses/${id}`);
      this.expenses.update((expenses) => expenses.filter((expense) => expense.id !== id));
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to delete trip expense');
      console.error('Failed to delete trip expense', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  getByTripId(tripId: string): TripExpense[] {
    return this.expenses().filter((expense) => expense.tripId === tripId);
  }
}
