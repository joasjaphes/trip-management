import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SaveArea } from '../../../../shared/components/save-area/save-area';
import { ExpenseCategoryService } from '../../../../services/expense-category.service';

@Component({
  selector: 'app-expense-category-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SaveArea],
  templateUrl: './expense-category-form.html'
})
export class ExpenseCategoryForm {
  private expenseCategoryService = inject(ExpenseCategoryService);
  loading = this.expenseCategoryService.loading;
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  actionMessage = signal<string | null>(null);

  expenseName = '';
  category = 'GENERAL';
  description = '';
  isActive = true;
  close = output();

  goBack() {
    this.close.emit();
  }

  private async waitForLoadingToFinish(timeoutMs = 6000): Promise<void> {
    const start = Date.now();
    while (this.loading() && Date.now() - start < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  async onSubmit() {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.actionMessage.set('Saving expense category...');

    try {
      await this.expenseCategoryService.create(
        this.expenseName,
        this.description,
        this.category,
        this.isActive
      );

      this.successMessage.set('Expense category saved successfully.');
      await this.waitForLoadingToFinish();
      this.close.emit();
    } catch (error) {
      this.errorMessage.set(String(error || 'Could not save expense category. Please try again.'));
    } finally {
      this.actionMessage.set(null);
    }
  }
}
