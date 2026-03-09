import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-detail.html'
})
export class UserDetail {
  constructor(private router: Router) {}

  user = {
    firstName: 'Johnathan',
    lastName: 'Miller',
    username: 'jmiller_ops',
    email: 'j.miller@easytrucking.com',
    phone: '+1 (555) 012-3456',
    role: 'Administrator',
    status: 'Active',
    id: '88234-ET',
    registeredOn: 'Oct 12, 2023',
    initials: 'JM'
  };

  goBack() {
    this.router.navigate(['/users']);
  }
}
