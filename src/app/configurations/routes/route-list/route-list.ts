import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Layout, SplitSize } from '../../../shared/components/layout/layout';
import { DataTable, TableConfig } from '../../../shared/components/data-table/data-table';
import { Route } from '../../../models/route.model';
import { CommonModule } from '@angular/common';
import { AddRoute } from '../route-form/add-route';
import { RouteService } from '../../../services/route.service';

@Component({
  selector: 'app-route-list',
  imports: [Layout, DataTable, AddRoute, CommonModule],
  templateUrl: './route-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RouteList {
  private routeService = inject(RouteService);

  title = signal('Routes');
  viewDetails = signal(false);
  viewType = signal<'add' | 'edit'>('add');
  formSize = signal<SplitSize>('half');
  selectedRouteId = signal<string | null>(null);

  // Get data from service
  routes = this.routeService.allRoutes;
  isLoading = this.routeService.loading;
  activeRoutesCount = this.routeService.activeRoutesCount;

  // Table configuration
  tableConfig = signal<TableConfig>({
    columns: [
      { key: 'name', label: 'Route Name', sortable: true },
      { key: 'startLocation', label: 'Start Location', sortable: true },
      { key: 'endLocation', label: 'End Location', sortable: true },
      { key: 'mileage', label: 'Mileage (km)', sortable: true },
      { key: 'estimatedDuration', label: 'Duration (min)', sortable: true },
      { key: 'isActive', label: 'Status', sortable: true },
      { key: 'createdAt', label: 'Created', sortable: true },
    ],
    pageSize: 10,
    striped: true,
    hover: true,
    bordered: false,
  });

  onAdd(): void {
    this.viewType.set('add');
    this.selectedRouteId.set(null);
    this.viewDetails.set(true);
  }

  onRowClick(route: Route): void {
    this.selectedRouteId.set(route.id);
    this.viewType.set('edit');
    this.viewDetails.set(true);
  }

  onRowSelect(selectedRoutes: Route[]): void {
    console.log('Selected routes:', selectedRoutes);
  }

  onSortChange(event: { column: string; direction: 'asc' | 'desc' }): void {
    console.log('Sort changed:', event);
  }

  onFormSaved(): void {
    this.viewDetails.set(false);
    this.selectedRouteId.set(null);
  }
}
