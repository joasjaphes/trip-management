import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './trips.html'
})
export class Trips {
  
  tripsList = [
    {
      id: 'TRP-8842',
      date: 'Oct 24, 2023',
      endDate: 'Oct 26, 2023',
      vehicle: 'Volvo FH16 (V-09)',
      driver: 'Marcus Sterling',
      route: 'New York',
      revenue: '$4,250.00',
      status: 'In-Progress'
    },
    {
      id: 'TRP-8841',
      date: 'Oct 23, 2023',
      endDate: 'Oct 24, 2023',
      vehicle: 'Scania R500 (V-12)',
      driver: 'Sarah Jenkins',
      route: 'Phoenix',
      revenue: '$2,100.00',
      status: 'Completed'
    },
    {
      id: 'TRP-8840',
      date: 'Oct 25, 2023',
      endDate: '-',
      vehicle: 'Freightliner (V-02)',
      driver: 'James Wilson',
      route: 'Atlanta',
      revenue: '$1,850.00',
      status: 'Pending'
    },
    {
      id: 'TRP-8839',
      date: 'Oct 22, 2023',
      endDate: 'Oct 23, 2023',
      vehicle: 'Kenworth T680 (V-15)',
      driver: 'Elena Rodriguez',
      route: 'Portland',
      revenue: '$0.00',
      status: 'Cancelled'
    }
  ];

  getStatusClass(status: string): string {
    switch(status.toLowerCase()) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'in-progress':
        return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      case 'pending':
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      case 'cancelled':
      case 'delayed':
        return 'bg-red-500/10 text-red-500 border border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border border-gray-500/20';
    }
  }
}
