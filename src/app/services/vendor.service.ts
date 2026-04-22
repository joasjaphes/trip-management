import { computed, Injectable, signal } from '@angular/core';
import { CommonService } from './common.service';
import { HttpClientService } from './http-client.service';
import { Vendor } from '../models/vendor.model';

@Injectable({
  providedIn: 'root',
})
export class VendorService {
  private vendors = signal<Vendor[]>([]);
  private isLoading = signal(false);
  private error = signal<string | null>(null);

  readonly allVendors = this.vendors.asReadonly();
  readonly loading = this.isLoading.asReadonly();
  readonly errorMessage = this.error.asReadonly();
  readonly vendorCount = computed(() => this.vendors().length);

  constructor(
    private http: HttpClientService,
    private commonService: CommonService
  ) {}

  async getAll(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const vendors = await this.http.get<Vendor[]>('vendors');
      this.vendors.set(vendors);
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to fetch vendors');
      console.error('Failed to fetch vendors', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  getById(id: string): Vendor | undefined {
    return this.vendors().find((vendor) => vendor.id === id);
  }

  findByName(name: string): Vendor | undefined {
    const normalized = name.trim().toLowerCase();
    return this.vendors().find(
      (vendor) => vendor.vendorName.trim().toLowerCase() === normalized
    );
  }

  async create(payload: {
    vendorName: string;
    vendorTIN: string;
    vendorContact?: string;
    vendorAddress?: string;
  }): Promise<string> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const id = this.commonService.makeid();
      await this.http.post('vendors', {
        id,
        vendorName: payload.vendorName,
        vendorTIN: payload.vendorTIN,
        vendorContact: payload.vendorContact || undefined,
        vendorAddress: payload.vendorAddress || undefined,
      });
      await this.getAll();
      return id;
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to create vendor');
      console.error('Failed to create vendor', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async update(
    id: string,
    payload: {
      vendorName?: string;
      vendorTIN?: string;
      vendorContact?: string;
      vendorAddress?: string;
    }
  ): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const existing = this.getById(id);
      await this.http.put('vendors', {
        id,
        vendorName: payload.vendorName ?? existing?.vendorName,
        vendorTIN: payload.vendorTIN ?? existing?.vendorTIN,
        vendorContact: payload.vendorContact ?? existing?.vendorContact ?? undefined,
        vendorAddress: payload.vendorAddress ?? existing?.vendorAddress ?? undefined,
      });
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to update vendor');
      console.error('Failed to update vendor', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }
}