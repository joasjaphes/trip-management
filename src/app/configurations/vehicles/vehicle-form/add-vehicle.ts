import { Component, inject, signal, ChangeDetectionStrategy, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { VehicleService } from '../../../services/vehicle.service';
import { Vehicle } from '../../../models/vehicle.model';

@Component({
  selector: 'app-add-vehicle',
  imports: [FormsModule, CommonModule],
  templateUrl: './add-vehicle.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddVehicle {
  private vehicleService = inject(VehicleService);

  // Form state
  registrationNo = signal('');
  make = signal('');
  model = signal('');
  year = signal('');
  color = signal('');
  tankCapacity = signal('');
  mileagePerFullTank = signal('');
  isActive = signal(true);

  // Output event
  onSaved = output<void>();

  // Expose service loading state
  isLoading = this.vehicleService.loading;
  error = this.vehicleService.errorMessage;

  onSubmit(): void {
    if (!this.registrationNo().trim() || !this.tankCapacity() || !this.mileagePerFullTank()) {
      return;
    }

    const newVehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'> = {
      registrationNo: this.registrationNo().trim(),
      make: this.make().trim() || undefined,
      model: this.model().trim() || undefined,
      year: this.year() ? parseInt(this.year()) : undefined,
      color: this.color().trim() || undefined,
      tankCapacity: parseFloat(this.tankCapacity()),
      mileagePerFullTank: parseFloat(this.mileagePerFullTank()),
      permits: [],
      isActive: this.isActive(),
    };

    this.vehicleService.create(newVehicle);

    setTimeout(() => {
      if (!this.error()) {
        this.reset();
        this.onSaved.emit();
      }
    }, 400);
  }

  reset(): void {
    this.registrationNo.set('');
    this.make.set('');
    this.model.set('');
    this.year.set('');
    this.color.set('');
    this.tankCapacity.set('');
    this.mileagePerFullTank.set('');
    this.isActive.set(true);
  }
}
