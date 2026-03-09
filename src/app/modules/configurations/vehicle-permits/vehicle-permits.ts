import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-vehicle-permits',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './vehicle-permits.html',
})
export class VehiclePermits {
  permitsList = [
    {
      id: 'PRM-001',
      name: 'Oversize Load Permit',
      authorizingBody: 'TANROADS',
      status: 'Active',
      createdDate: 'Oct 15, 2023',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      iconColor: 'text-emerald-500 bg-emerald-50'
    },
    {
      id: 'PRM-002',
      name: 'Fuel Tax Permit',
      authorizingBody: 'TRA',
      status: 'Active',
      createdDate: 'Nov 02, 2023',
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      iconColor: 'text-[#f25f2f] bg-red-50'
    },
    {
      id: 'PRM-003',
      name: 'Trip Permit',
      authorizingBody: 'SUMATRA',
      status: 'Inactive',
      createdDate: 'Sep 20, 2023',
      icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
      iconColor: 'text-amber-500 bg-amber-50'
    },
    {
      id: 'PRM-004',
      name: 'Hazardous Materials',
      authorizingBody: 'NEMC',
      status: 'Active',
      createdDate: 'Dec 01, 2023',
      icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      iconColor: 'text-amber-600 bg-amber-50'
    }
  ];

  currentPage = 1;
  totalPermits = 24;

  getStatusClass(status: string): string {
    return status.toLowerCase() === 'active'
      ? 'text-emerald-600'
      : 'text-amber-500';
  }

  getStatusDotClass(status: string): string {
    return status.toLowerCase() === 'active'
      ? 'bg-emerald-500'
      : 'bg-amber-500';
  }
}
