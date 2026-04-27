import { Vendor } from './vendor.model';

export type PurchaseOrderStatus = 'Pending' | 'Approved' | 'Completed';

export interface PurchaseOrderItem {
  id?: string;
  itemId: string;
  description?: string;
  amount: number;
}

export interface PurchaseOrder {
  id: string;
  purchaseOrderReferenceNumber: string;
  vendorId: string;
  vendor?: Vendor;
  orderDate: string;
  approvedDate?: string;
  completionDate?: string;
  completionAttachment?: string;
  approvedByUserId?: string;
  completedByUserId?: string;
  orderStatus: PurchaseOrderStatus;
  orderItems: PurchaseOrderItem[];
  createdAt?: string;
  updatedAt?: string;
}
