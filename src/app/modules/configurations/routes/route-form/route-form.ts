import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SaveArea } from '../../../../shared/components/save-area/save-area';
import { RouteService } from '../../../../services/route.service';
import { CommonService } from '../../../../services/common.service';

@Component({
  selector: 'app-route-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SaveArea],
  templateUrl: './route-form.html'
})
export class RouteForm {
  private routeService = inject(RouteService);
  private commonService = inject(CommonService);
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
    this.actionMessage.set('Saving route...');

    try {
      await this.routeService.create({
        id: this.commonService.makeid(),
        name: this.routeName,
        mileage: Number(this.mileage),
        startLocation: this.startLocation || undefined,
        endLocation: this.endLocation || undefined,
        estimatedDuration: this.estimatedDuration ? Number(this.estimatedDuration) : undefined,
        isActive: this.isActive,
      });
      this.successMessage.set('Route saved successfully.');
      await this.waitForLoadingToFinish();
      this.close.emit();
    } catch (error) {
      this.errorMessage.set(String(error || 'Could not save route. Please try again.'));
    } finally {
      this.actionMessage.set(null);
    }
  }
}
