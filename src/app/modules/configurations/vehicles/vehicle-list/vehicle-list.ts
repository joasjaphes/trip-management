import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './vehicle-list.html',
})
export class VehicleList {
  vehiclesList = [
    {
      id: 'TRK-001-20',
      year: 2020,
      tankCapacity: '500 L',
      mileagePerFullTank: '2000 KM',
      permitExpiry: 'Dec 01, 2024',
      status: 'active'
    },
    {
      id: 'TRK-002-21',
      year: 2021,
      tankCapacity: '450 L',
      mileagePerFullTank: '1800 KM',
      permitExpiry: 'Nov 15, 2024',
      status: 'active'
    },
    {
      id: 'TRK-003-20',
      year: 2020,
      tankCapacity: '550 L',
      mileagePerFullTank: '2200 KM',
      permitExpiry: 'Jan 10, 2025',
      status: 'active'
    },
    {
      id: 'TRK-004-19',
      year: 2019,
      tankCapacity: '500 L',
      mileagePerFullTank: '1950 KM',
      permitExpiry: 'Sep 30, 2024',
      status: 'expiring'
    }
  ];

  currentPage = 1;
  totalPages = 3;
  totalVehicles = 124;
}
