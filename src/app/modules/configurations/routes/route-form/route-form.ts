import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SaveArea } from '../../../../shared/components/save-area/save-area';
import { RouteService } from '../../../../services/route.service';
import { CommonService } from '../../../../services/common.service';
import { Route } from '../../../../models/route.model';

@Component({
  selector: 'app-route-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SaveArea],
  templateUrl: './route-form.html'
})
export class RouteForm implements OnInit {
  private routeService = inject(RouteService);
  private commonService = inject(CommonService);
  selectedRoute = input<Route | undefined>(undefined);
  loading = this.routeService.loading;
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  actionMessage = signal<string | null>(null);

  routeName = '';
  startLocation = '';
  endLocation = '';
  mileage = '0.00';
  estimatedDuration = '';
  isActive = true;
  close = output();

  get isEditMode(): boolean {
    return !!this.selectedRoute()?.id;
  }

  ngOnInit(): void {
    const route = this.selectedRoute();
    if (!route) {
      return;
    }

    this.routeName = route.name;
    this.startLocation = route.startLocation || '';
    this.endLocation = route.endLocation || '';
    this.mileage = String(route.mileage ?? '0.00');
    this.estimatedDuration = route.estimatedDuration ? String(route.estimatedDuration) : '';
    this.isActive = route.isActive;
  }

  goBack() {
    this.close.emit();
  }

  private async waitForLoadingToFinish(timeoutMs = 6000): Promise<void> {
    const start = Date.now();
    while (this.loading() && Date.now() - start < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  async onSubmit() {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.actionMessage.set(this.isEditMode ? 'Updating route...' : 'Saving route...');

    try {
      const payload = {
        name: this.routeName,
        mileage: Number(this.mileage),
        startLocation: this.startLocation || undefined,
        endLocation: this.endLocation || undefined,
        estimatedDuration: this.estimatedDuration ? Number(this.estimatedDuration) : undefined,
        isActive: this.isActive,
      };

      if (this.isEditMode) {
        await this.routeService.update(this.selectedRoute()!.id, payload);
      } else {
        await this.routeService.create({
          id: this.commonService.makeid(),
          ...payload,
        });
      }
      this.successMessage.set(this.isEditMode ? 'Route updated successfully.' : 'Route saved successfully.');
      await this.waitForLoadingToFinish();
      this.close.emit();
    } catch (error) {
      this.errorMessage.set(String(error || 'Could not save route. Please try again.'));
    } finally {
      this.actionMessage.set(null);
    }
  }
}
