export interface Vehicle {
  id: string;
  registrationNo: string;
  year?: number;
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
