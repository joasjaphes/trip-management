import { Injectable, signal, computed } from '@angular/core';
import { CargoType } from '../models/cargo-type.model';
import { HttpClientService } from './http-client.service';
import { CommonService } from './common.service';

@Injectable({
  providedIn: 'root',
})
export class CargoTypeService {
  private cargoTypes = signal<CargoType[]>([]);
  private isLoading = signal(false);
  private error = signal<string | null>(null);

  readonly allCargoTypes = this.cargoTypes.asReadonly();
  readonly loading = this.isLoading.asReadonly();
  readonly errorMessage = this.error.asReadonly();

  readonly activeCargoTypesCount = computed(
    () => this.cargoTypes().filter((c) => c.isActive).length
  );

  constructor(private http: HttpClientService, private commonService:CommonService) {}

  async getAll(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const cargoTypes = await this.http.get<CargoType[]>('cargo-types');
      this.cargoTypes.set(cargoTypes);
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to fetch cargo types');
      console.error('Failed to fetch cargo types', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  getById(id: string): CargoType | undefined {
    return this.cargoTypes().find((c) => c.id === id);
  }

  async create(cargoType: Omit<CargoType, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.http.post('cargo-types', {
        id: this.commonService.makeid(),
        name: cargoType.name,
        isActive: cargoType.isActive ?? true,
      });
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to create cargo type');
      console.error('Failed to create cargo type', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async update(id: string, cargoType: Partial<Omit<CargoType, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const existing = this.getById(id);
      await this.http.put('cargo-types', {
        id,
        name: cargoType.name ?? existing?.name,
        isActive: cargoType.isActive ?? existing?.isActive,
      });
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to update cargo type');
      console.error('Failed to update cargo type', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async delete(id: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.http.delete(`cargo-types/${id}`);
      this.cargoTypes.update((types) => types.filter((t) => t.id !== id));
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to delete cargo type');
      console.error('Failed to delete cargo type', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }
}
