import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-driver-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './driver-detail.html'
})
export class DriverDetail {
  constructor(private router: Router) {}

  driver = {
    name: 'Juma Mwamba',
    status: 'Active',
    id: '#DRV-98210',
    initials: 'JM',
    email: 'j.mwamba@logistics.co.tz',
    phone: '+255 712 345 678',
    dateOfBirth: 'March 22, 1990 (34 Years)',
    licenseClass: 'Class A Commercial (Hazmat Endorsed)',
    address: '48 Bagamoyo Road, Kinondoni, Dar es Salaam',
    licenseExpiry: 'September 12, 2026',
  };

  vehicle = {
    name: '2023 Freightliner Cascadia',
    plate: 'T 482 DES',
    vin: '1FTFW1E...',
    fuelLevel: '82%',
    odometer: '124,502 mi',
    lastService: 'Oct 20, 2023',
  };

  recentTrips = [
    { origin: 'Dar es Salaam', destination: 'Dodoma', date: 'Nov 12, 2023', distance: '460 km', status: 'Completed', duration: '6h 30m' },
    { origin: 'Arusha', destination: 'Dar es Salaam', date: 'Nov 10, 2023', distance: '635 km', status: 'Completed', duration: '8h 15m' },
    { origin: 'Mwanza', destination: 'Dar es Salaam', date: 'Nov 08, 2023', distance: '1100 km', status: 'Completed', duration: '14h 45m' },
  ];

  goBack() {
    this.router.navigate(['/drivers']);
  }
}
