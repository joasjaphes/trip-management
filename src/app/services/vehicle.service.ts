import { Injectable, signal, computed } from '@angular/core';
import { Vehicle } from '../models/vehicle.model';

@Injectable({
  providedIn: 'root',
})
export class VehicleService {
  // State
  private vehicles = signal<Vehicle[]>([
    {
      id: 'veh-001',
      registrationNo: 'ABC-1234',
      make: 'Toyota',
      model: 'Hiace',
      year: 2022,
      color: 'White',
      tankCapacity: 80,
      mileagePerFullTank: 500,
      currentMileage: 45000,
      permits: [
        {
          id: 'permit-001',
          description: 'Public Transport License',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2025-12-31'),
        },
      ],
      isActive: true,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-02-20'),
    },
    {
      id: 'veh-002',
      registrationNo: 'XYZ-5678',
      make: 'Mercedes',
      model: 'Sprinter',
      year: 2023,
      color: 'Silver',
      tankCapacity: 100,
      mileagePerFullTank: 600,
      currentMileage: 25000,
      permits: [
        {
          id: 'permit-002',
          description: 'Public Transport License',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2025-12-31'),
        },
      ],
      isActive: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-02-18'),
    },
  ]);

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

  constructor() {}

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
