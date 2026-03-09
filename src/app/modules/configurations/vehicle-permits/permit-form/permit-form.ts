import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SaveArea } from '../../../../shared/components/save-area/save-area';

@Component({
  selector: 'app-permit-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SaveArea],
  templateUrl: './permit-form.html'
})
export class PermitForm {
  permitName = '';
  authorizingBody = '';
  isActive = true;
  close = output();

  goBack() {
    this.close.emit();
  }

  onSubmit() {
    this.close.emit();
  }
}
