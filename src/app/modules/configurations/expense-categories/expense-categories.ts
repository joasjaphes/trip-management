import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTable, TableConfig } from '../../../shared/components/data-table/data-table';
import { Layout } from '../../../shared/components/layout/layout';
import { ExpenseCategoryForm } from './expense-category-form/expense-category-form';
import { ExpenseCategoryService } from '../../../services/expense-category.service';
import { ExpenseCategory } from '../../../models/expense-category.model';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-expense-categories',
  standalone: true,
  imports: [CommonModule, DataTable, Layout, ExpenseCategoryForm, MatTabsModule],
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
  newExpenseName = signal('');
  newExpenseIsActive = signal(true);
  savingNewExpense = {};
  selectedCategory = signal<ExpenseCategory | undefined>(undefined);
  expandedCategoryId = signal<string | null>(null);

  categories = computed(() =>
    this.expenseCategoryService.allCategories().map((category) => ({
      ...category,
      categoryType: category.category,
      createdDate: category.createdAt ? new Date(category.createdAt).toLocaleDateString() : '-',
    }))
  );

  tripCategories = computed(() =>
    this.categories().filter((cat) => cat.type === 'TRIP')
  );
  officeCategories = computed(() =>
    this.categories().filter((cat) => cat.type === 'OFFICE')
  );

  loading = this.expenseCategoryService.loading;

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
    this.formTitle.set('Add new expense');
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
    this.formTitle.set('Edit expense');
    this.formDescription.set(`Updating ${category.name}`);
    this.viewDetails.set(true);
  }

  setExpandedCategory(categoryId: string) {
    this.expandedCategoryId.set(this.expandedCategoryId() === categoryId ? null : categoryId);
  }

  async onCloseForm() {
    this.viewDetails.set(false);
    this.viewType.set('');
    this.formTitle.set('');
    this.formDescription.set('');
    this.selectedCategory.set(undefined);
    await this.expenseCategoryService.getAll();
  }

    getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'Active': 'bg-green-50 text-green-600 border-green-200 px-2 py-2 rounded-md',
      'Inactive': 'bg-red-50 text-red-600 border-red-200 px-2 py-2 rounded-md'
    };
    return colors[status] || colors['Inactive'];
  }

  async addNewExpense(categoryId: string) {
    this.savingNewExpense[categoryId] = true;
    try{
      await this.expenseCategoryService.create(
        this.newExpenseName(),
        categoryId === 'trip' ? 'TRIP' : 'OFFICE',
        '',
        categoryId.toUpperCase(),
        this.newExpenseIsActive()
      );
      this.newExpenseName.set('');
      this.newExpenseIsActive.set(true);
      await this.expenseCategoryService.getAll();
    }catch(e){
      console.error('Error adding new expense:', e);
    } finally {
      this.savingNewExpense[categoryId] = false;
    }
  }

}
