export interface Vehicle {
  id: string;
  registrationNo: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  tankCapacity: number;
  mileagePerFullTank: number;
  currentMileage?: number;
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
