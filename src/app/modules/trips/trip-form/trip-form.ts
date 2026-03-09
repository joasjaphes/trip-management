import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SaveArea } from '../../../shared/components/save-area/save-area';

@Component({
  selector: 'app-trip-form',
  standalone: true,
  imports: [CommonModule, SaveArea],
  templateUrl: './trip-form.html',
})
export class TripForm {
  close = output();

  goBack() {
    this.close.emit();
  }

  onSubmit() {
    this.close.emit();
  }
}
