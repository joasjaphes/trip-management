export interface ExpenseCategory {
  id: string;
  name: string;
  category:string;
  type: 'TRIP' | 'OFFICE'
  status: 'Active' | 'Inactive';
  description?: string;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
