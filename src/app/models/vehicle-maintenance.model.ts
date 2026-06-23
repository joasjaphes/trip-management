import { Vehicle } from './vehicle.model';

export interface VehicleMaintenance {
  id: string;
  vehicleId: string;
  vehicle?: Vehicle;
  date: string;
  description: string;
  vehicleType?: string;
  vehicleRegistrationNo?: string;
  totalMaintenanceCost: number;
  createdAt?: string;
  updatedAt?: string;
}