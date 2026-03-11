import { computed, Injectable, signal } from '@angular/core';
import { Customer } from '../models/customer.model';
import { HttpClientService } from './http-client.service';
import { CommonService } from './common.service';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private customers = signal<Customer[]>([]);
  private isLoading = signal(false);
  private error = signal<string | null>(null);

  readonly allCustomers = this.customers.asReadonly();
  readonly loading = this.isLoading.asReadonly();
  readonly errorMessage = this.error.asReadonly();

  readonly activeCustomersCount = computed(() => this.customers().length);

  constructor(
    private http: HttpClientService,
    private commonService: CommonService
  ) {}

  async getAll(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const customers = await this.http.get<Customer[]>('customers');
      this.customers.set(customers);
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to fetch customers');
      console.error('Failed to fetch customers', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  getById(id: string): Customer | undefined {
    return this.customers().find((customer) => customer.id === id);
  }

  findByName(name: string): Customer | undefined {
    const normalized = name.trim().toLowerCase();
    return this.customers().find(
      (customer) => customer.name.trim().toLowerCase() === normalized
    );
  }

  async create(payload: {
    name: string;
    tin: string;
    phone?: string;
  }): Promise<string> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const id = this.commonService.makeid();
      await this.http.post('customers', {
        id,
        name: payload.name,
        tin: payload.tin,
        phone: payload.phone || undefined,
      });
      await this.getAll();
      return id;
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to create customer');
      console.error('Failed to create customer', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async update(
    id: string,
    payload: {
      name?: string;
      tin?: string;
      phone?: string;
    }
  ): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const existing = this.getById(id);
      await this.http.put('customers', {
        id,
        name: payload.name ?? existing?.name,
        tin: payload.tin ?? existing?.tin,
        phone: payload.phone ?? existing?.phone ?? undefined,
      });
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to update customer');
      console.error('Failed to update customer', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }
}
