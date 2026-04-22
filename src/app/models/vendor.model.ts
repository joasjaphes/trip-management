export interface Vendor {
  id: string;
  vendorName: string;
  vendorTIN: string;
  vendorContact?: string;
  vendorAddress?: string;
  createdAt?: Date;
  updatedAt?: Date;
}