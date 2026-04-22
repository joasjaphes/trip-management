import { ExpenseCategory } from './expense-category.model';
import { Vendor } from './vendor.model';

export interface ExpenseTransaction {
  id: string;
  expenseId: string;
  vendorId?: string;
  vendor?: Vendor;
  vendorName?: string;
  vendorTIN?: string;
  description?: string;
  transactionAmount: number;
  transactionDate?: string;
  quantity?: number;
  unitPrice?: number;
  attachment?: string;
  expense?: ExpenseCategory;
  createdAt?: Date;
  updatedAt?: Date;
}
