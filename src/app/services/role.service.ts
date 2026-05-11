import { Injectable, signal } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { UserRole } from '../models';

export interface CreateRoleRequest {
  id?: string;
  name: string;
  permissions: string[];
}

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  roles = signal<UserRole[]>([]);
  loadingRoles = signal<boolean>(false);

  constructor(private http: HttpClientService) { }

  async getRoles(): Promise<UserRole[]> {
    this.loadingRoles.set(true);
    try {
      const roles = await this.http.get<UserRole[]>('roles');
      const mappedRoles = roles.map((r) => ({
        ...r,
        status: r.isActive ? 'Active' : 'Inactive',

      }));
      this.roles.set(mappedRoles);
      return roles;
    } catch (e) {
      console.error('Failed to get roles', e);
      throw e;
    } finally {
      this.loadingRoles.set(false);
    }
  }

  async createRole(request: CreateRoleRequest): Promise<UserRole> {
    try {
      const role = await this.http.post('roles', request) as UserRole;
      this.roles.update((roles) => [role, ...roles]);
      return role;
    } catch (e) {
      console.error('Failed to create role', e);
      throw e;
    }
  }

  async updateRole(
    roleId: string,
    request: CreateRoleRequest,
  ): Promise<UserRole> {
    try {
      const role = await this.http.put(`roles/${roleId}`, request) as UserRole;
      this.roles.update((roles) =>
        roles.map((r) => (r.id === roleId ? role : r)),
      );
      return role;
    } catch (e) {
      console.error('Failed to update role', e);
      throw e;
    }
  }

  async deleteRole(roleId: string): Promise<void> {
    try {
      await this.http.delete(`roles/${roleId}`);
      this.roles.update((roles) => roles.filter((r) => r.id !== roleId));
    } catch (e) {
      console.error('Failed to delete role', e);
      throw e;
    }
  }
}
