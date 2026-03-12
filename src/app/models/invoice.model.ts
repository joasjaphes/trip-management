import type { Customer } from './customer.model';
import type { Trip } from './trip.model';

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'cancelled';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  tripId: string;
  customerId: string;
  customer?: Customer;
  paymentStatus?: 'unpaid' | 'partially_paid' | 'full_paid';
  paidAmount?: number;
  remainingAmount?:number;
  trip?: Trip;
  amount: number;
  description?: string;
  status: InvoiceStatus;
  receipts?: InvoiceReceipt[];
  issuedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceReceipt {
  id: string;
  invoiceId: string;
  amount: number;
  paidAt: string;
  reference?: string;
  attachment?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
