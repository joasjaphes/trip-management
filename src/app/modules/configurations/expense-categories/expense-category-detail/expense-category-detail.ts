import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-expense-category-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expense-category-detail.html'
})
export class ExpenseCategoryDetail {
  constructor(private router: Router) {}

  category = {
    name: 'Fuel & Maintenance',
    parentCategory: 'Fleet Operations',
    description: 'Includes all direct costs associated with vehicle refueling, oil changes, engine repairs, tire replacements, and scheduled preventative maintenance for the entire trucking fleet.',
    status: 'Active',
    createdDate: 'Jan 12, 2024',
  };

  goBack() {
    this.router.navigate(['/expense-categories']);
  }
}
