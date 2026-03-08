import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/users']);
  }

  onSubmit() {
    console.log('User submitted');
    this.router.navigate(['/users']);
  }
}
