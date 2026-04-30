import { Component, inject, input, output, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SaveArea } from '../../../shared/components/save-area/save-area';
import { RoleService, CreateRoleRequest } from '../../../services/role.service';
import { PERMISSION_MODULES, DEFAULT_ROLE_PERMISSIONS, PermissionModule } from './permission-modules';
import { UserRole } from '../../../models';

@Component({
    selector: 'app-role-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, SaveArea],
    templateUrl: './role-form.html',
    styleUrls: ['./role-form.css'],
})
export class RoleForm implements OnInit {
    private fb = inject(FormBuilder);
    private roleService = inject(RoleService);

    // Optional input role for edit mode
    role = input<UserRole | null>();
    close = output<boolean>();

    permissionModules = signal<PermissionModule[]>(PERMISSION_MODULES);
    selectedPermissions = signal<Set<string>>(new Set(DEFAULT_ROLE_PERMISSIONS));
    saveText = signal('Save role');
    loading = signal(false);
    formTitle = signal('Add new role');
    splitSize = signal('full');

    roleForm = this.fb.nonNullable.group({
        name: ['', [Validators.required, Validators.minLength(3)]],
    });

    isEditMode = computed(() => !!this.role()?.id);

    ngOnInit() {
        this.initializeFromRole();
    }

    private initializeFromRole() {
        const r = this.role();
        if (!r) {
            this.roleForm.reset({ name: '' });
            this.selectedPermissions.set(new Set(DEFAULT_ROLE_PERMISSIONS));
            this.formTitle.set('Add new role');
            return;
        }

        this.roleForm.patchValue({ name: r.name });
        this.selectedPermissions.set(new Set(r.permissions ?? []));
        this.formTitle.set('Edit role');
    }

    isPermissionSelected(permissionKey: string): boolean {
        return this.selectedPermissions().has(permissionKey);
    }

    isModuleFullySelected(module: PermissionModule): boolean {
        return module.permissions.every((permission) => this.selectedPermissions().has(permission.key));
    }

    toggleAllPermissions(selectAll: boolean) {
        // const next = new Set('ALL');
        if (selectAll) {
            this.selectedPermissions().clear();
            this.selectedPermissions().add('ALL');
        }else {
            this.selectedPermissions().clear();
        }

    }

    toggleModule(module: PermissionModule) {
        const next = new Set(this.selectedPermissions());
        const selectAll = !this.isModuleFullySelected(module);

        module.permissions.forEach((permission) => {
            if (selectAll) next.add(permission.key);
            else next.delete(permission.key);
        });

        this.selectedPermissions.set(next);
    }

    togglePermission(permissionKey: string, checked: boolean) {
        const next = new Set(this.selectedPermissions());
        if (checked) {
            next.add(permissionKey);
        }else {
            next.delete(permissionKey);
        }
        this.selectedPermissions.set(next);
    }

    async onSave() {
        this.loading.set(true);
        try {
            const values = this.roleForm.value;
            const payload: CreateRoleRequest = {
                id: this.role()?.id || '',
                name: (values.name || '').trim(),
                permissions: Array.from(this.selectedPermissions()),
            };

            let result: UserRole;
            if (this.isEditMode() && this.role()?.id) {
                result = await this.roleService.updateRole(this.role()!.id, payload);
            } else {
                result = await this.roleService.createRole(payload);
            }

            this.close.emit(true);
        } catch (e) {
            console.error('Failed to save role', e);
        } finally {
            this.loading.set(false);
        }
    }

    cancel() {
        this.close.emit(false);
    }
}
