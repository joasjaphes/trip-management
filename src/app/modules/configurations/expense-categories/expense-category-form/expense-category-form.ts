import { Component, inject, output } from '@angular/core';
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

  expenseName = '';
  category = 'GENERAL';
  description = '';
  isActive = true;
  close = output();

  goBack() {
    this.close.emit();
  }

  async onSubmit() {
    await this.expenseCategoryService.create(
      this.expenseName,
      this.description,
      this.category,
      this.isActive
    );

    this.close.emit();
  }
}
