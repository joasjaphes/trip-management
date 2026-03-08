import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-driver-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './driver-list.html',
})
export class DriverList {
  driversList = [
    {
      id: 'DRV-4492',
      firstName: 'Juma',
      lastName: 'Mwamba',
      phone: '+255 712 345 678',
      licenseStatus: 'Valid',
      status: 'Active',
      initials: 'JM'
    },
    {
      id: 'DRV-8821',
      firstName: 'Amina',
      lastName: 'Hassan',
      phone: '+255 754 321 876',
      licenseStatus: 'Expiring Soon',
      status: 'Active',
      initials: 'AH'
    },
    {
      id: 'DRV-3310',
      firstName: 'Baraka',
      lastName: 'Kimaro',
      phone: '+255 689 012 345',
      licenseStatus: 'Valid',
      status: 'Inactive',
      initials: 'BK'
    },
    {
      id: 'DRV-2254',
      firstName: 'Rehema',
      lastName: 'Nyerere',
      phone: '+255 777 654 321',
      licenseStatus: 'Expired',
      status: 'Active',
      initials: 'RN'
    }
  ];

  currentPage = 1;
  totalDrivers = 128;

  getLicenseStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'valid':
        return 'text-emerald-600';
      case 'expiring soon':
        return 'text-amber-500';
      case 'expired':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  }

  getLicenseDotClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'valid':
        return 'bg-emerald-500';
      case 'expiring soon':
        return 'bg-amber-500';
      case 'expired':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-[#f25f2f] text-white';
      case 'inactive':
        return 'bg-gray-100 text-gray-600 border border-gray-200';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  }
}
