import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Trip } from '../../../models/trip.model';

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trip-detail.html'
})
export class TripDetail {
  trip = input<Trip | undefined>();
  close = output();
  
  totalExpenses = computed(() => {
    return (this.trip()?.expenses || []).reduce((sum, expense) => sum + expense.amount, 0);
  });

  goBack() {
    this.close.emit();
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-50 text-yellow-600 border-yellow-200',
      'inprogress': 'bg-blue-50 text-blue-600 border-blue-200',
      'completed': 'bg-emerald-50 text-emerald-600 border-emerald-200',
      'cancelled': 'bg-red-50 text-red-600 border-red-200'
    };
    return colors[status] || colors['pending'];
  }

  getCategoryColor(categoryName: string | undefined): string {
    const colors: Record<string, string> = {
      'fuel': 'bg-red-50 text-[#f25f2f] border-red-100',
      'toll': 'bg-orange-50 text-orange-600 border-orange-100',
      'food': 'bg-amber-50 text-amber-600 border-amber-100',
      'accommodation': 'bg-indigo-50 text-indigo-600 border-indigo-100',
      'maintenance': 'bg-purple-50 text-purple-600 border-purple-100',
      'other': 'bg-gray-50 text-gray-600 border-gray-100'
    };
    const name = (categoryName || 'other').toLowerCase();
    return colors[name] || colors['other'];
  }
}
