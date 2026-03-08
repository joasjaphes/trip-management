import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-expense-categories',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './expense-categories.html',
})
export class ExpenseCategories {
  categoriesList = [
    {
      id: 'EXP-001',
      name: 'Fuel & Diesel',
      categoryType: 'Operational',
      typeColor: 'text-[#f02b3c]',
      status: 'Active',
      description: 'Main fuel costs including DEF and additives.',
      createdDate: 'Oct 12, 2023',
      icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
      iconColor: 'text-[#f02b3c] bg-red-50'
    },
    {
      id: 'EXP-002',
      name: 'Maintenance',
      categoryType: 'Fleet',
      typeColor: 'text-blue-500',
      status: 'Active',
      description: 'Regular maintenance and emergency repairs.',
      createdDate: 'Oct 15, 2023',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
      iconColor: 'text-amber-500 bg-amber-50'
    },
    {
      id: 'EXP-003',
      name: 'Bridge Tolls',
      categoryType: 'Logistics',
      typeColor: 'text-emerald-500',
      status: 'Active',
      description: 'Road, bridge, and highway usage fees.',
      createdDate: 'Nov 02, 2023',
      icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
      iconColor: 'text-emerald-500 bg-emerald-50'
    },
    {
      id: 'EXP-004',
      name: 'Driver Lodging',
      categoryType: 'Personnel',
      typeColor: 'text-purple-500',
      status: 'Inactive',
      description: 'Hotel stays for multi-day trips.',
      createdDate: 'Nov 20, 2023',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      iconColor: 'text-gray-400 bg-gray-100'
    }
  ];

  totalCategories = 12;

  getStatusClass(status: string): string {
    return status.toLowerCase() === 'active' ? 'text-emerald-600' : 'text-gray-400';
  }

  getStatusDotClass(status: string): string {
    return status.toLowerCase() === 'active' ? 'bg-emerald-500' : 'bg-gray-300';
  }
}
