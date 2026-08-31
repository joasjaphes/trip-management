export interface AdditionalTrip {
  id: string;
  tripReferenceNumber?: string;
  startDate: Date | string;
  endDate?: Date | string;
  revenue: number;
  currency?: string;
  exchangeRate?: number;
  equivalentAmount?: number;
  referenceTripId: string;
  customer?:string;
  fromLocation: string;
  toLocation: string;
  description?: string;
  docNumber?: string;
  attachment:string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  active?: boolean;
  deleted?: boolean;
}
