import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, resource, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { User } from '../models';
import { HttpClientService } from '../services/http-client.service';
import { TripService } from '../services/trip.service';
import { NotificationService } from '../services/notification.service';
import { CompanyProfileService } from '../services/company-profile.service';
import { HasPermissionDirective } from '../shared/directives/has-permission.directive';
import { IdleTimeoutService } from '../services/idle-timeout.service';

type PermissionMode = 'any' | 'all';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  badge?: string;
  permission?: string | string[];
  permissionMode?: PermissionMode;
}

interface MenuGroup {
  label: string;
  icon?: string;
  items: MenuItem[];
  permission?: string | string[];
}

@Component({
  selector: 'app-home',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, HasPermissionDirective],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit, OnDestroy {
  private router = inject(Router);
  private userService = inject(UserService);
  private tripService = inject(TripService);
  private idleTimeoutService = inject(IdleTimeoutService);
  notificationService = inject(NotificationService);
  private companyProfileService = inject(CompanyProfileService);
  companyProfile = this.companyProfileService.profile;

  isSidebarOpen = signal(true);
  username = signal('');
  userRole = signal('');
  expandedGroups = signal<Record<string, boolean>>({
    Dashboard: false,
    'Trip Management': false,
    'Office Operations': false,
    Reports: false,
    Configuration: false,
    'User Management': false,
  });

  tripManagementBadge = resource({
    loader: () => this.tripService.getInprogressCount(),
  })

  private notificationRefreshIntervalId: ReturnType<typeof setInterval> | null = null;

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
      permission: ['VIEW_TRIPS', 'VIEW_INVOICE_PAYMENTS'],
      items: [
        { label: 'Trips', icon: 'M13 10V3L4 14h7v7l9-11h-7z', route: '/trips', badge: `${this.tripManagementBadge.value()}`, permission: 'VIEW_TRIPS' },
        { label: 'Invoicing', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 2v8m0 0v2m0-2c-1.11 0-2.08-.402-2.599-1M14.599 9C14.08 8.402 13.11 8 12 8M21 12a9 9 0 11-18 0 9 9 0 0118 0z', route: '/invoicing', permission: 'VIEW_INVOICE_PAYMENTS' },
      ]
    },
    {
      label: 'Office Operations',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      permission: ['VIEW_PURCHASE_ORDER', 'VIEW_EXPENSE_TRANSACTION', 'VIEW_VEHICLE_MAINTENANCE'],
      items: [
        { label: 'Purchases', icon: 'M3 4h18M3 10h18M3 16h18M3 22h18', route: '/purchases', permission: 'VIEW_PURCHASE_ORDER' },
        { label: 'Expense Transactions', icon: 'M4 7h16M4 12h16M4 17h10', route: '/expense-transactions', permission: 'VIEW_EXPENSE_TRANSACTION' },
        { label: 'Vehicle Maintenance', icon: 'M14.7 6.3a1 1 0 010 1.4l-8.4 8.4A1 1 0 015.3 16l8.4-8.4a1 1 0 011.4 0zM19.071 4.929a3 3 0 10-4.243 4.243l.708.707-4.243 4.243a1 1 0 00-.263.5l-.5 2.5a1 1 0 001.16 1.16l2.5-.5a1 1 0 00.5-.263l4.243-4.243.707.708a3 3 0 104.243-4.243L19.07 4.93z', route: '/vehicle-maintenance', permission: 'VIEW_PURCHASE_ORDER' },
      ]
    },
    {
      label: 'Reports',
      icon: 'M9 17v-6m4 6V7m4 10v-3M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z',
      permission: [
        'VIEW_EXPIRING_PERMITS_REPORT',
        'VIEW_DRIVER_PERMITS_STATUS',
        'VIEW_VEHICLE_PERMITS_STATUS',
        'VIEW_EXPENDITURE_REPORT',
        'VIEW_DEBTORS_STATEMENT_REPORT',
        'VIEW_TRIP_REVENUE_REPORT',
        'VIEW_CASH_REPORT',
        'VIEW_VEHICLE_MAINTENANCE_COST_REPORT',
        'VIEW_VEHICLE_INCOME_VS_MAINTENANCE_REPORT',
      ],
      items: [
        { label: 'Drivers Permit Status', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7', route: '/reports/drivers-permit-status', permission: 'VIEW_DRIVER_PERMITS_STATUS' },
        { label: 'Vehicles Permit Status', icon: 'M8 7v8a2 2 0 002 2h6', route: '/reports/vehicles-permit-status', permission: 'VIEW_VEHICLE_PERMITS_STATUS' },
        { label: 'Expenditure Report', icon: 'M4 7h16M4 12h16M4 17h10', route: '/reports/expenditure', permission: 'VIEW_EXPENDITURE_REPORT' },
        { label: 'Debtors Report', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 2v8m0 0v2m0-2c-1.11 0-2.08-.402-2.599-1M14.599 9C14.08 8.402 13.11 8 12 8M21 12a9 9 0 11-18 0 9 9 0 0118 0z', route: '/reports/debtors', permission: 'VIEW_DEBTORS_STATEMENT_REPORT' },
        { label: 'Trip Revenue Report', icon: 'M13 10V3L4 14h7v7l9-11h-7z', route: '/reports/trip-revenue', permission: 'VIEW_TRIP_REVENUE_REPORT' },
        { label: 'Cash Report', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 2v8m0 0v2m0-2c-1.11 0-2.08-.402-2.599-1M14.599 9C14.08 8.402 13.11 8 12 8M21 12a9 9 0 11-18 0 9 9 0 0118 0z', route: '/reports/cash', permission: 'VIEW_CASH_REPORT' },
        // { label: 'Vehicle Maintenance Cost', icon: 'M14.7 6.3a1 1 0 010 1.4l-8.4 8.4A1 1 0 015.3 16l8.4-8.4a1 1 0 011.4 0zM19.071 4.929a3 3 0 10-4.243 4.243l.708.707-4.243 4.243a1 1 0 00-.263.5l-.5 2.5a1 1 0 001.16 1.16l2.5-.5a1 1 0 00.5-.263l4.243-4.243.707.708a3 3 0 104.243-4.243L19.07 4.93z', route: '/reports/vehicle-maintenance-cost', permission: 'VIEW_VEHICLE_MAINTENANCE_COST_REPORT' },
        { label: 'Vehicle Income Vs Maintenance Report', icon: 'M13 10V3L4 14h7v7l9-11h-7z', route: '/reports/vehicle-income-vs-maintenance', permission: 'VIEW_VEHICLE_INCOME_VS_MAINTENANCE_REPORT' },
      ]
    },
    {
      label: 'Configuration',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
      permission: ['VIEW_DRIVERS', 'VIEW_VEHICLES', 'VIEW_VEHICLE_PERMITS', 'VIEW_ISSUING_AUTHORITIES', 'VIEW_ROUTES', 'VIEW_CARGO_TYPES', 'VIEW_CUSTOMERS', 'VIEW_VENDORS', 'VIEW_OFFLOADING_PLACES', 'VIEW_EXPENSE_CATEGORIES', 'VIEW_COMPANY_PROFILE'],
      items: [
        { label: 'Drivers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', route: '/drivers', permission: 'VIEW_DRIVERS' },
        { label: 'Vehicles', icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2', route: '/vehicles', permission: 'VIEW_VEHICLES' },
        { label: 'Vehicle Permits', icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2', route: '/vehicle-permits', permission: 'VIEW_VEHICLE_PERMITS' },
        { label: 'Issuing Authorities', icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2', route: '/issuing-bodies', permission: 'VIEW_ISSUING_AUTHORITIES' },
        { label: 'Routes', icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2', route: '/routes', permission: 'VIEW_ROUTES' },
        { label: 'Cargo Types', icon: 'M7 7h10M7 12h10M7 17h10', route: '/cargo-types', permission: 'VIEW_CARGO_TYPES' },
        { label: 'Customers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', route: '/customers', permission: 'VIEW_CUSTOMERS' },
        { label: 'Vendors', icon: 'M4 7h16M4 12h16M4 17h10', route: '/vendors', permission: 'VIEW_VENDORS' },
        { label: 'Offloading Places', icon: 'M17.657 16.657L13.414 12.414A8 8 0 1112.414 13.414l4.243 4.243a1 1 0 01-1.414 1.414zM6 10a4 4 0 108 0 4 4 0 00-8 0z', route: '/offloading-places', permission: 'VIEW_OFFLOADING_PLACES' },
        { label: 'Expenses', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z', route: '/expense-categories', permission: 'VIEW_EXPENSE_CATEGORIES' },
        { label: 'Company Profile', icon: 'M12 4a8 8 0 100 16 8 8 0 000-16zm0 2a6 6 0 110 12A6 6 0 0112 6zm0 2a4 4 0 100 8 4 4 0 000-8z', route: '/company-profile', permission: 'VIEW_COMPANY_PROFILE' },
      ]
    },
    {
      label: 'User Management',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      permission: ['VIEW_USERS', 'VIEW_ROLES'],
      items: [
        { label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', route: '/users', permission: 'VIEW_USERS' },
        { label: 'User Roles', icon: 'M9 12l2 2 4-4m5.618 5.091A9 9 0 1112 3a9 9 0 018.618 12.091z', route: '/user-roles', permission: 'VIEW_ROLES' },
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
    console.log('Current user:', currentUser);
    this.username.set((`${currentUser?.firstName} ${currentUser?.surname}`) || '');
    this.userRole.set(currentUser?.roleName || '');
    this.userService.getUsers().then();
    void this.notificationService.loadAll();
    if (!this.companyProfileService.profile()) {
      void this.companyProfileService.get();
    }
    this.idleTimeoutService.start();
    this.notificationRefreshIntervalId = setInterval(() => {
      this.tripManagementBadge.reload();
      // void this.notificationService.loadAll();
    }, 30000); // Refresh every 30 seconds

  }

  ngOnDestroy(): void {
    this.idleTimeoutService.stop();
    if (this.notificationRefreshIntervalId !== null) {
      clearInterval(this.notificationRefreshIntervalId);
      this.notificationRefreshIntervalId = null;
    }
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
    this.idleTimeoutService.stop();
    await this.userService.logout();
    this.router.navigate(['/login']);
  }
}
