import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SaveArea } from '../../../../shared/components/save-area/save-area';

@Component({
  selector: 'app-expense-category-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SaveArea],
  templateUrl: './expense-category-form.html'
})
export class ExpenseCategoryForm {
  expenseName = '';
  category = 'GENERAL';
  description = '';
  isActive = true;
  close = output();

  goBack() {
    this.close.emit();
  }

  onSubmit() {
    this.close.emit();
  }
}
