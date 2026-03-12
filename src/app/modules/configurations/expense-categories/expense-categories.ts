import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTable, TableConfig } from '../../../shared/components/data-table/data-table';
import { Layout } from '../../../shared/components/layout/layout';
import { ExpenseCategoryForm } from './expense-category-form/expense-category-form';
import { ExpenseCategoryService } from '../../../services/expense-category.service';
import { ExpenseCategory } from '../../../models/expense-category.model';

@Component({
  selector: 'app-expense-categories',
  standalone: true,
  imports: [CommonModule, DataTable, Layout, ExpenseCategoryForm],
  templateUrl: './expense-categories.html',
})
export class ExpenseCategories implements OnInit {
  private expenseCategoryService = inject(ExpenseCategoryService);

  title = signal('Expenses');
  description = signal('Configure and manage trip expenses');
  addText = signal('Add new expense');
  viewType = signal('');
  viewDetails = signal(false);
  formTitle = signal('');
  formDescription = signal('');
  selectedCategory = signal<ExpenseCategory | undefined>(undefined);

  categories = computed(() =>
    this.expenseCategoryService.allCategories().map((category) => ({
      ...category,
      categoryType: category.category,
      createdDate: category.createdAt ? new Date(category.createdAt).toLocaleDateString() : '-',
    }))
  );

  tableConfigurations: TableConfig = {
    columns: [
      {
        key: 'name',
        label: 'Name'
      },
      {
        key: 'categoryType',
        label: 'Category type'
      },
      {
        key: 'status',
        label: 'Status',
        type: 'status'
      },
      // {
      //   key: 'description',
      //   label: 'Description'
      // },
      {
        key: 'createdDate',
        label: 'Created date'
      }
    ],
    actions: { edit: true }
  };

  async ngOnInit(): Promise<void> {
    await this.expenseCategoryService.getAll();
  }

  onAdd() {
    this.selectedCategory.set(undefined);
    this.viewType.set('add');
    this.formTitle.set('Add new category');
    this.formDescription.set('Create a new expense classification for operations.');
    this.viewDetails.set(true);
  }

  onEdit(row: { id: string }) {
    const category = this.expenseCategoryService.getById(row.id);
    if (!category) {
      return;
    }

    this.selectedCategory.set(category);
    this.viewType.set('edit');
    this.formTitle.set('Edit category');
    this.formDescription.set(`Updating ${category.name}`);
    this.viewDetails.set(true);
  }

  async onCloseForm() {
    this.viewDetails.set(false);
    this.viewType.set('');
    this.formTitle.set('');
    this.formDescription.set('');
    this.selectedCategory.set(undefined);
    await this.expenseCategoryService.getAll();
  }
}
