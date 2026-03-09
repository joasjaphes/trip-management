import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SaveArea } from '../../../../shared/components/save-area/save-area';

@Component({
  selector: 'app-route-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SaveArea],
  templateUrl: './route-form.html'
})
export class RouteForm {
  routeName = '';
  startLocation = '';
  endLocation = '';
  mileage = '0.00';
  estimatedDuration = '';
  isActive = true;
  close = output();

  goBack() {
    this.close.emit();
  }

  onSubmit() {
    this.close.emit();
  }
}
