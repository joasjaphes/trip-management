export interface ExpenseCategory {
  id: string;
  name: string;
  category:string;
  type: 'TRIP' | 'OFFICE'
  status: 'Active' | 'Inactive';
  description?: string;
  parentId?: string;
  children?: ExpenseCategory[];
  isActive?: boolean;
  isPurchase?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
