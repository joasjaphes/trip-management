import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { Layout, SplitSize } from '../../shared/components/layout/layout';
import { DataTable, TableConfig } from '../../shared/components/data-table/data-table';
import { ExpenseCategory } from '../../models/expense-category.model';
import { CommonModule } from '@angular/common';
import { AddExpenseCategory } from './add-expense-category/add-expense-category';
import { ExpenseCategoryService } from '../../services/expense-category.service';

@Component({
  selector: 'app-expense-categories',
  imports: [Layout, DataTable, AddExpenseCategory, CommonModule],
  templateUrl: './expense-categories.html',
  styleUrl: './expense-categories.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseCategories {
  private expenseCategoryService = inject(ExpenseCategoryService);

  title = signal('Expense Categories');
  viewDetails = signal(false);
  viewType = signal<'add' | 'edit'>('add');
  formSize = signal<SplitSize>('half');
  selectedCategoryId = signal<string | null>(null);

  // Get data from service
  expenseCategories = this.expenseCategoryService.allCategories;
  isLoading = this.expenseCategoryService.loading;
  activeCategoriesCount = this.expenseCategoryService.activeCategoriesCount;

  // Table configuration
  tableConfig = signal<TableConfig>({
    columns: [
      { key: 'name', label: 'Category Name', sortable: true },
      { key: 'description', label: 'Description', sortable: false },
      { key: 'isActive', label: 'Status', sortable: true },
      { key: 'createdAt', label: 'Created', sortable: true },
      { key: 'updatedAt', label: 'Updated', sortable: true },
    ],
    pageSize: 10,
    striped: true,
    hover: true,
    bordered: false,
  });

  onAdd(): void {
    this.viewType.set('add');
    this.selectedCategoryId.set(null);
    this.viewDetails.set(true);
  }

  onRowClick(category: ExpenseCategory): void {
    this.selectedCategoryId.set(category.id);
    this.viewType.set('edit');
    this.viewDetails.set(true);
  }

  onRowSelect(selectedCategories: ExpenseCategory[]): void {
    console.log('Selected categories:', selectedCategories);
  }

  onSortChange(event: { column: string; direction: 'asc' | 'desc' }): void {
    console.log('Sort changed:', event);
  }

  onFormSaved(): void {
    this.viewDetails.set(false);
    this.selectedCategoryId.set(null);
  }
}
