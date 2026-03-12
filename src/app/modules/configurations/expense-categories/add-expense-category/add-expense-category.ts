import { Component, inject, signal, ChangeDetectionStrategy, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ExpenseCategoryService } from '../../../../services/expense-category.service';

@Component({
  selector: 'app-add-expense-category',
  imports: [FormsModule, CommonModule],
  templateUrl: './add-expense-category.html',
  styleUrl: './add-expense-category.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddExpenseCategory {
  private expenseCategoryService = inject(ExpenseCategoryService);

  // Form state
  categoryName = signal('');
  description = signal('');
  isActive = signal(true);
  category = signal('GENERAL'); // New category field

  // Output event
  onSaved = output<void>();

  // Expose service loading state
  isLoading = this.expenseCategoryService.loading;
  error = this.expenseCategoryService.errorMessage;
  successMessage = signal<string | null>(null);
  actionMessage = signal<string | null>(null);

  private async waitForLoadingToFinish(timeoutMs = 6000): Promise<void> {
    const start = Date.now();
    while (this.isLoading() && Date.now() - start < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.categoryName().trim()) {
      return;
    }

    this.successMessage.set(null);
    this.actionMessage.set('Saving expense category...');

    try {
      await this.expenseCategoryService.create(
        this.categoryName().trim(),
        this.description().trim(),
        this.category().trim(),
        this.isActive()
      );

      this.successMessage.set('Expense category saved successfully.');
      await this.waitForLoadingToFinish();

      if (!this.error()) {
        this.categoryName.set('');
        this.description.set('');
        this.isActive.set(true);
        this.onSaved.emit();
      }
    } finally {
      this.actionMessage.set(null);
    }
  }

  reset(): void {
    this.categoryName.set('');
    this.description.set('');
    this.isActive.set(true);
  }
}
