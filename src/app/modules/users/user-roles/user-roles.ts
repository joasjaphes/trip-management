import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataTable, TableConfig } from '../../../shared/components/data-table/data-table';
import { Layout } from '../../../shared/components/layout/layout';
import { RoleService } from '../../../services/role.service';
import { SaveArea } from '../../../shared/components/save-area/save-area';

interface PermissionItem {
  key: string;
  label: string;
}

interface PermissionModule {
  key: string;
  label: string;
  permissions: PermissionItem[];
}

interface RoleRow {
  id: string;
  name: string;
  modulesCount: number;
  permissionsCount: number;
  status: 'Active' | 'Inactive';
}

const PERMISSION_MODULES: PermissionModule[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    permissions: [{ key: 'VIEW_DASHBOARD', label: 'View Dashboard' }],
  },
  {
    key: 'trips',
    label: 'Trip Management',
    permissions: [
      { key: 'VIEW_TRIPS', label: 'View Trips' },
      { key: 'CREATE_TRIP', label: 'Create Trip' },
      { key: 'EDIT_TRIP', label: 'Edit Trip' },
      { key: 'DELETE_TRIP', label: 'Delete Trip' },
      { key: 'MANAGE_INVOICING', label: 'Manage Invoicing' },
    ],
  },
  {
    key: 'office-operations',
    label: 'Office Operations',
    permissions: [
      { key: 'VIEW_PURCHASE_ORDER', label: 'View Purchase Order' },
      { key: 'CREATE_PURCHASE_ORDER', label: 'Create Purchase Order' },
      { key: 'EDIT_PURCHASE_ORDER', label: 'Edit Purchase Order' },
      { key: 'DELETE_PURCHASE_ORDER', label: 'Delete Purchase Order' },
      { key: 'VIEW_EXPENSE_TRANSACTION', label: 'View Expense Transaction' },
      { key: 'CREATE_EXPENSE_TRANSACTION', label: 'Create Expense Transaction' },
      { key: 'EDIT_EXPENSE_TRANSACTION', label: 'Edit Expense Transaction' },
      { key: 'DELETE_EXPENSE_TRANSACTION', label: 'Delete Expense Transaction' },
    ],
  },
  {
    key: 'reports',
    label: 'Reports',
    permissions: [
      { key: 'VIEW_DEBTORS_STATEMENT_REPORT', label: 'View Debtors Statement Report' },
      { key: 'VIEW_TRIP_STATUS_REPORT', label: 'View Trip Status Report' },
      { key: 'VIEW_EXPIRING_PERMITS_REPORT', label: 'View Expiring Permits Report' },
    ],
  },
  {
    key: 'configuration',
    label: 'Configuration',
    permissions: [
      { key: 'VIEW_DRIVERS', label: 'View Drivers' },
      { key: 'CREATE_DRIVER', label: 'Create Driver' },
      { key: 'EDIT_DRIVER', label: 'Edit Driver' },
      { key: 'DELETE_DRIVER', label: 'Delete Driver' },
      { key: 'VIEW_VEHICLES', label: 'View Vehicles' },
      { key: 'CREATE_VEHICLE', label: 'Create Vehicle' },
      { key: 'EDIT_VEHICLE', label: 'Edit Vehicle' },
      { key: 'DELETE_VEHICLE', label: 'Delete Vehicle' },
      { key: 'VIEW_VEHICLE_PERMITS', label: 'View Vehicle Permits' },
      { key: 'MANAGE_VEHICLE_PERMITS', label: 'Manage Vehicle Permits' },
      { key: 'VIEW_ISSUING_AUTHORITIES', label: 'View Issuing Authorities' },
      { key: 'MANAGE_ISSUING_AUTHORITIES', label: 'Manage Issuing Authorities' },
      { key: 'VIEW_ROUTES', label: 'View Routes' },
      { key: 'CREATE_ROUTE', label: 'Create Route' },
      { key: 'EDIT_ROUTE', label: 'Edit Route' },
      { key: 'DELETE_ROUTE', label: 'Delete Route' },
      { key: 'VIEW_CARGO_TYPES', label: 'View Cargo Types' },
      { key: 'CREATE_CARGO_TYPE', label: 'Create Cargo Type' },
      { key: 'EDIT_CARGO_TYPE', label: 'Edit Cargo Type' },
      { key: 'DELETE_CARGO_TYPE', label: 'Delete Cargo Type' },
      { key: 'VIEW_CUSTOMERS', label: 'View Customers' },
      { key: 'CREATE_CUSTOMER', label: 'Create Customer' },
      { key: 'EDIT_CUSTOMER', label: 'Edit Customer' },
      { key: 'DELETE_CUSTOMER', label: 'Delete Customer' },
      { key: 'VIEW_VENDORS', label: 'View Vendors' },
      { key: 'CREATE_VENDOR', label: 'Create Vendor' },
      { key: 'EDIT_VENDOR', label: 'Edit Vendor' },
      { key: 'DELETE_VENDOR', label: 'Delete Vendor' },
      { key: 'VIEW_OFFLOADING_PLACES', label: 'View Offloading Places' },
      { key: 'CREATE_OFFLOADING_PLACE', label: 'Create Offloading Place' },
      { key: 'EDIT_OFFLOADING_PLACE', label: 'Edit Offloading Place' },
      { key: 'DELETE_OFFLOADING_PLACE', label: 'Delete Offloading Place' },
      { key: 'VIEW_EXPENSE_CATEGORIES', label: 'View Expense Categories' },
      { key: 'CREATE_EXPENSE_CATEGORY', label: 'Create Expense Category' },
      { key: 'EDIT_EXPENSE_CATEGORY', label: 'Edit Expense Category' },
      { key: 'DELETE_EXPENSE_CATEGORY', label: 'Delete Expense Category' },
      { key: 'VIEW_COMPANY_PROFILE', label: 'View Company Profile' },
      { key: 'EDIT_COMPANY_PROFILE', label: 'Edit Company Profile' },
    ],
  },
  {
    key: 'users',
    label: 'User Management',
    permissions: [
      { key: 'VIEW_USERS', label: 'View Users' },
      { key: 'CREATE_USER', label: 'Create User' },
      { key: 'EDIT_USER', label: 'Edit User' },
      { key: 'DELETE_USER', label: 'Delete User' },
      { key: 'VIEW_ROLES', label: 'View Roles' },
      { key: 'CREATE_ROLE', label: 'Create Role' },
      { key: 'EDIT_ROLE', label: 'Edit Role' },
      { key: 'DELETE_ROLE', label: 'Delete Role' },
    ],
  },
];

