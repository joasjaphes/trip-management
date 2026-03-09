import { Component, inject, signal, ChangeDetectionStrategy, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { VehicleService } from '../../../../services/vehicle.service';
import { Vehicle, VehiclePermit } from '../../../../models/vehicle.model';

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
  year = signal('');
  tankCapacity = signal('');
  mileagePerFullTank = signal('');
  isActive = signal(true);
  
  // Permits state
  permits = signal<VehiclePermit[]>([]);
  newPermitDescription = signal('');
  newPermitStartDate = signal('');
  newPermitEndDate = signal('');
  newPermitAttachment = signal<string | undefined>(undefined);
  newPermitFileName = signal('');

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
      year: this.year() ? parseInt(this.year()) : undefined,
      tankCapacity: parseFloat(this.tankCapacity()),
      mileagePerFullTank: parseFloat(this.mileagePerFullTank()),
      permits: this.permits(),
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
    this.year.set('');
    this.tankCapacity.set('');
    this.mileagePerFullTank.set('');
    this.isActive.set(true);
    this.permits.set([]);
    this.resetNewPermitFields();
  }

  addPermit(): void {
    if (!this.newPermitDescription().trim() || !this.newPermitStartDate() || !this.newPermitEndDate()) {
      return;
    }

    const newPermit: VehiclePermit = {
      id: crypto.randomUUID(),
      description: this.newPermitDescription().trim(),
      startDate: new Date(this.newPermitStartDate()),
      endDate: new Date(this.newPermitEndDate()),
      attachment: this.newPermitAttachment(),
    };

    this.permits.update(permits => [...permits, newPermit]);
    this.resetNewPermitFields();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.newPermitFileName.set(file.name);
      
      // Convert file to base64 data URL
      const reader = new FileReader();
      reader.onload = () => {
        this.newPermitAttachment.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removePermit(id: string): void {
    this.permits.update(permits => permits.filter(p => p.id !== id));
  }

  private resetNewPermitFields(): void {
    this.newPermitDescription.set('');
    this.newPermitStartDate.set('');
    this.newPermitEndDate.set('');
    this.newPermitAttachment.set(undefined);
    this.newPermitFileName.set('');
  }
}
