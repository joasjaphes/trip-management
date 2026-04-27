import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTable, TableConfig } from '../../../shared/components/data-table/data-table';
import { Layout } from '../../../shared/components/layout/layout';
import { ExpenseCategoryForm } from './expense-category-form/expense-category-form';
import { ExpenseCategoryService } from '../../../services/expense-category.service';
import { ExpenseCategory } from '../../../models/expense-category.model';
import { MatTabsModule } from '@angular/material/tabs';
import { FormsModule } from '@angular/forms';
import { SaveArea } from '../../../shared/components/save-area/save-area';

@Component({
  selector: 'app-expense-categories',
  standalone: true,
  imports: [CommonModule, DataTable, Layout, ExpenseCategoryForm, MatTabsModule, FormsModule],
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
  newExpenseIsActive = true;
  savingNewExpense = {};
  confirmSavingNewExpense = {};
  selectedCategory = signal<ExpenseCategory | undefined>(undefined);
  expandedCategoryId = signal<string | null>(null);
  type = signal<'TRIP' | 'OFFICE'>('TRIP');
  isPurchase = signal(false);

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
    this.categories().filter((cat) => cat.type === 'OFFICE' && !cat.isPurchase && !cat.parentId)
  );

  purchaseCategories = computed(() =>
    this.categories().filter((cat) => cat.isPurchase && !cat.parentId)
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

  onAdd(isPurchase = false, type: 'TRIP' | 'OFFICE' = 'TRIP') {
    this.selectedCategory.set(undefined);
    this.isPurchase.set(isPurchase);
    this.type.set(type);
    this.viewType.set('add');
    this.formTitle.set( isPurchase ? 'Add new item' : 'Add new expense');
    this.formDescription.set( isPurchase ? 'Create a new item classification for operations.' : 'Create a new expense classification for operations.');
    this.viewDetails.set(true);
  }

  onEdit(row: { id: string }) {
    const category = this.expenseCategoryService.getById(row.id);
    if (!category) {
      return;
    }

    this.isPurchase.set(category.isPurchase ?? false);
    this.type.set(category.type);

    this.selectedCategory.set(category);
    this.viewType.set('edit');
    this.formTitle.set(category.isPurchase ? 'Edit item' : 'Edit expense');
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
    this.isPurchase.set(false);
    this.type.set('TRIP');
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
    const expenseCategory = this.officeCategories().find(cat => cat.id === categoryId);
    if (!expenseCategory) {
      console.error('Parent category not found for id:', categoryId);
      return;
    }
    this.savingNewExpense[categoryId] = true;
    try{
      await this.expenseCategoryService.create(
        this.newExpenseName(),
        expenseCategory.type,
        expenseCategory.isPurchase,
        '',
        expenseCategory.category,
        this.newExpenseIsActive,
        categoryId
      );
      this.newExpenseName.set('');
      this.newExpenseIsActive = true;
      await this.expenseCategoryService.getAll();
    }catch(e){
      console.error('Error adding new expense:', e);
    } finally {
      this.savingNewExpense[categoryId] = false;
    }
  }

}
