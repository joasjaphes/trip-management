import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  stats = [
    {
      title: 'Total Trips',
      value: '156',
      change: '+12%',
      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
      color: 'bg-blue-500',
      link: '/trips'
    },
    {
      title: 'Active Drivers',
      value: '24',
      change: '+3%',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      color: 'bg-rose-500',
      link: '/drivers'
    },
    {
      title: 'Total Vehicles',
      value: '18',
      change: '0%',
      icon: 'M8 17a1 1 0 01-1-1V8a1 1 0 012 0v8a1 1 0 01-1 1zm4 0a1 1 0 01-1-1V8a1 1 0 012 0v8a1 1 0 01-1 1zm4 0a1 1 0 01-1-1V8a1 1 0 012 0v8a1 1 0 01-1 1z M3 19a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14z',
      color: 'bg-emerald-500',
      link: '/vehicles'
    },
    {
      title: 'Monthly Revenue',
      value: '$45,678',
      change: '+8%',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'bg-teal-500',
      link: '/trips'
    }
  ];

  recentTrips = [
    { id: 1, route: 'Nairobi - Mombasa', driver: 'John Kamau', vehicle: 'KBZ 123A', date: '2026-03-01', status: 'completed', revenue: 15000 },
    { id: 2, route: 'Nairobi - Kisumu', driver: 'Mary Wanjiku', vehicle: 'KCA 456B', date: '2026-03-01', status: 'in-progress', revenue: 12000 },
    { id: 3, route: 'Mombasa - Nairobi', driver: 'Peter Ochieng', vehicle: 'KBZ 789C', date: '2026-02-29', status: 'completed', revenue: 15500 },
    { id: 4, route: 'Nairobi - Eldoret', driver: 'Jane Akinyi', vehicle: 'KDA 321D', date: '2026-02-29', status: 'completed', revenue: 10000 },
  ];

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'in-progress':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'pending':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  }
}
