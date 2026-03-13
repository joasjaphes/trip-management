import { Injectable, signal, computed } from '@angular/core';
import { Driver } from '../models/driver.model';
import { HttpClientService } from './http-client.service';
import { CommonService } from './common.service';

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

  constructor(private http: HttpClientService, private commonService: CommonService) {}

  async getAll(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    
    try {
      const drivers = await this.http.get<Driver[]>('drivers');
      this.drivers.set(drivers);
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to fetch drivers');
      console.error('Failed to fetch drivers', err);
    } finally {
      // setTimeout(() => this.isLoading.set(false), 1000); // Simulate loading delay
      this.isLoading.set(false);
    }
  }

  getById(id: string): Driver | undefined {
    return this.drivers().find((d) => d.id === id);
  }

  async create(driver: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const payload = {
        id: this.commonService.makeid(),
        firstName: driver.firstName,
        lastName: driver.lastName,
        email: driver.email,
        phone: driver.phone,
        address: driver.address,
        dateOfBirth: driver.dateOfBirth,
        licenseNumber: driver.licenseDetails.licenseNumber,
        licenseIssueDate: driver.licenseDetails.issueDate,
        licenseExpiryDate: driver.licenseDetails.expiryDate,
        licenseClass: driver.licenseDetails.licenseClass,
        licenseFrontPagePhoto: driver.licenseDetails.frontPagePhoto,
        driverPhoto: driver.photo,
        isActive: driver.isActive ?? true,
      };

      await this.http.post('drivers', payload);
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to create driver');
      console.error('Failed to create driver', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async update(id: string, driver: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const payload = {
        id,
        firstName: driver.firstName,
        lastName: driver.lastName,
        email: driver.email,
        phone: driver.phone,
        address: driver.address,
        dateOfBirth: driver.dateOfBirth,
        licenseNumber: driver.licenseDetails.licenseNumber,
        licenseIssueDate: driver.licenseDetails.issueDate,
        licenseExpiryDate: driver.licenseDetails.expiryDate,
        licenseClass: driver.licenseDetails.licenseClass,
        licenseFrontPagePhoto: driver.licenseDetails.frontPagePhoto,
        driverPhoto: driver.photo,
        isActive: driver.isActive,
      };
      
      await this.http.put('drivers', payload);
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to update driver');
      console.error('Failed to update driver', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async delete(id: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.http.delete(`drivers/${id}`);
      this.drivers.update((drivers) => drivers.filter((d) => d.id !== id));
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to delete driver');
      console.error('Failed to delete driver', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async toggleActive(id: string): Promise<void> {
    const driver = this.getById(id);
    if (driver) {
      await this.update(id, { ...driver, isActive: !driver.isActive });
    }
  }
}
