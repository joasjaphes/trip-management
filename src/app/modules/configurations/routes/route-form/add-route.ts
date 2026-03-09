import { Component, inject, signal, ChangeDetectionStrategy, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouteService } from '../../../../services/route.service';
import { Route } from '../../../../models/route.model';

@Component({
  selector: 'app-add-route',
  imports: [FormsModule, CommonModule],
  templateUrl: './add-route.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddRoute {
  private routeService = inject(RouteService);

  // Form state
  name = signal('');
  mileage = signal('');
  startLocation = signal('');
  endLocation = signal('');
  estimatedDuration = signal('');
  isActive = signal(true);

  onCancel = output<void>();

  // Output event
  onSaved = output<void>();

  // Expose service loading state
  isLoading = this.routeService.loading;
  error = this.routeService.errorMessage;

  onSubmit(): void {
    if (!this.name().trim() || !this.mileage()) {
      return;
    }

    const newRoute: Omit<Route, 'id' | 'createdAt' | 'updatedAt'> = {
      name: this.name().trim(),
      mileage: parseFloat(this.mileage()),
      startLocation: this.startLocation().trim() || undefined,
      endLocation: this.endLocation().trim() || undefined,
      estimatedDuration: this.estimatedDuration() ? parseInt(this.estimatedDuration()) : undefined,
      isActive: this.isActive(),
    };

    this.routeService.create(newRoute);

    setTimeout(() => {
      if (!this.error()) {
        this.reset();
        this.onSaved.emit();
      }
    }, 400);
  }

  reset(): void {
    this.onCancel.emit();
  }
}
