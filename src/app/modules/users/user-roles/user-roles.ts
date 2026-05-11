import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTable, TableConfig } from '../../../shared/components/data-table/data-table';
import { Layout, SplitSize } from '../../../shared/components/layout/layout';
import { RoleService } from '../../../services/role.service';
import { RoleForm } from './role-form';
import { PERMISSION_MODULES, DEFAULT_ROLE_PERMISSIONS } from './permission-modules';
import { UserRole } from '../../../models';

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

@Component({
  selector: 'app-user-roles',
  standalone: true,
  imports: [CommonModule, DataTable, Layout, RoleForm],
  templateUrl: './user-roles.html',
  styleUrl: './user-roles.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserRoles implements OnInit {
  private roleService = inject(RoleService);

  title = signal('User roles');
  description = signal('Manage system roles and the permissions attached to each role.');
  addText = signal('Add new role');
  viewDetails = signal(false);
  formTitle = signal('Add new role');
  formDescription = signal('Create a role and select the permissions it should have.');
  saveButtonText = signal('Save role');
  splitSize = signal<SplitSize>('full');
  permissionModules = signal(PERMISSION_MODULES);
  selectedPermissions = signal<Set<string>>(new Set(DEFAULT_ROLE_PERMISSIONS));
  roles = this.roleService.roles;
  currentRole = signal<UserRole | null>(null);
  loading = this.roleService.loadingRoles;
  viewType = '';

  tableConfigurations: TableConfig = {
    columns: [
      { key: 'name', label: 'Role name' },
      //   { key: 'modulesCount', label: 'Modules' },
      //   { key: 'permissionsCount', label: 'Permissions' },
      { key: 'status', label: 'Status', type: 'status' },
    ],
    actions: {
      edit: true,
    }
  };

  selectedPermissionCount = computed(() => this.selectedPermissions().size);
  loadingRoles = signal(false);
  saving = signal(false);

  permissions = signal({
    edit: ['EDIT_ROLE'],
    view: ['VIEW_ROLES'],
    add: ['CREATE_ROLE'],
    delete: ['DELETE_ROLE'],
    more: {}
  });

  addPermission = signal('CREATE_ROLE');

  ngOnInit() {
    this.roleService.getRoles().then();
  }


  onAdd() {
    this.formTitle.set('Add new role');
    this.formDescription.set('Create a role and pick the permissions it should have.');
    this.currentRole.set(null);
    this.selectedPermissions.set(new Set(DEFAULT_ROLE_PERMISSIONS));
    this.viewType = 'add';
    this.viewDetails.set(true);
  }

  onEdit(role: UserRole) {
    this.formTitle.set('Edit role');
    this.formDescription.set('Modify the role details and permissions.');
    this.currentRole.set(role);
    this.selectedPermissions.set(new Set(role.permissions ?? []));
    this.viewType = 'edit';
    this.viewDetails.set(true);
  }

  onCloseForm(shouldRefresh = false) {
    this.viewDetails.set(false);
    this.formTitle.set('Add new role');
    this.formDescription.set('Create a role and pick the permissions it should have.');
    this.currentRole.set(null);
    this.selectedPermissions.set(new Set(DEFAULT_ROLE_PERMISSIONS));
    if (shouldRefresh) {
      this.roleService.getRoles().then();
    }
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
    // kept for backward compatibility but RoleForm now handles create/update
    return;
  }
}