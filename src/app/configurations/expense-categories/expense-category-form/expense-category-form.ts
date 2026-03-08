import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-expense-category-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expense-category-form.html'
})
export class ExpenseCategoryForm {
  categoryName = '';
  parentCategory = '';
  description = '';
  isActive = true;

  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/expense-categories']);
  }

  onSubmit() {
    console.log('Category submitted');
    this.router.navigate(['/expense-categories']);
  }
}
