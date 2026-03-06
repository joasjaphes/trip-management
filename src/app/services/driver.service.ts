import { Injectable, signal, computed } from '@angular/core';
import { Driver } from '../models/driver.model';

@Injectable({
  providedIn: 'root',
})
export class DriverService {
  // State
  private drivers = signal<Driver[]>([]);

  private isLoading = signal(false);
  private error = signal<string | null>(null);

  // Public readonly signals
  readonly allDrivers = this.drivers.asReadonly();
  readonly loading = this.isLoading.asReadonly();
  readonly errorMessage = this.error.asReadonly();

  // Computed values
  readonly activeDriversCount = computed(
    () => this.drivers().filter((d) => d.isActive).length
  );

  constructor() {}

  getAll(): Driver[] {
    return this.drivers();
  }

  getById(id: string): Driver | undefined {
    return this.drivers().find((d) => d.id === id);
  }

  create(driver: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>): void {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      setTimeout(() => {
        const newDriver: Driver = {
          ...driver,
          id: `drv-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        this.drivers.update((drivers) => [...drivers, newDriver]);
        this.isLoading.set(false);
      }, 300);
    } catch (err) {
      this.error.set('Failed to create driver');
      this.isLoading.set(false);
    }
  }

  update(id: string, driver: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>): void {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      setTimeout(() => {
        this.drivers.update((drivers) =>
          drivers.map((d) =>
            d.id === id
              ? {
                  ...driver,
                  id,
                  createdAt: d.createdAt,
                  updatedAt: new Date(),
                }
              : d
          )
        );
        this.isLoading.set(false);
      }, 300);
    } catch (err) {
      this.error.set('Failed to update driver');
      this.isLoading.set(false);
    }
  }

  delete(id: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      setTimeout(() => {
        this.drivers.update((drivers) => drivers.filter((d) => d.id !== id));
        this.isLoading.set(false);
      }, 300);
    } catch (err) {
      this.error.set('Failed to delete driver');
      this.isLoading.set(false);
    }
  }

  toggleActive(id: string): void {
    const driver = this.getById(id);
    if (driver) {
      this.update(id, { ...driver, isActive: !driver.isActive });
    }
  }
}
