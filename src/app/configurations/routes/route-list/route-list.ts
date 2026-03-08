import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-route-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './route-list.html',
})
export class RouteList {
  stats = [
    { label: 'Total Routes', value: '42' },
    { label: 'Active Lanes', value: '38' },
    { label: 'Avg. Mileage', value: '645 km' },
    { label: 'On-Time Rate', value: '94.2%', highlight: true },
  ];

  routesList = [
    { id: 'RT-4401', name: 'Central Express', start: 'Dar es Salaam', end: 'Dodoma', mileage: '460 km', duration: '6h 30m', status: 'Active' },
    { id: 'RT-4402', name: 'Northern Corridor', start: 'Dar es Salaam', end: 'Arusha', mileage: '635 km', duration: '8h 15m', status: 'Active' },
    { id: 'RT-4403', name: 'Lake Zone Shuttle', start: 'Mwanza', end: 'Dar es Salaam', mileage: '1,100 km', duration: '14h 45m', status: 'Inactive' },
    { id: 'RT-4404', name: 'Southern Highlands', start: 'Dar es Salaam', end: 'Mbeya', mileage: '840 km', duration: '9h 15m', status: 'Active' },
    { id: 'RT-4405', name: 'Cross-Border Longhaul', start: 'Dar es Salaam', end: 'Lusaka', mileage: '1,850 km', duration: '26h 10m', status: 'Active' },
  ];

  currentPage = 1;
  totalRoutes = 42;

  getStatusClass(status: string): string {
    return status.toLowerCase() === 'active'
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-gray-100 text-gray-500 border border-gray-200';
  }
}
