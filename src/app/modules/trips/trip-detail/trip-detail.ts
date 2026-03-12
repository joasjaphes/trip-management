import { Component, input, output, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Trip, TripExpense } from '../../../models/trip.model';
import { ExpenseCategoryService } from '../../../services/expense-category.service';

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trip-detail.html'
})
export class TripDetail {
  private expenseCategoryService = inject(ExpenseCategoryService);

  trip = input<Trip | undefined>();
  completing = input(false);
  close = output();
  complete = output<Trip>();

  confirmingComplete = signal(false);
  
  totalExpenses = computed(() => {
    return (this.trip()?.expenses || []).reduce((sum, expense) => sum + expense.amount, 0);
  });

  async ngOnInit() {
    await this.expenseCategoryService.getAll();
  }

  goBack() {
    this.confirmingComplete.set(false);
    this.close.emit();
  }

  canComplete = computed(() => {
    const status = this.trip()?.status;
    return status === 'pending' || status === 'inprogress';
  });

  requestComplete() {
    this.confirmingComplete.set(true);
  }

  cancelComplete() {
    this.confirmingComplete.set(false);
  }

  confirmComplete() {
    const trip = this.trip();
    if (!trip) {
      return;
    }

    this.confirmingComplete.set(false);
    this.complete.emit(trip);
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-50 text-yellow-600 border-yellow-200',
      'inprogress': 'bg-blue-50 text-blue-600 border-blue-200',
      'completed': 'bg-emerald-50 text-emerald-600 border-emerald-200',
      'cancelled': 'bg-red-50 text-red-600 border-red-200'
    };
    return colors[status] || colors['pending'];
  }

  getExpenseCategoryName(expense: TripExpense): string {
    if (expense.category?.name) {
      return expense.category.name;
    }

    const category = this.expenseCategoryService.getById(expense.expenseId);
    return category?.name || 'Other';
  }

  getCategoryColor(categoryName: string | undefined): string {
    const colors: Record<string, string> = {
      'fuel': 'bg-red-50 text-[#f25f2f] border-red-100',
      'toll': 'bg-orange-50 text-orange-600 border-orange-100',
      'food': 'bg-amber-50 text-amber-600 border-amber-100',
      'accommodation': 'bg-indigo-50 text-indigo-600 border-indigo-100',
      'maintenance': 'bg-purple-50 text-purple-600 border-purple-100',
      'other': 'bg-gray-50 text-gray-600 border-gray-100'
    };
    const name = (categoryName || 'other').toLowerCase();
    return colors[name] || colors['other'];
  }

  getExpenseCategoryColor(expense: TripExpense): string {
    return this.getCategoryColor(this.getExpenseCategoryName(expense));
  }
}
