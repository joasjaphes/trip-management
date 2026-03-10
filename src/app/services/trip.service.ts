import { Injectable, signal, computed } from '@angular/core';
import { Trip } from '../models/trip.model';
import { HttpClientService } from './http-client.service';
import { CommonService } from './common.service';

type TripWritePayload = {
  tripDate: Date;
  endDate?: Date;
  vehicleId: string;
  driverId: string;
  routeId: string;
  cargoTypeId?: string;
  revenue: number;
  income?: number;
  status: Trip['status'];
  notes?: string;
};

@Injectable({
  providedIn: 'root',
})
export class TripService {
  // State
  private trips = signal<Trip[]>([]);
  private isLoading = signal(false);
  private error = signal<string | null>(null);

  // Public readonly signals
  readonly allTrips = this.trips.asReadonly();
  readonly loading = this.isLoading.asReadonly();
  readonly errorMessage = this.error.asReadonly();

  // Computed values
  readonly pendingTrips = computed(() =>
    this.trips().filter((t) => t.status === 'pending')
  );

  readonly inProgressTrips = computed(() =>
    this.trips().filter((t) => t.status === 'inprogress')
  );

  readonly completedTrips = computed(() =>
    this.trips().filter((t) => t.status === 'completed')
  );

  readonly cancelledTrips = computed(() =>
    this.trips().filter((t) => t.status === 'cancelled')
  );

  constructor(private http: HttpClientService, private commonService: CommonService) {}

  async getAll(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const trips = await this.http.get<Trip[]>('trips');
      this.trips.set(trips);
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to fetch trips');
      console.error('Failed to fetch trips', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  getById(id: string): Trip | undefined {
    return this.trips().find((t) => t.id === id);
  }

  async create(trip: TripWritePayload): Promise<string> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const id = this.commonService.makeid();
      await this.http.post('trips', { id, ...trip });
      await this.getAll();
      return id;
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to create trip');
      console.error('Failed to create trip', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async update(id: string, trip: Partial<TripWritePayload>): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.http.put('trips', { id, ...trip });
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to update trip');
      console.error('Failed to update trip', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async delete(id: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.http.delete(`trips/${id}`);
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to delete trip');
      console.error('Failed to delete trip', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async updateStatus(id: string, status: Trip['status']): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.http.put('trips', { id, status });
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to update trip status');
      console.error('Failed to update trip status', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  getTripsByVehicle(vehicleId: string): Trip[] {
    return this.trips().filter((t) => t.vehicleId === vehicleId);
  }

  getTripsByDriver(driverId: string): Trip[] {
    return this.trips().filter((t) => t.driverId === driverId);
  }

  getTripsByRoute(routeId: string): Trip[] {
    return this.trips().filter((t) => t.routeId === routeId);
  }

  getTripsByStatus(status: Trip['status']): Trip[] {
    return this.trips().filter((t) => t.status === status);
  }
}
