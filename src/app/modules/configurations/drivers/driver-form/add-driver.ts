import { Component, inject, signal, ChangeDetectionStrategy, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DriverService } from '../../../../services/driver.service';
import { Driver, DrivingLicense } from '../../../../models/driver.model';

@Component({
  selector: 'app-add-driver',
  imports: [FormsModule, CommonModule],
  templateUrl: './add-driver.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddDriver {
  private driverService = inject(DriverService);

  // Form state
  firstName = signal('');
  lastName = signal('');
  email = signal('');
  phone = signal('');
  address = signal('');
  dateOfBirth = signal('');
  licenseNumber = signal('');
  licenseClass = signal('Professional');
  isActive = signal(true);

  // Output event
  onSaved = output<void>();

  // Expose service loading state
  isLoading = this.driverService.loading;
  error = this.driverService.errorMessage;
  successMessage = signal<string | null>(null);
  actionMessage = signal<string | null>(null);

  private async waitForLoadingToFinish(timeoutMs = 6000): Promise<void> {
    const start = Date.now();
    while (this.isLoading() && Date.now() - start < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.firstName().trim() || !this.lastName().trim() || !this.phone().trim()) {
      return;
    }

    this.successMessage.set(null);
    this.actionMessage.set('Saving driver...');

    const newDriver: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'> = {
      firstName: this.firstName().trim(),
      lastName: this.lastName().trim(),
      email: this.email().trim() || undefined,
      phone: this.phone().trim(),
      address: this.address().trim() || undefined,
      dateOfBirth: this.dateOfBirth() ? new Date(this.dateOfBirth()) : undefined,
      licenseDetails: {
        licenseNumber: this.licenseNumber().trim(),
        issueDate: new Date(),
        expiryDate: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
        licenseClass: this.licenseClass(),
      },
      isActive: this.isActive(),
    };

    try {
      await this.driverService.create(newDriver);
      this.successMessage.set('Driver saved successfully.');
      await this.waitForLoadingToFinish();

      if (!this.error()) {
        this.reset();
        this.onSaved.emit();
      }
    } finally {
      this.actionMessage.set(null);
    }
  }

  reset(): void {
    this.firstName.set('');
    this.lastName.set('');
    this.email.set('');
    this.phone.set('');
    this.address.set('');
    this.dateOfBirth.set('');
    this.licenseNumber.set('');
    this.licenseClass.set('Professional');
    this.isActive.set(true);
  }
}
