import { Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SaveArea } from '../../../shared/components/save-area/save-area';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SaveArea],
  templateUrl: './user-form.html'
})
export class UserForm {
  firstName = '';
  lastName = '';
  username = '';
  email = '';
  phone = '';
  role = 'ADMIN';
  isActive = true;

  saveText = signal('Save changes');
  close = output()

  constructor(private router: Router) {}

  cancel() {
    this.close.emit();
  }

  onSubmit() {
    console.log('User submitted');
    this.close.emit();
  }
}
