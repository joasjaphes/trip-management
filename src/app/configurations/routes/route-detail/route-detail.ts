import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-route-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './route-detail.html'
})
export class RouteDetail {
  constructor(private router: Router) {}

  route = {
    id: '#RT-8829',
    name: 'Central Express',
    mileage: '1,240 km',
    startLocation: 'Dar es Salaam',
    endLocation: 'Dodoma',
    estDuration: '6 hours 30 mins',
    assignedDriver: 'Juma Mwamba',
    status: 'In Transit',
  };

  activity = [
    { label: 'Created On', date: 'Oct 24, 2023 • 08:30 AM', detail: 'By Dispatcher Admin', color: 'bg-[#f25f2f]' },
    { label: 'Last Updated', date: 'Oct 25, 2023 • 02:15 PM', detail: 'By System Automation', color: 'bg-gray-300' },
    { label: 'Route Status Change', date: 'In Transit', detail: '10 mins ago', color: 'bg-[#f25f2f]' },
  ];

  goBack() {
    this.router.navigate(['/routes']);
  }
}
