import { Injectable, signal, computed } from '@angular/core';
import { Vehicle } from '../models/vehicle.model';

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

  constructor() { }

  getAll(): Vehicle[] {
    return this.vehicles();
  }

  getById(id: string): Vehicle | undefined {
    return this.vehicles().find((v) => v.id === id);
  }

  create(vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): void {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      setTimeout(() => {
        const newVehicle: Vehicle = {
          ...vehicle,
          id: `veh-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        this.vehicles.update((vehicles) => [...vehicles, newVehicle]);
        this.isLoading.set(false);
      }, 300);
    } catch (err) {
      this.error.set('Failed to create vehicle');
      this.isLoading.set(false);
    }
  }

  update(id: string, vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): void {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      setTimeout(() => {
        this.vehicles.update((vehicles) =>
          vehicles.map((v) =>
            v.id === id
              ? {
                ...vehicle,
                id,
                createdAt: v.createdAt,
                updatedAt: new Date(),
              }
              : v
          )
        );
        this.isLoading.set(false);
      }, 300);
    } catch (err) {
      this.error.set('Failed to update vehicle');
      this.isLoading.set(false);
    }
  }

  delete(id: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      setTimeout(() => {
        this.vehicles.update((vehicles) => vehicles.filter((v) => v.id !== id));
        this.isLoading.set(false);
      }, 300);
    } catch (err) {
      this.error.set('Failed to delete vehicle');
      this.isLoading.set(false);
    }
  }

  toggleActive(id: string): void {
    const vehicle = this.getById(id);
    if (vehicle) {
      this.update(id, { ...vehicle, isActive: !vehicle.isActive });
    }
  }
}
