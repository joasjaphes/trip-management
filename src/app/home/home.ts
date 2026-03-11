import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { User } from '../models';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  badge?: string;
}

interface MenuGroup {
  label: string;
  icon?: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-home',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit {
  private router = inject(Router);
  private userService = inject(UserService);

  isSidebarOpen = signal(true);
  username = signal('');
  expandedGroups = signal<Record<string, boolean>>({
    Dashboard: false,
    'Trip Management': false,
    Configuration: false,
    'User Management': false,
  });

  menuGroups: MenuGroup[] = [
    {
      label: 'Dashboard',
      items: [
        { label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', route: '/dashboard' },
      ]
    },
    {
      label: 'Trip Management',
      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
      items: [
        { label: 'Trips', icon: 'M13 10V3L4 14h7v7l9-11h-7z', route: '/trips', badge: '2' },
        { label: 'Invoicing', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 2v8m0 0v2m0-2c-1.11 0-2.08-.402-2.599-1M14.599 9C14.08 8.402 13.11 8 12 8M21 12a9 9 0 11-18 0 9 9 0 0118 0z', route: '/invoicing' },
      ]
    },
    {
      label: 'Configuration',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
      items: [
        { label: 'Drivers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', route: '/drivers' },
        { label: 'Vehicles', icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2', route: '/vehicles' },
        { label: 'Vehicle Permits', icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2', route: '/vehicle-permits' },
        { label: 'Cargo Types', icon: 'M7 7h10M7 12h10M7 17h10', route: '/cargo-types' },
        { label: 'Customers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', route: '/customers' },
        { label: 'Expenses', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z', route: '/expense-categories' },
      ]
    },
    {
      label: 'User Management',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      items: [
        { label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', route: '/users' },
        { label: 'User Roles', icon: 'M9 12l2 2 4-4m5.618 5.091A9 9 0 1112 3a9 9 0 018.618 12.091z', route: '/user-roles' },
      ]
    }
  ];

  ngOnInit() {
    const token = localStorage.getItem('trip-management-token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }
    const currentUser: User = JSON.parse(localStorage.getItem('trip-management-user'));
    this.username.set(currentUser?.username || '');
    this.userService.getUsers().then();

  }

  toggleSidebar() {
    this.isSidebarOpen.set(!this.isSidebarOpen());
  }

  toggleGroup(groupLabel: string) {
    this.expandedGroups.update((groups) => ({
      ...groups,
      [groupLabel]: !groups[groupLabel],
    }));
  }

  isGroupExpanded(groupLabel: string) {
    return this.expandedGroups()[groupLabel] ?? true;
  }

  async logout() {
    await this.userService.logout();
    this.router.navigate(['/login']);
  }
}
