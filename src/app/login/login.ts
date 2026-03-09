import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  username = signal('');
  password = signal('');
  isLoading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);

  constructor(private router: Router, private userService: UserService) {}

  async onSubmit() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      await this.userService.login(this.username(), this.password());
      this.router.navigate(['/']);
    } catch (e) {
      this.errorMessage.set('Invalid username or password');
    } finally {
      this.isLoading.set(false);
    }
  }

  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }
}
