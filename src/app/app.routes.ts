import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./login/login').then(m => m.Login),
    },
    {
        path: '',
        canActivate: [authGuard],
        loadComponent: () => import('./home/home').then(m => m.Home),
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                loadComponent: () => import('./modules/dashboard/dashboard').then(m => m.Dashboard),
            },
            {
                path: 'trips',
                loadComponent: () => import('./modules/trips/trips').then(m => m.Trips),
            },
            {
                path: 'invoicing',
                loadComponent: () => import('./modules/trips/invoicing/invoicing').then(m => m.Invoicing),
            },
            {
                path: 'trips/new',
                loadComponent: () => import('./modules/trips/trip-form/trip-form').then(m => m.TripForm),
            },
            {
                path: 'trips/:id',
                loadComponent: () => import('./modules/trips/trip-detail/trip-detail').then(m => m.TripDetail),
            },
            {
                path: 'drivers',
                loadComponent: () => import('./modules/configurations/drivers/driver-list/driver-list').then(m => m.DriverList),
            },
            {
                path: 'drivers/new',
                loadComponent: () => import('./modules/configurations/drivers/driver-form/driver-form').then(m => m.DriverForm),
            },
            {
                path: 'drivers/:id',
                loadComponent: () => import('./modules/configurations/drivers/driver-detail/driver-detail').then(m => m.DriverDetail),
            },
            {
                path: 'vehicles',
                loadComponent: () => import('./modules/configurations/vehicles/vehicle-list/vehicle-list').then(m => m.VehicleList),
            },
            {
                path: 'vehicles/new',
                loadComponent: () => import('./modules/configurations/vehicles/vehicle-form/vehicle-form').then(m => m.VehicleForm),
            },
            {
                path: 'vehicles/:id',
                loadComponent: () => import('./modules/configurations/vehicles/vehicle-detail/vehicle-detail').then(m => m.VehicleDetail),
            },
            {
                path: 'vehicle-permits',
                loadComponent: () => import('./modules/configurations/vehicle-permits/vehicle-permits').then(m => m.VehiclePermits),
            },
            {
                path: 'vehicle-permits/new',
                loadComponent: () => import('./modules/configurations/vehicle-permits/permit-form/permit-form').then(m => m.PermitForm),
            },
            {
                path: 'vehicle-permits/:id',
                loadComponent: () => import('./modules/configurations/vehicle-permits/permit-detail/permit-detail').then(m => m.PermitDetail),
            },
            {
                path: 'routes',
                loadComponent: () => import('./modules/configurations/routes/route-list/route-list').then(m => m.RouteList),
            },
            {
                path: 'routes/new',
                loadComponent: () => import('./modules/configurations/routes/route-form/route-form').then(m => m.RouteForm),
            },
            {
                path: 'routes/:id',
                loadComponent: () => import('./modules/configurations/routes/route-detail/route-detail').then(m => m.RouteDetail),
            },
            {
                path: 'expense-categories',
                loadComponent: () => import('./modules/configurations/expense-categories/expense-categories').then(m => m.ExpenseCategories),
            },
            {
                path: 'cargo-types',
                loadComponent: () => import('./modules/configurations/cargo-types/cargo-types').then(m => m.CargoTypes),
            },
            {
                path: 'cargo-types/new',
                loadComponent: () => import('./modules/configurations/cargo-types/cargo-type-form/cargo-type-form').then(m => m.CargoTypeForm),
            },
            {
                path: 'expense-categories/new',
                loadComponent: () => import('./modules/configurations/expense-categories/expense-category-form/expense-category-form').then(m => m.ExpenseCategoryForm),
            },
            {
                path: 'expense-categories/:id',
                loadComponent: () => import('./modules/configurations/expense-categories/expense-category-detail/expense-category-detail').then(m => m.ExpenseCategoryDetail),
            },
            {
                path: 'users',
                loadComponent: () => import('./modules/users/user-list/user-list').then(m => m.UserList),
            },
            {
                path: 'user-roles',
                loadComponent: () => import('./modules/users/user-roles/user-roles').then(m => m.UserRoles),
            },
            {
                path: 'users/new',
                loadComponent: () => import('./modules/users/user-form/user-form').then(m => m.UserForm),
            },
            {
                path: 'users/:id',
                loadComponent: () => import('./modules/users/user-detail/user-detail').then(m => m.UserDetail),
            },
            {
                path: 'users/:id/edit',
                loadComponent: () => import('./modules/users/user-form/user-form').then(m => m.UserForm),
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];
