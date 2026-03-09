import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SaveArea } from '../../../../shared/components/save-area/save-area';

@Component({
  selector: 'app-driver-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SaveArea],
  templateUrl: './driver-form.html'
})
export class DriverForm {
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

  onSubmit() {
    this.close.emit();
  }
}
