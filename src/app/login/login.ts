import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

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

  constructor(private router: Router, private authService: AuthService) {}

  onSubmit() {
    this.errorMessage.set('');
    
    if (!this.username() || !this.password()) {
      this.errorMessage.set('Please enter both username and password');
      return;
    }

    this.isLoading.set(true);

    // Simulate API call
    setTimeout(() => {
      // For demo purposes, accept any credentials
      // In production, this would call an authentication service
      if (this.username() && this.password()) {
        this.authService.login(this.username());
        this.router.navigate(['/dashboard']);
      } else {
        this.errorMessage.set('Invalid username or password');
      }
      this.isLoading.set(false);
    }, 1000);
  }

  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }
}
