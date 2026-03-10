import { Injectable, signal, computed } from '@angular/core';
import { Route } from '../models/route.model';
import { HttpClientService } from './http-client.service';

@Injectable({
  providedIn: 'root',
})
export class RouteService {
  // State
  private routes = signal<Route[]>([]);

  private isLoading = signal(false);
  private error = signal<string | null>(null);

  // Public readonly signals
  readonly allRoutes = this.routes.asReadonly();
  readonly loading = this.isLoading.asReadonly();
  readonly errorMessage = this.error.asReadonly();

  // Computed values
  readonly activeRoutesCount = computed(
    () => this.routes().filter((r) => r.isActive).length
  );

  constructor(private http: HttpClientService) {}

  async getAll(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    
    try {
      const routes = await this.http.get<Route[]>('routes');
      this.routes.set(routes);
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to fetch routes');
      console.error('Failed to fetch routes', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  getById(id: string): Route | undefined {
    return this.routes().find((r) => r.id === id);
  }

  async create(route: Omit<Route,  'createdAt' | 'updatedAt'>): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.http.post('routes', route);
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to create route');
      console.error('Failed to create route', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async update(id: string, route: Omit<Route, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const payload = {
        id,
        ...route
      };
      
      await this.http.put('routes', payload);
      await this.getAll();
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to update route');
      console.error('Failed to update route', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async delete(id: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.http.delete(`routes/${id}`);
      this.routes.update((routes) => routes.filter((r) => r.id !== id));
    } catch (err) {
      this.error.set(err?.toString() || 'Failed to delete route');
      console.error('Failed to delete route', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async toggleActive(id: string): Promise<void> {
    const route = this.getById(id);
    if (route) {
      await this.update(id, { ...route, isActive: !route.isActive });
    }
  }
}
