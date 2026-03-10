import { Component, inject, output } from '@angular/core';
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

  async onSubmit() {
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

    this.close.emit();
  }
}
