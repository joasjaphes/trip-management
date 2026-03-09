import { Component, inject, signal } from '@angular/core';
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
  addText = signal('Add new user')
  openMenuId: string | null = null;
  users = this.userService.users;
  loadingUsers = this.userService.loadingUsers;

  viewType = signal('');
  viewDetails = signal(false);
  formTitle = signal('');
  formDescription = signal('');
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
        label: 'Status'
      }
    ]
  }

  onAdd() {
    this.viewType.set('add');
    this.formTitle.set('Add new user')
    this.formDescription.set('Create a new user account with access permissions.')
    this.viewDetails.set(true);
  }

  onCloseForm() {
    this.viewDetails.set(false);
    this.viewType.set('');
    this.formTitle.set('');
    this.formDescription.set('');
  }
}
