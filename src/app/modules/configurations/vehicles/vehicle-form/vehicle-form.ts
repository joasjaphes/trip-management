import { Component, computed, inject, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SaveArea } from '../../../../shared/components/save-area/save-area';
import { VehicleService } from '../../../../services/vehicle.service';
import { PermitRegistrationService } from '../../../../services/permit-registration.service';
import { VehiclePermitService } from '../../../../services/vehicle-permit.service';

interface Permit {
  id: string;
  description: string;
  startDate: string;
  endDate: string;
  fileName: string;
}

@Component({
  selector: 'app-vehicle-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SaveArea],
  templateUrl: './vehicle-form.html'
})
export class VehicleForm implements OnInit {
  private vehicleService = inject(VehicleService);
  private permitRegistrationService = inject(PermitRegistrationService);
  private vehiclePermitService = inject(VehiclePermitService);
  private isSubmitting = signal(false);
  loading = computed(() =>
    this.isSubmitting() || this.vehicleService.loading() || this.vehiclePermitService.loading()
  );
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  actionMessage = signal<string | null>(null);
  registeredPermits = computed(() =>
    this.permitRegistrationService.allPermits().filter((permit) => permit.isActive)
  );

  registrationNo = '';
  year = '';
  tankCapacity = '';
  mileagePerFullTank = '';

  permitDescription = '';
  permitStartDate = '';
  permitEndDate = '';
  permitFileName = '';

  permits: Permit[] = [];
  close = output();

  async ngOnInit(): Promise<void> {
    await this.permitRegistrationService.getAll();
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

  addPermit() {
    if (!this.permitDescription || !this.permitStartDate || !this.permitEndDate) return;

    this.permits.push({
      id: crypto.randomUUID(),
      description: this.permitDescription,
      startDate: this.permitStartDate,
      endDate: this.permitEndDate,
      fileName: this.permitFileName,
    });

    this.permitDescription = '';
    this.permitStartDate = '';
    this.permitEndDate = '';
    this.permitFileName = '';
  }

  removePermit(id: string) {
    this.permits = this.permits.filter(p => p.id !== id);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.permitFileName = input.files[0].name;
    }
  }

  reset() {
    this.registrationNo = '';
    this.year = '';
    this.tankCapacity = '';
    this.mileagePerFullTank = '';
    this.permitDescription = '';
    this.permitStartDate = '';
    this.permitEndDate = '';
    this.permitFileName = '';
    this.permits = [];
  }

  async onSubmit() {
    if (this.loading()) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.actionMessage.set('Saving vehicle...');
    try {
      const vehicleId = await this.vehicleService.create({
        registrationNo: this.registrationNo,
        registrationYear: this.year ? Number(this.year) : undefined,
        tankCapacity: Number(this.tankCapacity),
        mileagePerFullTank: Number(this.mileagePerFullTank),
        currentMileage: undefined,
        permits: [],
        isActive: true,
      });

      await Promise.all(
        this.permits.map((permit) =>
          this.vehiclePermitService.create({
            id: permit.id,
            description: permit.description,
            startDate: new Date(permit.startDate),
            endDate: new Date(permit.endDate),
            attachment: permit.fileName,
            vehicleId,
          })
        )
      );

      this.successMessage.set('Vehicle saved successfully.');
      await this.waitForLoadingToFinish();
      this.reset();
      this.close.emit();
    } catch (error) {
      this.errorMessage.set(String(error || 'Could not save vehicle. Please try again.'));
    } finally {
      this.actionMessage.set(null);
      this.isSubmitting.set(false);
    }
  }
}
