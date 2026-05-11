import { Component, output, signal, inject, OnInit, input, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SaveArea } from '../../../shared/components/save-area/save-area';
import { RoleService } from '../../../services/role.service';
import { UserService } from '../../../services/user.service';
import { User, UserRole } from '../../../models';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SaveArea],
  templateUrl: './user-form.html',
})
export class UserForm implements OnInit {
  private roleService = inject(RoleService);
  private userService = inject(UserService);
  private router = inject(Router);

  // Input user when editing (optional)
  user = input<User | null>();
  isEditMode = computed(() => !!this.user()?.id);

  firstName = '';
  lastName = '';
  username = '';
  email = null;
  phone = null;
  password = '';
  confirmPassword = '';
  selectedRoles: string[] = [];
  isActive = true;

  // show/hide dedicated change-password section when editing
  changePasswordMode = signal(false);

  availableRoles = signal<UserRole[]>([]);
  loadingRoles = signal(false);

  saveText = signal('Save changes');
  loading = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  actionMessage = signal<string | null>(null);
  close = output()

  ngOnInit() {
    this.loadAvailableRoles();
  }

  private async loadAvailableRoles() {
    this.loadingRoles.set(true);
    try {
      const roles = await this.roleService.getRoles();
      this.availableRoles.set(roles);
    } catch (e) {
      console.error('Failed to load roles', e);
    } finally {
      this.loadingRoles.set(false);
    }
  }

  constructor(private router2: Router) {

    // populate fields when a user is provided (works if input is set before or after init)
    effect(() => {
      const selected = this.user();
      if (!selected) {
        // reset fields for create mode
        this.firstName = '';
        this.lastName = '';
        this.username = '';
        this.email = '';
        this.phone = '';
        this.password = '';
        this.confirmPassword = '';
        this.selectedRoles = [];
        this.isActive = true;
        this.changePasswordMode.set(false);
        console.log('is edit mode', this.isEditMode());
        return;
      }

      // populate with existing user values
      this.firstName = selected.firstName ?? '';
      this.lastName = selected.surname ?? (selected as any).lastName ?? '';
      this.username = selected.username ?? '';
      this.email = selected.email ?? '';
      this.phone = selected.phoneNumber ?? '';
      this.selectedRoles = (selected.roles ?? []).map((role) =>
        typeof role === 'string' ? role : role.id
      );
      this.isActive = selected.isActive ?? true;
      // don't populate password fields for security
      this.password = '';
      this.confirmPassword = '';
    });
  }

  cancel() {
    this.close.emit();
  }

  private async waitForLoadingToFinish(timeoutMs = 3000): Promise<void> {
    const start = Date.now();
    while (this.loading() && Date.now() - start < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  async onSubmit() {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.actionMessage.set('Saving user...');
    this.loading.set(true);

    try {
      const payload: any = {
        firstName: this.firstName,
        surname: this.lastName,
        email: this.email ?? null,
        phoneNumber: this.phone ?? null,
        roles: this.selectedRoles,
        isActive: this.isActive,
      };

      // When creating a new user, include username and password
      if (!this.isEditMode()) {
        payload.username = this.username;
        if (this.password) payload.password = this.password;
        if (this.confirmPassword) payload.confirmPassword = this.confirmPassword;
      }

      // If editing and a user id exists, include it so the service updates instead of creating
      if (this.user()?.id) {
        payload.id = this.user()?.id;
      }

      await this.userService.saveUser(payload as any);
      this.successMessage.set('User saved successfully.');
    } catch (error) {
      this.errorMessage.set(String(error || 'Could not save user. Please try again.'));
    } finally {
      this.loading.set(false);
      this.actionMessage.set(null);
    }

    await this.waitForLoadingToFinish();
    if (!this.errorMessage()) {
      this.close.emit();
    }
  }

  toggleRole(roleId: string) {
    if (this.selectedRoles.includes(roleId)) {
      this.selectedRoles = this.selectedRoles.filter(r => r !== roleId);
    } else {
      this.selectedRoles = [...this.selectedRoles, roleId];
    }
  }

  async onChangePassword() {
    this.errorMessage.set(null);
    this.actionMessage.set('Updating password...');
    this.loading.set(true);
    try {
      if (!this.user()?.id) throw 'No user selected';
      if (!this.password) throw 'Password cannot be empty';
      if (this.password !== this.confirmPassword) throw 'Passwords do not match';
      await this.userService.changePassword(this.user()?.id, this.password);
      this.successMessage.set('Password updated successfully.');
      this.password = '';
      this.confirmPassword = '';
      this.changePasswordMode.set(false);
    } catch (err) {
      this.errorMessage.set(String(err || 'Failed to update password'));
    } finally {
      this.loading.set(false);
      this.actionMessage.set(null);
    }
  }
}
