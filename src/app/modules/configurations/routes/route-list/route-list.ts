import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTable, TableConfig } from '../../../../shared/components/data-table/data-table';
import { Layout } from '../../../../shared/components/layout/layout';
import { RouteForm } from '../route-form/route-form';
import { RouteService } from '../../../../services/route.service';
import { Route } from '../../../../models/route.model';

@Component({
  selector: 'app-route-list',
  standalone: true,
  imports: [CommonModule, DataTable, Layout, RouteForm],
  templateUrl: './route-list.html',
})
export class RouteList implements OnInit {
  private routeService = inject(RouteService);

  title = signal('Routes management');
  description = signal('Configure and track operational transport lanes across the region');
  addText = signal('Add new route');
  viewType = signal('');
  viewDetails = signal(false);
  formTitle = signal('');
  formDescription = signal('');
  loading = this.routeService.loading;
  selectedRoute = signal<Route | undefined>(undefined);

  routes = computed(() =>
    this.routeService.allRoutes().map((route) => ({
      ...route,
      start: route.startLocation || '-',
      end: route.endLocation || '-',
      mileage: `${route.mileage} km`,
      duration: route.estimatedDuration ? `${route.estimatedDuration} day(s)` : '-',
      status: route.isActive ? 'Active' : 'Inactive',
    }))
  );

  tableConfigurations: TableConfig = {
    columns: [
      {
        key: 'name',
        label: 'Route name'
      },
      {
        key: 'start',
        label: 'Start location'
      },
      {
        key: 'end',
        label: 'End location'
      },
      {
        key: 'mileage',
        label: 'Mileage'
      },
      {
        key: 'duration',
        label: 'Estimated duration'
      },
      {
        key: 'status',
        label: 'Status',
        type: 'status'
      }
    ],
    actions: { edit: true }
  };

  async ngOnInit(): Promise<void> {
    await this.routeService.getAll();
  }

  onAdd() {
    this.selectedRoute.set(undefined);
    this.viewType.set('add');
    this.formTitle.set('Add new route');
    this.formDescription.set('Configure a new transport route and timing details.');
    this.viewDetails.set(true);
  }

  onEdit(row: { id: string }) {
    const route = this.routeService.getById(row.id);
    if (!route) {
      return;
    }

    this.selectedRoute.set(route);
    this.viewType.set('edit');
    this.formTitle.set('Edit route');
    this.formDescription.set(`Updating ${route.name}`);
    this.viewDetails.set(true);
  }

  async onCloseForm() {
    this.viewDetails.set(false);
    this.viewType.set('');
    this.formTitle.set('');
    this.formDescription.set('');
    this.selectedRoute.set(undefined);
    await this.routeService.getAll();
  }
}
