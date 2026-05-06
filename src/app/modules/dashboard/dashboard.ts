import { Component, computed, inject, Inject, resource, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { HttpClientService } from '../../services/http-client.service';
import { TripService } from '../../services/trip.service';
import moment from 'moment';
import { Trip, TripStatus } from '../../models';
import { Placeholder } from '../../shared/components/placeholder/placeholder';

const RECENT_TRIPS_LIMIT = 10;



export type DashboardSummary = {
  totalRevenue: number;
  totalTrips: number;
  activeTrips: number;
  outstandingAmount: number;
  completedTrips: number;
  inProgressTrips: number;
  overstayedTrips: number;
  recentTrips: Trip[];
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, FormsModule, MatDatepickerModule, MatNativeDateModule, Placeholder, DecimalPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  period = signal<'today' | 'weekly' | 'monthly' | 'custom'>('monthly');
  customStartDate = signal<string>('');
  customEndDate = signal<string>('');
  http = inject(HttpClientService);
  private tripService = inject(TripService);
  summary = resource<DashboardSummary, { start: Date | null; end: Date | null }>({
    params: () => this.dateRange(),
    loader: async ({ params }) => {
      const start = moment(params.start).format('YYYY-MM-DD');
      const end = moment(params.end).format('YYYY-MM-DD');
      return await this.http.get<DashboardSummary>(`trips/stats?startDate=${start}&endDate=${end}`);
    }
  });
  loading = this.summary.isLoading;

  constructor() {
    void this.tripService.getAll();
  }

  dateRange = computed(() => {
    const today = new Date();
    switch (this.period()) {
      case 'today':
        return { start: today, end: today };
      case 'weekly': {
        // Current calendar week: Monday → Sunday.
        const day = today.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
        const diffToMonday = day === 0 ? -6 : 1 - day;
        const start = new Date(today);
        start.setDate(today.getDate() + diffToMonday);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return { start, end };
      }
      case 'monthly': {
        // Current calendar month: 1st → last day of the month.
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { start, end };
      }
      case 'custom':
        return {
          start: this.toDateValue(this.customStartDate()),
          end: this.toDateValue(this.customEndDate())
        };
    }
  });

  readonly stats = computed(() => {
    const summary = this.summary.value;
    return [
      {
        title: 'Total Revenue (TZS)',
        value: summary()?.totalRevenue || 0,
        change: '0%',
        // currency-dollar
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        color: 'bg-teal-500',
        link: '/trips'
      },
      {
        title: 'Total Trips',
        value: summary()?.totalTrips || 0,
        change: '0%',
        // truck
        icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1',
        color: 'bg-blue-500',
        link: '/trips'
      },
      {
        title: 'Active Trips',
        value: summary()?.activeTrips || 0,
        change: '0%',
        // play-circle (signifies running/active)
        icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        color: 'bg-emerald-500',
        link: '/trips'
      },
      {
        title: 'Total Outstanding (TZS)',
        value: summary()?.outstandingAmount || 0,
        change: '0%',
        // clock (signifies pending payment)
        icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
        color: 'bg-rose-500',
        link: '/trips'
      },
    ];
  });

  readonly recentTrips = computed(() => {
    const summary = this.summary.value;
    return summary()?.recentTrips;
  });
  tripStatus = TripStatus;
  readonly tripStatusSummary = computed(() => {
    const summary = this.summary.value;
    const total = summary()?.totalTrips || 0;
    const countByStatus = {
      completed: summary()?.completedTrips || 0,
      'in-progress': summary()?.inProgressTrips || 0,
      'overStayed': summary()?.overstayedTrips || 0,
    };

    const rows = [
      { key: 'completed', label: 'Completed', count: countByStatus.completed, color: '#10b981' },
      { key: 'in-progress', label: 'In Progress', count: countByStatus['in-progress'], color: '#3b82f6' },
      { key: 'overStayed', label: 'Overstayed', count: countByStatus['overStayed'], color: '#efc744' },
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

  readonly totalTrips = computed(() => this.summary.value().totalTrips || 0);

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
