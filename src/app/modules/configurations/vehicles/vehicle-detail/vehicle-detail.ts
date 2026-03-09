import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-vehicle-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehicle-detail.html'
})
export class VehicleDetail {
  constructor(private router: Router) {}

  permits = [
    { type: 'IFTA License', idNumber: 'IFTA-2023-9981', issuedDate: 'Jan 01, 2023', expiry: 'Dec 31, 2023', status: 'Expiring Soon' },
    { type: 'Heavy Vehicle Use Tax (2290)', idNumber: 'HVUT-TX-4402', issuedDate: 'Jul 15, 2023', expiry: 'Jun 30, 2024', status: 'Valid' },
    { type: 'Apportioned Registration (IRP)', idNumber: 'IRP-REG-00122', issuedDate: 'Feb 10, 2023', expiry: 'Feb 09, 2024', status: 'Valid' },
  ];

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'valid':
        return 'text-emerald-600 bg-emerald-50';
      case 'expiring soon':
        return 'text-amber-600 bg-amber-50';
      case 'expired':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  }

  goBack() {
    this.router.navigate(['/vehicles']);
  }
}
