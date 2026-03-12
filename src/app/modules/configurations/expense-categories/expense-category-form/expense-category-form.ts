import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SaveArea } from '../../../../shared/components/save-area/save-area';
import { ExpenseCategoryService } from '../../../../services/expense-category.service';
import { ExpenseCategory } from '../../../../models/expense-category.model';

@Component({
  selector: 'app-expense-category-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SaveArea],
  templateUrl: './expense-category-form.html'
})
export class ExpenseCategoryForm implements OnInit {
  private expenseCategoryService = inject(ExpenseCategoryService);
  selectedCategory = input<ExpenseCategory | undefined>(undefined);
  loading = this.expenseCategoryService.loading;
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  actionMessage = signal<string | null>(null);

  expenseName = '';
  category = 'GENERAL';
  description = '';
  isActive = true;
  close = output();

  get isEditMode(): boolean {
    return !!this.selectedCategory()?.id;
  }

  ngOnInit(): void {
    const category = this.selectedCategory();
    if (!category) {
      return;
    }

    this.expenseName = category.name;
    this.category = category.category || 'GENERAL';
    this.description = category.description || '';
    this.isActive = category.isActive ?? category.status === 'Active';
  }

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
    this.actionMessage.set(this.isEditMode ? 'Updating expense category...' : 'Saving expense category...');

    try {
      if (this.isEditMode) {
        await this.expenseCategoryService.update(
          this.selectedCategory()!.id,
          this.expenseName,
          this.description,
          this.category,
          this.isActive
        );
      } else {
        await this.expenseCategoryService.create(
          this.expenseName,
          this.description,
          this.category,
          this.isActive
        );
      }

      this.successMessage.set(
        this.isEditMode ? 'Expense category updated successfully.' : 'Expense category saved successfully.'
      );
      await this.waitForLoadingToFinish();
      this.close.emit();
    } catch (error) {
      this.errorMessage.set(String(error || 'Could not save expense category. Please try again.'));
    } finally {
      this.actionMessage.set(null);
    }
  }
}
