import type { Customer } from './customer.model';
import type { Trip } from './trip.model';

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'cancelled';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  tripId: string;
  customerId: string;
  customer?: Customer;
  trip?: Trip;
  amount: number;
  description?: string;
  status: InvoiceStatus;
  issuedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
