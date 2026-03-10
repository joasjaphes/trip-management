import { Injectable, signal, computed } from '@angular/core';
import { Vehicle } from '../models/vehicle.model';
import { HttpClientService } from './http-client.service';
import { CommonService } from './common.service';

@Injectable({
  providedIn: 'root',
})
export class VehicleService {
  // State
  private vehicles = signal<Vehicle[]>([]);

  private isLoading = signal(false);
  private error = signal<string | null>(null);

  // Public readonly signals
  readonly allVehicles = this.vehicles.asReadonly();
  readonly loading = this.isLoading.asReadonly();
  readonly errorMessage = this.error.asReadonly();

  // Computed values
  readonly activeVehiclesCount = computed(
    () => this.vehicles().filter((v) => v.isActive).length
  );

  constructor(private http: HttpClientService, private commonService: CommonService) { }

  async getAll(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    
    try {
      const vehicles = await this.http.get<Vehicle[]>('vehicles');
      this.vehicles.set(vehicles);
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to fetch vehicles');
      console.error('Failed to fetch vehicles', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  getById(id: string): Vehicle | undefined {
    return this.vehicles().find((v) => v.id === id);
  }

  async create(vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const id = this.commonService.makeid();
      const payload = {
        id,
        registrationNo: vehicle.registrationNo,
        registrationYear: vehicle.registrationYear,
        tankCapacity: vehicle.tankCapacity,
        mileagePerFullTank: vehicle.mileagePerFullTank,
        isActive: vehicle.isActive ?? true
      };
      
      await this.http.post('vehicles', payload);
      await this.getAll();
      return id;
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to create vehicle');
      console.error('Failed to create vehicle', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async update(id: string, vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const payload = {
        id,
        registrationNo: vehicle.registrationNo,
        registrationYear: vehicle.registrationYear,
        tankCapacity: vehicle.tankCapacity,
        mileagePerFullTank: vehicle.mileagePerFullTank,
        isActive: vehicle.isActive
      };
      
      await this.http.put('vehicles', payload);
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to update vehicle');
      console.error('Failed to update vehicle', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async delete(id: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.http.delete(`vehicles/${id}`);
      this.vehicles.update((vehicles) => vehicles.filter((v) => v.id !== id));
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to delete vehicle');
      console.error('Failed to delete vehicle', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async toggleActive(id: string): Promise<void> {
    const vehicle = this.getById(id);
    if (vehicle) {
      await this.update(id, { ...vehicle, isActive: !vehicle.isActive });
    }
  }
}
