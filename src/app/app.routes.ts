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
                loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard),
            },
            {
                path: 'trips',
                loadComponent: () => import('./trips/trips').then(m => m.Trips),
            },
            {
                path: 'trips/new',
                loadComponent: () => import('./trips/trip-form/trip-form').then(m => m.TripForm),
            },
            {
                path: 'trips/:id',
                loadComponent: () => import('./trips/trip-detail/trip-detail').then(m => m.TripDetail),
            },
            {
                path: 'drivers',
                loadComponent: () => import('./configurations/drivers/driver-list/driver-list').then(m => m.DriverList),
            },
            {
                path: 'drivers/new',
                loadComponent: () => import('./configurations/drivers/driver-form/driver-form').then(m => m.DriverForm),
            },
            {
                path: 'drivers/:id',
                loadComponent: () => import('./configurations/drivers/driver-detail/driver-detail').then(m => m.DriverDetail),
            },
            {
                path: 'vehicles',
                loadComponent: () => import('./configurations/vehicles/vehicle-list/vehicle-list').then(m => m.VehicleList),
            },
            {
                path: 'vehicles/new',
                loadComponent: () => import('./configurations/vehicles/vehicle-form/vehicle-form').then(m => m.VehicleForm),
            },
            {
                path: 'vehicles/:id',
                loadComponent: () => import('./configurations/vehicles/vehicle-detail/vehicle-detail').then(m => m.VehicleDetail),
            },
            {
                path: 'vehicle-permits',
                loadComponent: () => import('./vehicle-permits/vehicle-permits').then(m => m.VehiclePermits),
            },
            {
                path: 'vehicle-permits/new',
                loadComponent: () => import('./vehicle-permits/permit-form/permit-form').then(m => m.PermitForm),
            },
            {
                path: 'vehicle-permits/:id',
                loadComponent: () => import('./vehicle-permits/permit-detail/permit-detail').then(m => m.PermitDetail),
            },
            {
                path: 'routes',
                loadComponent: () => import('./configurations/routes/route-list/route-list').then(m => m.RouteList),
            },
            {
                path: 'routes/new',
                loadComponent: () => import('./configurations/routes/route-form/route-form').then(m => m.RouteForm),
            },
            {
                path: 'routes/:id',
                loadComponent: () => import('./configurations/routes/route-detail/route-detail').then(m => m.RouteDetail),
            },
            {
                path: 'expense-categories',
                loadComponent: () => import('./configurations/expense-categories/expense-categories').then(m => m.ExpenseCategories),
            },
            {
                path: 'expense-categories/new',
                loadComponent: () => import('./configurations/expense-categories/expense-category-form/expense-category-form').then(m => m.ExpenseCategoryForm),
            },
            {
                path: 'expense-categories/:id',
                loadComponent: () => import('./configurations/expense-categories/expense-category-detail/expense-category-detail').then(m => m.ExpenseCategoryDetail),
            },
            {
                path: 'users',
                loadComponent: () => import('./users/user-list/user-list').then(m => m.UserList),
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];
