export interface Vehicle {
  id: string;
  registrationNo: string;
  model?:string;
  registrationYear?: number;
  tankCapacity?: number;
  mileagePerFullTank?: number;
  currentMileage?: number;
  type?: VehicleType;
  permits: VehiclePermit[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehiclePermit {
  id: string;
  description: string;
  startDate: Date;
  endDate: Date;
  attachment?: string;
}

export enum VehicleType {
  TRUCK = 'TRUCK',
  TRAILER = 'TRAILER',
}
