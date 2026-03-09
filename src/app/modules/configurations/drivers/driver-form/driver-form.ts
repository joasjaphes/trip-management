import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-driver-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/drivers']);
  }

  onSubmit() {
    console.log('Driver submitted');
    this.router.navigate(['/drivers']);
  }
}