const DEFAULT_ROLE_PERMISSIONS = new Set<string>([
  'VIEW_DASHBOARD',
  'VIEW_TRIPS',
  'VIEW_PURCHASE_ORDER',
  'VIEW_EXPENSE_TRANSACTION',
  'VIEW_DEBTORS_STATEMENT_REPORT',
]);

@Component({
  selector: 'app-user-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DataTable, Layout, SaveArea],
  templateUrl: './user-roles.html',
  styleUrl: './user-roles.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserRoles implements OnInit {
  private fb = inject(FormBuilder);
  private roleService = inject(RoleService);

  title = signal('User roles');
  description = signal('Manage system roles and the permissions attached to each role.');
  addText = signal('Add new role');
  viewDetails = signal(false);
  formTitle = signal('Add new role');
  formDescription = signal('Create a role and select the permissions it should have.');
  saveButtonText = signal('Save role');

  roleForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
  });

  permissionModules = signal(PERMISSION_MODULES);
  selectedPermissions = signal<Set<string>>(new Set(DEFAULT_ROLE_PERMISSIONS));
  roles = signal<RoleRow[]>([]);

  tableConfigurations: TableConfig = {
    columns: [
      { key: 'name', label: 'Role name' },
    //   { key: 'modulesCount', label: 'Modules' },
    //   { key: 'permissionsCount', label: 'Permissions' },
      { key: 'status', label: 'Status', type: 'status' },
    ],
  };

  selectedPermissionCount = computed(() => this.selectedPermissions().size);
  loadingRoles = signal(false);
  saving = signal(false);

  ngOnInit() {
    this.loadRoles();
  }

  private async loadRoles() {
    this.loadingRoles.set(true);
    try {
      const apiRoles = await this.roleService.getRoles();
      const mappedRoles: RoleRow[] = apiRoles.map((role) => ({
        id: role.id,
        name: role.name,
        modulesCount: this.calculateModulesCount(role.permissions),
        permissionsCount: role.permissions.length,
        status: role.active ? 'Active' : 'Inactive',
      }));
      this.roles.set(mappedRoles);
    } catch (e) {
      console.error('Failed to load roles', e);
    } finally {
      this.loadingRoles.set(false);
    }
  }

  private calculateModulesCount(permissions: string[]): number {
    return this.permissionModules().filter((module) =>
      module.permissions.some((permission) => permissions.includes(permission.key)),
    ).length;
  }

  onAdd() {
    this.formTitle.set('Add new role');
    this.formDescription.set('Create a role and pick the permissions it should have.');
    this.roleForm.reset({ name: '' });
    this.selectedPermissions.set(new Set(DEFAULT_ROLE_PERMISSIONS));
    this.viewDetails.set(true);
  }

  onCloseForm() {
    this.viewDetails.set(false);
    this.formTitle.set('Add new role');
    this.formDescription.set('Create a role and pick the permissions it should have.');
    this.roleForm.reset({ name: '' });
    this.selectedPermissions.set(new Set(DEFAULT_ROLE_PERMISSIONS));
  }

  isPermissionSelected(permissionKey: string): boolean {
    return this.selectedPermissions().has(permissionKey);
  }

  isModuleFullySelected(module: PermissionModule): boolean {
    return module.permissions.every((permission) => this.selectedPermissions().has(permission.key));
  }

  toggleModule(module: PermissionModule) {
    const next = new Set(this.selectedPermissions());
    const selectAll = !this.isModuleFullySelected(module);

    module.permissions.forEach((permission) => {
      if (selectAll) {
        next.add(permission.key);
      } else {
        next.delete(permission.key);
      }
    });

    this.selectedPermissions.set(next);
  }

  togglePermission(permissionKey: string, checked: boolean) {
    const next = new Set(this.selectedPermissions());
    if (checked) {
      next.add(permissionKey);
    } else {
      next.delete(permissionKey);
    }
    this.selectedPermissions.set(next);
  }

  async createRole() {
    this.saving.set(true);
    // if (this.roleForm.invalid) {
    //   this.roleForm.markAllAsTouched();
    //   return;
    // }
    const data = this.roleForm.value;
    try {
      const roleName = data.name.trim();
      const permissions = Array.from(this.selectedPermissions());

      await this.roleService.createRole({
        name: roleName,
        permissions,
      });

      this.onCloseForm();
      await this.loadRoles();
    } catch (e) {
      console.error('Failed to create role', e);
    }
    this.saving.set(false);
  }
}