import { ExpenseCategory } from './expense-category.model';

export interface ExpenseTransaction {
  id: string;
  expenseId: string;
  vendorName: string;
  vendorTIN: string;
  transactionAmount: number;
  transactionDate?: string;
  quantity?: number;
  unitPrice?: number;
  attachment?: string;
  expense?: ExpenseCategory;
  createdAt?: Date;
  updatedAt?: Date;
}
