import { Component, inject, signal, ChangeDetectionStrategy, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ExpenseCategoryService } from '../../../services/expense-category.service';

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

  onSubmit(): void {
    if (!this.categoryName().trim()) {
      return;
    }

    this.expenseCategoryService.create(
      this.categoryName().trim(),
      this.description().trim(),
      this.category().trim(),
      this.isActive() // Pass the selected category
    );

    // Wait for request to complete and reset form
    setTimeout(() => {
      if (!this.error()) {
        this.categoryName.set('');
        this.description.set('');
        this.isActive.set(true);
        this.onSaved.emit();
      }
    }, 400);
  }

  reset(): void {
    this.categoryName.set('');
    this.description.set('');
    this.isActive.set(true);
  }
}
