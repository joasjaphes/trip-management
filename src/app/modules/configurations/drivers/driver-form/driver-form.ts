import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SaveArea } from '../../../../shared/components/save-area/save-area';
import { DriverService } from '../../../../services/driver.service';

@Component({
  selector: 'app-driver-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SaveArea],
  templateUrl: './driver-form.html'
})
export class DriverForm {
  private driverService = inject(DriverService);
  loading = this.driverService.loading;
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  actionMessage = signal<string | null>(null);

  firstName = '';
  lastName = '';
  email = '';
  phone = '';
  dateOfBirth = '';
  driverId = '';
  address = '';
  licenseNumber = '';
  licenseClass = '';
  issuingAuthority = '';
  licenseExpiry = '';
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
    this.actionMessage.set('Saving driver...');

    try {
      await this.driverService.create({
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email || undefined,
        phone: this.phone,
        address: this.address || undefined,
        dateOfBirth: this.dateOfBirth ? new Date(this.dateOfBirth) : undefined,
        licenseDetails: {
          licenseNumber: this.licenseNumber,
          issueDate: new Date(),
          expiryDate: this.licenseExpiry ? new Date(this.licenseExpiry) : new Date(),
          licenseClass: this.licenseClass || 'Professional',
          frontPagePhoto: undefined,
        },
        photo: undefined,
        isActive: this.isActive,
      });

      this.successMessage.set('Driver saved successfully.');
      await this.waitForLoadingToFinish();
      this.close.emit();
    } catch (error) {
      this.errorMessage.set(String(error || 'Could not save driver. Please try again.'));
    } finally {
      this.actionMessage.set(null);
    }
  }
}
