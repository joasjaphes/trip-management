import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ExpenseCategory } from '../../../models/expense-category.model';
import { ExpenseTransaction } from '../../../models/expense-transaction.model';
import { ExpenseCategoryService } from '../../../services/expense-category.service';
import { ExpenseTransactionService } from '../../../services/expense-transaction.service';
import { VendorService } from '../../../services/vendor.service';
import { DataTable, TableConfig } from '../../../shared/components/data-table/data-table';
import { Layout } from '../../../shared/components/layout/layout';
import { ExpenseTransactionForm } from './expense-transaction-form/expense-transaction-form';

type ExpenseCategoryWithChildrens = ExpenseCategory & {
  childrens?: ExpenseCategory[];
};

@Component({
  selector: 'app-expense-transactions',
  imports: [CommonModule, DataTable, Layout, ExpenseTransactionForm],
  templateUrl: './expense-transactions.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseTransactions implements OnInit {
  private expenseCategoryService = inject(ExpenseCategoryService);
  private expenseTransactionService = inject(ExpenseTransactionService);
  private vendorService = inject(VendorService);

  title = signal('Office Expense Transactions');
  description = signal('Post and manage office expense transactions.');
  addText = signal('Post office transaction');
  viewType = signal('');
  viewDetails = signal(false);
  formTitle = signal('');
  splitSize = signal<'full'>('full');
  formDescription = signal('');
  selectedTransaction = signal<ExpenseTransaction | undefined>(undefined);
  showAddButton = signal(false);
  vendors = this.vendorService.allVendors;
  officeLeafExpenses = computed(() =>
    this.expenseCategoryService
      .allCategories()
      .filter((category) => category.type === 'OFFICE' && !this.hasChildren(category) && !category.isPurchase)
  );

  vendorNamesById = computed(() => new Map(this.vendorService.allVendors().map((vendor) => [vendor.id, vendor.vendorName])));

  transactions = computed(() => {
    const expenseNames = new Map(
      this.officeLeafExpenses().map((expense) => [expense.id, expense.name])
    );
    const vendorNames = this.vendorNamesById();

    return this.expenseTransactionService.allTransactions().map((transaction) => ({
      ...transaction,
      expenseName: expenseNames.get(transaction.expenseId) ?? transaction.expense?.name ?? '-',
      vendorDisplay: vendorNames.get(transaction.vendorId ?? '') ?? transaction.vendor?.vendorName ?? transaction.vendorName ?? '-',
      descriptionDisplay: transaction.description || '-',
      transactionDateDisplay: this.formatDate(transaction.transactionDate),
      attachmentName: this.getAttachmentName(transaction.attachment),
    }));
  });

  loading = computed(() => this.expenseCategoryService.loading() || this.expenseTransactionService.loading() || this.vendorService.loading());

  tableConfigurations: TableConfig = {
    columns: [
      { key: 'transactionDateDisplay', label: 'Transaction Date' },
      { key: 'vendorDisplay', label: 'Vendor' },
      { key: 'descriptionDisplay', label: 'Description' },
      { key: 'expenseName', label: 'Expense' },
      { key: 'transactionAmount', label: 'Amount', type: 'number' },
      { key: 'attachmentName', label: 'Attachment' },
    ],
    actions: {
      edit:true,
    }
  };

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.expenseCategoryService.getAll(),
      this.expenseTransactionService.getAll(),
      this.vendorService.getAll(),
    ]);
  }

  onAdd() {
    this.selectedTransaction.set(undefined);
    this.viewType.set('add');
    this.formTitle.set('Post office transaction');
    this.formDescription.set('Capture a new office expense transaction.');
    this.viewDetails.set(true);
  }

  onEdit(row: { id: string }) {
    const transaction = this.expenseTransactionService.getById(row.id);
    if (!transaction) {
      return;
    }

    this.selectedTransaction.set(transaction);
    this.viewType.set('edit');
    this.formTitle.set('Edit office transaction');
    this.formDescription.set('Update office expense transaction details.');
    this.viewDetails.set(true);
  }

  async onCloseForm() {
    this.viewDetails.set(false);
    this.viewType.set('');
    this.formTitle.set('');
    this.formDescription.set('');
    this.selectedTransaction.set(undefined);

    await Promise.all([
      this.expenseTransactionService.getAll(),
      this.vendorService.getAll(),
    ]);
  }

  private hasChildren(category: ExpenseCategory): boolean {
    const legacyChildrens = (category as ExpenseCategoryWithChildrens).childrens;
    return (category.children?.length ?? 0) > 0 || (legacyChildrens?.length ?? 0) > 0;
  }

  private formatDate(value?: string): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-': date.toLocaleDateString();
  }

  private getAttachmentName(value?: string): string {
    if (!value) {
      return '-';
    }

    const fileName = value.split('?')[0].split('/').filter(Boolean).pop();
    return fileName ? decodeURIComponent(fileName) : '-';
  }
}
