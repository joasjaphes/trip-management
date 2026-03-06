import { Injectable, signal, computed } from '@angular/core';
import { Route } from '../models/route.model';

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

  constructor() {}

  getAll(): Route[] {
    return this.routes();
  }

  getById(id: string): Route | undefined {
    return this.routes().find((r) => r.id === id);
  }

  create(route: Omit<Route, 'id' | 'createdAt' | 'updatedAt'>): void {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      setTimeout(() => {
        const newRoute: Route = {
          ...route,
          id: `rte-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        this.routes.update((routes) => [...routes, newRoute]);
        this.isLoading.set(false);
      }, 300);
    } catch (err) {
      this.error.set('Failed to create route');
      this.isLoading.set(false);
    }
  }

  update(id: string, route: Omit<Route, 'id' | 'createdAt' | 'updatedAt'>): void {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      setTimeout(() => {
        this.routes.update((routes) =>
          routes.map((r) =>
            r.id === id
              ? {
                  ...route,
                  id,
                  createdAt: r.createdAt,
                  updatedAt: new Date(),
                }
              : r
          )
        );
        this.isLoading.set(false);
      }, 300);
    } catch (err) {
      this.error.set('Failed to update route');
      this.isLoading.set(false);
    }
  }

  delete(id: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      setTimeout(() => {
        this.routes.update((routes) => routes.filter((r) => r.id !== id));
        this.isLoading.set(false);
      }, 300);
    } catch (err) {
      this.error.set('Failed to delete route');
      this.isLoading.set(false);
    }
  }

  toggleActive(id: string): void {
    const route = this.getById(id);
    if (route) {
      this.update(id, { ...route, isActive: !route.isActive });
    }
  }
}
