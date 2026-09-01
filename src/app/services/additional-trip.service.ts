import { Injectable, computed, signal } from '@angular/core';
import { AdditionalTrip } from '../models/additional-trip.model';
import { CommonService } from './common.service';
import { HttpClientService } from './http-client.service';

type AdditionalTripWritePayload = {
  tripReferenceNumber?: string;
  startDate: Date | string;
  endDate?: Date | string;
  revenue: number;
  referenceTripId: string;
  fromLocation: string;
  toLocation: string;
  description: string;
  docNumber: string;
  attachment: string;
  currency: string;
  customer: string;
  exchangeRate: number;
  equivalentAmount: number;
};

@Injectable({
  providedIn: 'root',
})
export class AdditionalTripService {
  private additionalTrips = signal<AdditionalTrip[]>([]);
  private isLoading = signal(false);
  private error = signal<string | null>(null);

  readonly allAdditionalTrips = this.additionalTrips.asReadonly();
  readonly loading = this.isLoading.asReadonly();
  readonly errorMessage = this.error.asReadonly();

  readonly totalRevenue = computed(() =>
    this.additionalTrips().reduce((sum, item) => sum + Number(item.revenue || 0), 0)
  );

  constructor(private http: HttpClientService, private commonService: CommonService) {}

  async getAll(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const rows = await this.http.get<AdditionalTrip[]>('additionalTrips');
      this.additionalTrips.set(rows);
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to fetch additional trips');
      console.error('Failed to fetch additional trips', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  getById(id: string): AdditionalTrip | undefined {
    return this.additionalTrips().find((item) => item.id === id);
  }


  async create(payload: AdditionalTripWritePayload): Promise<string> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const id = this.commonService.makeid();
      await this.http.post('additionalTrips', { id, ...payload });
      await this.getAll();
      return id;
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to create additional trip');
      console.error('Failed to create additional trip', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async update(id: string, payload: Partial<AdditionalTripWritePayload>): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.http.put('additionalTrips', { id, ...payload });
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to update additional trip');
      console.error('Failed to update additional trip', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async delete(id: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.http.delete(`additionalTrips/${id}`);
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to delete additional trip');
      console.error('Failed to delete additional trip', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }
}
