import { Injectable, signal, computed } from '@angular/core';
import { VehiclePermit } from '../models/vehicle.model';
import { HttpClientService } from './http-client.service';

@Injectable({
  providedIn: 'root',
})
export class VehiclePermitService {
  private permits = signal<VehiclePermit[]>([]);
  private isLoading = signal(false);
  private error = signal<string | null>(null);

  readonly allPermits = this.permits.asReadonly();
  readonly loading = this.isLoading.asReadonly();
  readonly errorMessage = this.error.asReadonly();

  readonly activePermits = computed(() => {
    const now = new Date();
    return this.permits().filter((p) => new Date(p.endDate) > now);
  });

  readonly expiredPermits = computed(() => {
    const now = new Date();
    return this.permits().filter((p) => new Date(p.endDate) <= now);
  });

  constructor(private http: HttpClientService) {}

  async getAll(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const permits = await this.http.get<VehiclePermit[]>('vehicle-permits');
      this.permits.set(permits);
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to fetch vehicle permits');
      console.error('Failed to fetch vehicle permits', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  getById(id: string): VehiclePermit | undefined {
    return this.permits().find((p) => p.id === id);
  }

  async create(
    permit: VehiclePermit & { vehicleId: string }
  ): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      await this.http.post('vehicle-permits', permit);
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to create vehicle permit');
      console.error('Failed to create vehicle permit', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async update(
    id: string,
    permit: Partial<VehiclePermit> & { vehicleId?: string }
  ): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.http.put('vehicle-permits', { id, ...permit });
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to update vehicle permit');
      console.error('Failed to update vehicle permit', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async delete(id: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.http.delete(`vehicle-permits/${id}`);
      this.permits.update((permits) => permits.filter((p) => p.id !== id));
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to delete vehicle permit');
      console.error('Failed to delete vehicle permit', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }
}
