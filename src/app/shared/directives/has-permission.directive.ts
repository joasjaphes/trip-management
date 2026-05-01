import { Directive, Input, OnChanges, TemplateRef, ViewContainerRef } from '@angular/core';
import { User, UserRole } from '../../models';

type PermissionMode = 'any' | 'all';

@Directive({
    selector: '[appHasPermission]',
    standalone: true,
})
export class HasPermissionDirective {
    @Input() appHasPermission: string | string[] = '';
    @Input() appHasPermissionMode: PermissionMode = 'any';

    private hasView = false;

    constructor(
        private templateRef: TemplateRef<unknown>,
        private viewContainer: ViewContainerRef,
    ) { }

    ngOnChanges(): void {
        this.updateView();
    }

    private updateView(): void {
        const requiredPermissions = this.normalizePermissions(this.appHasPermission);
        const userPermissions = this.getCurrentUserPermissions();

        const allowed = this.hasPermission(userPermissions, requiredPermissions);

        if (allowed && !this.hasView) {
            this.viewContainer.createEmbeddedView(this.templateRef);
            this.hasView = true;
            return;
        }

        if (!allowed && this.hasView) {
            this.viewContainer.clear();
            this.hasView = false;
        }
    }

    private hasPermission(
        userPermissions: Set<string>,
        required: string[],
    ): boolean {
        if (!userPermissions.size || !required.length || required.includes('ALL')) {
            return true;
        }

        return required.some((permission) => userPermissions.has(permission));
    }

    private normalizePermissions(value: string | string[]): string[] {
        if (Array.isArray(value)) {
            return value.filter(Boolean);
        }

        return value ? [value] : [];
    }

    private getCurrentUserPermissions(): Set<string> {
        const userRaw = localStorage.getItem('trip-management-user');
        if (!userRaw) {
            return new Set();
        }

        try {
            const currentUser = JSON.parse(userRaw) as User;
            if (!Array.isArray(currentUser?.permissions)) {
                return new Set<string>();
            }
            const permissionSet = new Set<string>(currentUser.permissions || []);



            return permissionSet;
        } catch {
            return new Set();
        }
    }
}
