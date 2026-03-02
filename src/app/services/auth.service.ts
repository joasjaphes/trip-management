import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  isAuthenticated(): boolean {
    return localStorage.getItem('isAuthenticated') === 'true';
  }

  logout(): void {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
  }

  login(username: string): void {
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('username', username);
  }

  getUsername(): string {
    return localStorage.getItem('username') || 'User';
  }
}
