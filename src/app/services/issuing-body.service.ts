import { Injectable, signal, computed } from '@angular/core';
import { CargoType } from '../models/cargo-type.model';
import { HttpClientService } from './http-client.service';
import { CommonService } from './common.service';
import { IssuingBody } from '../models/issuing-body.model';

@Injectable({
  providedIn: 'root',
})
export class IssuingBodyService {
  private issuingBodies = signal<IssuingBody[]>([]);
  private isLoading = signal(false);
  private error = signal<string | null>(null);

  readonly allIssuingBodies = this.issuingBodies.asReadonly();
  readonly loading = this.isLoading.asReadonly();
  readonly errorMessage = this.error.asReadonly();

  readonly activeIssuingBodiesCount = computed(
    () => this.issuingBodies().filter((c) => c.isActive).length
  );

  constructor(private http: HttpClientService, private commonService:CommonService) {}

  async getAll(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const issuingBodies = await this.http.get<IssuingBody[]>('issuing-bodies');
      this.issuingBodies.set(issuingBodies);
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to fetch issuing bodies');
      console.error('Failed to fetch issuing bodies', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  getById(id: string): IssuingBody | undefined {
    return this.issuingBodies().find((c) => c.id === id);
  }

  async create(issuingBody: Omit<IssuingBody, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.http.post('issuing-bodies', {
        id: this.commonService.makeid(),
        name: issuingBody.name,
        description: issuingBody.description,
        isActive: issuingBody.isActive ?? true,
      });
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to create issuing body');
      console.error('Failed to create issuing body', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async update(id: string, issuingBody: Partial<Omit<IssuingBody, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const existing = this.getById(id);
      await this.http.put('issuing-bodies', {
        id,
        name: issuingBody.name ?? existing?.name,
        isActive: issuingBody.isActive ?? existing?.isActive,
      });
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to update issuing body');
      console.error('Failed to update issuing body', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async delete(id: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.http.delete(`issuing-bodies/${id}`);
      this.issuingBodies.update((bodies) => bodies.filter((b) => b.id !== id));
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to delete issuing body');
      console.error('Failed to delete issuing body', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }
}
