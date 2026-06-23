import { Injectable, computed, signal } from '@angular/core';
import { CommonService } from './common.service';
import { HttpClientService } from './http-client.service';
import { VehicleMaintenance } from '../models/vehicle-maintenance.model';

export type VehicleMaintenancePayload = {
  id: string;
  vehicleId: string;
  date: string;
  description: string;
  totalMaintenanceCost: number;
};

@Injectable({
  providedIn: 'root',
})
export class VehicleMaintenanceService {
  private maintenances = signal<VehicleMaintenance[]>([]);
  private isLoading = signal(false);
  private error = signal<string | null>(null);

  readonly allVehicleMaintenances = this.maintenances.asReadonly();
  readonly loading = this.isLoading.asReadonly();
  readonly errorMessage = this.error.asReadonly();

  readonly totalMaintenanceCost = computed(() =>
    this.maintenances().reduce((sum, maintenance) => sum + Number(maintenance.totalMaintenanceCost || 0), 0)
  );

  constructor(private http: HttpClientService, private commonService: CommonService) {}

  async getAll(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const maintenances = await this.http.get<VehicleMaintenance[]>('vehicleMaintenance');
      this.maintenances.set(maintenances);
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to fetch vehicle maintenances');
      console.error('Failed to fetch vehicle maintenances', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  getById(id: string): VehicleMaintenance | undefined {
    return this.maintenances().find((maintenance) => maintenance.id === id);
  }

  async create(maintenance: VehicleMaintenancePayload): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.http.post('vehicleMaintenance', {
        id: maintenance.id,
        vehicleId: maintenance.vehicleId,
        date: maintenance.date,
        description: maintenance.description,
        totalMaintenanceCost: Number(maintenance.totalMaintenanceCost),
      });
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to create vehicle maintenance');
      console.error('Failed to create vehicle maintenance', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async update(id: string, maintenance: VehicleMaintenancePayload): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.http.put('vehicleMaintenance', {
        id,
        vehicleId: maintenance.vehicleId,
        date: maintenance.date,
        description: maintenance.description,
        totalMaintenanceCost: Number(maintenance.totalMaintenanceCost),
      });
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to update vehicle maintenance');
      console.error('Failed to update vehicle maintenance', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }
}