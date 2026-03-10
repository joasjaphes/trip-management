import { Injectable, signal } from '@angular/core';
import { Permit } from '../models/permits.model';
import { HttpClientService } from './http-client.service';
import { CommonService } from './common.service';

type PermitRegistrationPayload = {
  name: string;
  authorizingBody?: string;
  isActive: boolean;
};

@Injectable({
  providedIn: 'root',
})
export class PermitRegistrationService {
  private permits = signal<Permit[]>([]);
  private isLoading = signal(false);
  private error = signal<string | null>(null);

  readonly allPermits = this.permits.asReadonly();
  readonly loading = this.isLoading.asReadonly();
  readonly errorMessage = this.error.asReadonly();

  constructor(private http: HttpClientService, private commonService: CommonService) {}

  async getAll(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const permits = await this.http.get<Permit[]>('permit-registrations');
      this.permits.set(permits);
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to fetch permit registrations');
      console.error('Failed to fetch permit registrations', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  getById(id: string): Permit | undefined {
    return this.permits().find((permit) => permit.id === id);
  }

  async create(permit: PermitRegistrationPayload): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.http.post('permit-registrations', {
        id: this.commonService.makeid(),
        name: permit.name,
        authorizingBody: permit.authorizingBody,
        isActive: permit.isActive,
      });
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to create permit registration');
      console.error('Failed to create permit registration', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async update(id: string, permit: Partial<PermitRegistrationPayload>): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const existing = this.getById(id);
      await this.http.put('permit-registrations', {
        id,
        name: permit.name ?? existing?.name,
        authorizingBody: permit.authorizingBody ?? existing?.authorizingBody,
        isActive: permit.isActive ?? existing?.isActive ?? true,
      });
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to update permit registration');
      console.error('Failed to update permit registration', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async delete(id: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.http.delete(`permit-registrations/${id}`);
      this.permits.update((permits) => permits.filter((permit) => permit.id !== id));
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to delete permit registration');
      console.error('Failed to delete permit registration', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }
}
