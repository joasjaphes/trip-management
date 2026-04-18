import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, FormsModule, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  period = signal<'today' | 'weekly' | 'monthly' | 'custom'>('today');
  customStartDate = signal<string>('');
  customEndDate = signal<string>('');

  private multiplier = computed(() => {
    switch (this.period()) {
      case 'today': return 0.05;
      case 'weekly': return 0.25;
      case 'monthly': return 1.0;
      case 'custom': return 1.5; 
      default: return 1.0;
    }
  });

  readonly stats = computed(() => {
    const mult = this.multiplier();
    return [
      {
        title: 'Total Revenue',
        value: `TZS ${(45678000 * mult).toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
        change: '+8%',
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        color: 'bg-teal-500',
        link: '/trips'
      },
      {
        title: 'Total Trips',
        value: Math.round(156 * mult).toString(),
        change: '+12%',
        icon: 'M13 10V3L4 14h7v7l9-11h-7z',
        color: 'bg-blue-500',
        link: '/trips'
      },
      {
        title: 'Active Trips',
        value: Math.round(18 * mult).toString(),
        change: '0%',
        icon: 'M8 17a1 1 0 01-1-1V8a1 1 0 012 0v8a1 1 0 01-1 1zm4 0a1 1 0 01-1-1V8a1 1 0 012 0v8a1 1 0 01-1 1zm4 0a1 1 0 01-1-1V8a1 1 0 012 0v8a1 1 0 01-1 1z M3 19a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14z',
        color: 'bg-emerald-500',
        link: '/vehicles'
      },
      {
        title: 'Total Outstanding',
        value: `TZS ${(35678000 * mult).toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
        change: '+3%',
        icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
        color: 'bg-rose-500',
        link: '/drivers'
      },
    ];
  });

  private allMockTrips = [
    { id: 1, route: 'Dar - Kasumbalesa', driver: 'John Kamau', vehicle: 'T 123 EAS', date: '2026-03-01', status: 'completed', revenue: 15000000 },
    { id: 2, route: 'Dar - Lubumbashi', driver: 'Mary Wanjiku', vehicle: 'T 435 EAD', date: '2026-03-01', status: 'in-progress', revenue: 15000000 },
    { id: 3, route: 'Dar - Lubumbashi', driver: 'Peter Ochieng', vehicle: 'T 467 EAB', date: '2026-02-29', status: 'completed', revenue: 15000000 },
    { id: 4, route: 'Nairobi - Eldoret', driver: 'Jane Akinyi', vehicle: 'KDA 321D', date: '2026-02-29', status: 'completed', revenue: 10000 },
    { id: 5, route: 'Dar - Arusha', driver: 'Ali Hassan', vehicle: 'T 999 xyz', date: '2026-03-10', status: 'pending', revenue: 800000 },
    { id: 6, route: 'Dodoma - Mbeya', driver: 'Juma Juma', vehicle: 'T 111 AAA', date: '2026-03-12', status: 'cancelled', revenue: 0 },
  ];

  readonly recentTrips = computed(() => {
    const startDate = this.customStartDate();
    const endDate = this.customEndDate();

    const tripsInRange = this.allMockTrips.filter((trip) => {
      if (startDate && trip.date < startDate) {
        return false;
      }

      if (endDate && trip.date > endDate) {
        return false;
      }

      return true;
    });

    // To simulate non-custom periods, we still slice the array differently.
    switch (this.period()) {
      case 'today': return this.allMockTrips.slice(0, 1);
      case 'weekly': return this.allMockTrips.slice(0, 3);
      case 'monthly': return this.allMockTrips.slice(0, 5);
      case 'custom': return tripsInRange;
      default: return this.allMockTrips.slice(0, 3);
    }
  });

  readonly tripStatusSummary = computed(() => {
    const currentTrips = this.recentTrips();
    const total = currentTrips.length;
    const countByStatus = {
      completed: currentTrips.filter((trip) => trip.status === 'completed').length,
      'in-progress': currentTrips.filter((trip) => trip.status === 'in-progress').length,
      pending: currentTrips.filter((trip) => trip.status === 'pending').length,
      cancelled: currentTrips.filter((trip) => trip.status === 'cancelled').length,
    };

    const rows = [
      { key: 'completed', label: 'Completed', count: countByStatus.completed, color: '#10b981' },
      { key: 'in-progress', label: 'In Progress', count: countByStatus['in-progress'], color: '#3b82f6' },
      { key: 'pending', label: 'Pending', count: countByStatus.pending, color: '#f59e0b' },
      { key: 'cancelled', label: 'Cancelled', count: countByStatus.cancelled, color: '#ef4444' },
    ];

    return rows.map((row) => ({
      ...row,
      percentage: total > 0 ? (row.count / total) * 100 : 0,
    }));
  });

  readonly tripStatusChartBackground = computed(() => {
    const summary = this.tripStatusSummary();
    let runningTotal = 0;
    const slices = summary
      .filter((item) => item.percentage > 0)
      .map((item) => {
        const start = runningTotal;
        const end = start + item.percentage;
        runningTotal = end;
        return `${item.color} ${start}% ${end}%`;
      });

    if (slices.length === 0) {
      return 'conic-gradient(#e5e7eb 0% 100%)';
    }

    return `conic-gradient(${slices.join(', ')})`;
  });

  readonly totalTrips = computed(() => this.recentTrips().length);

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

  toDateValue(value: string | undefined): Date | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  toDateString(value: Date | null): string {
    if (!value) {
      return '';
    }

    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  setCustomStartDate(value: Date | null) {
    this.customStartDate.set(this.toDateString(value));
  }

  setCustomEndDate(value: Date | null) {
    this.customEndDate.set(this.toDateString(value));
  }
}
