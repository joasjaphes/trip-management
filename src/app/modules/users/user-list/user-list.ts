import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models';
import { DataTable, TableConfig } from '../../../shared/components/data-table/data-table';
import { Layout } from '../../../shared/components/layout/layout';
import { UserForm } from '../user-form/user-form';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, DataTable, Layout, UserForm],
  templateUrl: './user-list.html',
})
export class UserList {
  private userService = inject(UserService);

  title = signal('User management');
  description = signal('Manage system users');
  addText = signal('Add new user');
  openMenuId: string | null = null;
  users = this.userService.users;
  loadingUsers = this.userService.loadingUsers;

  viewType = signal('');
  viewDetails = signal(false);
  formTitle = signal('');
  formDescription = signal('');
  selectedUser = signal<User | null>(null);
  loading = this.userService.loadingUsers;

  permissions = signal({
    edit: ['EDIT_USER'],
    view: ['VIEW_USERS'],
    add: ['CREATE_USER'],
    delete: ['DELETE_USER'],
    more: {}
  });

  addPermission = signal('CREATE_USER');
  tableConfigurations: TableConfig = {
    columns: [
      {
        key: 'firstName',
        label: 'First name'
      },
      {
        key: 'surname',
        label: 'Surname'
      },
      {
        key: 'username',
        label: 'Username'
      },
      {
        key: 'status',
        label: 'Status',
        type:'status'
      }
    ],
    actions: {
      edit: true,
    },
  }

  onAdd() {
    this.selectedUser.set(null);
    this.viewType.set('add');
    this.formTitle.set('Add new user');
    this.formDescription.set('Create a new user account with access permissions.');
    this.viewDetails.set(true);
  }

  onEdit(user: User) {
    this.selectedUser.set(user);
    this.viewType.set('edit');
    this.formTitle.set('Edit user');
    this.formDescription.set('Update user details or change the password separately.');
    this.viewDetails.set(true);
  }

  onCloseForm() {
    this.viewDetails.set(false);
    this.viewType.set('');
    this.formTitle.set('');
    this.formDescription.set('');
    this.selectedUser.set(null);
    // refresh users list after changes
    this.userService.getUsers().catch((e) => console.error('Failed to refresh users', e));
  }

  async ngOnInit(): Promise<void> {
    await this.userService.getUsers();
  }
}
