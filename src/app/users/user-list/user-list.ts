import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './user-list.html',
})
export class UserList {
  openMenuId: string | null = null;

  usersList = [
    { id: 'USR-001', username: 'jdoe88', email: 'john.doe@easytrucking.com', firstName: 'John', lastName: 'Doe', role: 'ADMIN', status: 'Active', initials: 'JD' },
    { id: 'USR-002', username: 'asmith_mgr', email: 'a.smith@easytrucking.com', firstName: 'Alice', lastName: 'Smith', role: 'MANAGER', status: 'Active', initials: 'AS' },
    { id: 'USR-003', username: 'bwilson', email: 'brian.w@easytrucking.com', firstName: 'Brian', lastName: 'Wilson', role: 'VIEWER', status: 'Inactive', initials: 'BW' },
    { id: 'USR-004', username: 'kbrown', email: 'k.brown@easytrucking.com', firstName: 'Kelly', lastName: 'Brown', role: 'MANAGER', status: 'Active', initials: 'KB' },
  ];

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'ADMIN': return 'bg-red-50 text-[#f02b3c]';
      case 'MANAGER': return 'bg-blue-50 text-blue-600';
      case 'VIEWER': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-100 text-gray-500';
    }
  }

  getStatusClass(status: string): string {
    return status === 'Active' ? 'text-emerald-600' : 'text-gray-400';
  }

  toggleMenu(id: string, event: Event) {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  closeMenu() {
    this.openMenuId = null;
  }
}
